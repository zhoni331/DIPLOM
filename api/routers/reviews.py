from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import List, Optional
from datetime import datetime
from models import ReviewCreate, ReviewApprovalRequest, ReviewResponse, ReviewReplyCreate
from auth import get_current_user, require_role
from supabase_client import get_supabase
from services import TrustScoreCalculator

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post("", response_model=dict)
async def create_review(
    request: ReviewCreate,
    current_user: dict = Depends(require_role("homeowner"))
):
    """Create a new review (homeowner only)"""
    supabase = get_supabase()
    
    # Verify team exists
    team = supabase.table("teams").select("id").eq("id", request.team_id).single().execute()
    if not team.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Verify no duplicate review for same project
    if request.project_id:
        existing = supabase.table("reviews").select("id").eq(
            "project_id", request.project_id
        ).eq("homeowner_user_id", current_user["user_id"]).execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already reviewed this project"
            )
    
    try:
        # Determine verification type
        verification_type = "verified_project" if request.project_id else "unverified"
        
        response = supabase.table("reviews").insert({
            "team_id": request.team_id,
            "homeowner_user_id": current_user["user_id"],
            "project_id": request.project_id,
            "rating": request.rating,
            "title": request.title,
            "body": request.body,
            "status": "pending",  # Requires moderation
            "verification_type": verification_type
        }).execute()
        
        review_id = response.data[0]["id"] if response.data else None
        
        return {
            "message": "Review submitted for moderation",
            "review_id": review_id,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("", response_model=List[ReviewResponse])
async def list_reviews(
    team_id: Optional[str] = Query(None),
    status: str = Query("approved", pattern="^(approved|pending|rejected)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List reviews with optional filtering"""
    supabase = get_supabase()
    
    query = supabase.table("reviews").select("*").eq("status", status)
    
    if team_id:
        query = query.eq("team_id", team_id)
    
    response = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
    
    return response.data or []

@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(review_id: str):
    """Get review details"""
    supabase = get_supabase()
    
    response = supabase.table("reviews").select("*").eq("id", review_id).single().execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    return response.data

@router.post("/{review_id}/approve", response_model=dict)
async def approve_review(
    review_id: str,
    current_user: dict = Depends(require_role("admin"))
):
    """Approve a pending review (admin only)"""
    supabase = get_supabase()
    
    # Get review
    review = supabase.table("reviews").select("*").eq("id", review_id).single().execute()
    
    if not review.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    try:
        # Approve review
        supabase.table("reviews").update({
            "status": "approved"
        }).eq("id", review_id).execute()
        
        # Log action
        supabase.table("audit_logs").insert({
            "actor_user_id": current_user["user_id"],
            "action": "approve_review",
            "entity_type": "review",
            "entity_id": review_id
        }).execute()
        
        # Recalculate team trust score
        await recalculate_team_trust_score(review.data["team_id"], supabase)
        
        return {"message": "Review approved"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{review_id}/reject", response_model=dict)
async def reject_review(
    review_id: str,
    request: ReviewApprovalRequest,
    current_user: dict = Depends(require_role("admin"))
):
    """Reject a pending review (admin only)"""
    supabase = get_supabase()
    
    review = supabase.table("reviews").select("*").eq("id", review_id).single().execute()
    
    if not review.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    try:
        supabase.table("reviews").update({
            "status": "rejected",
            "rejection_reason": request.rejection_reason
        }).eq("id", review_id).execute()
        
        # Log action
        supabase.table("audit_logs").insert({
            "actor_user_id": current_user["user_id"],
            "action": "reject_review",
            "entity_type": "review",
            "entity_id": review_id,
            "meta_json": {"reason": request.rejection_reason}
        }).execute()
        
        return {"message": "Review rejected"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{review_id}/reply", response_model=dict)
async def create_reply(
    review_id: str,
    request: ReviewReplyCreate,
    current_user: dict = Depends(require_role("contractor"))
):
    """Contractor replies to a review"""
    supabase = get_supabase()
    
    # Get review
    review = supabase.table("reviews").select("team_id").eq("id", review_id).single().execute()
    
    if not review.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Verify contractor owns the team
    team = supabase.table("teams").select("owner_user_id").eq(
        "id", review.data["team_id"]
    ).single().execute()
    
    if not team.data or team.data["owner_user_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only reply to reviews of your team"
        )
    
    try:
        response = supabase.table("review_replies").insert({
            "review_id": review_id,
            "contractor_user_id": current_user["user_id"],
            "body": request.body,
            "status": "approved"
        }).execute()
        
        return {
            "message": "Reply posted",
            "reply_id": response.data[0]["id"] if response.data else None
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

async def recalculate_team_trust_score(team_id: str, supabase):
    """
    Recalculate trust score for a team based on approved reviews
    This is called whenever a review is approved/rejected
    """
    # Get all approved reviews for this team
    reviews_response = supabase.table("reviews").select(
        "id, rating, created_at, verification_type"
    ).eq("team_id", team_id).eq("status", "approved").execute()
    
    reviews = reviews_response.data or []
    
    if not reviews:
        # No approved reviews, reset score
        supabase.table("teams").update({
            "trust_score": 0,
            "avg_rating": 0,
            "review_count": 0,
            "trust_score_breakdown": {}
        }).eq("id", team_id).execute()
        return
    
    # Calculate average rating
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    
    # Count verified reviews
    verified_count = sum(
        1 for r in reviews if r["verification_type"] == "verified_project"
    )
    
    # Calculate trust score breakdown
    breakdown = TrustScoreCalculator.calculate_total_score(
        avg_rating=avg_rating,
        review_count=len(reviews),
        reviews=reviews,
        verified_count=verified_count
    )
    
    # Update team
    supabase.table("teams").update({
        "avg_rating": round(avg_rating, 2),
        "review_count": len(reviews),
        "trust_score": breakdown["total_score"],
        "trust_score_breakdown": breakdown
    }).eq("id", team_id).execute()
