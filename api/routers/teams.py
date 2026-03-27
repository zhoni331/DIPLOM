from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import List, Optional
from models import TeamCreate, TeamUpdate, TeamResponse
from auth import get_current_user, require_role
from supabase_client import get_supabase
from services import TrustScoreCalculator

router = APIRouter(prefix="/teams", tags=["teams"])

@router.post("", response_model=dict)
async def create_team(
    request: TeamCreate,
    current_user: dict = Depends(require_role("contractor"))
):
    """Create a new team (contractor only)"""
    supabase = get_supabase()
    
    # Check if contractor already has a team
    existing = supabase.table("teams").select("id").eq(
        "owner_user_id", current_user["user_id"]
    ).execute()
    
    if existing.data and len(existing.data) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a team. Only one team per contractor."
        )
    
    try:
        response = supabase.table("teams").insert({
            "owner_user_id": current_user["user_id"],
            "name": request.name,
            "city": request.city,
            "description": request.description,
            "specialties": request.specialties,
            "years_experience": request.years_experience,
            "pricing_model": request.pricing_model,
            "verified_status": "pending"
        }).execute()
        
        return {
            "message": "Team created successfully",
            "team_id": response.data[0]["id"] if response.data else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("", response_model=List[TeamResponse])
async def list_teams(
    city: Optional[str] = Query(None),
    sort_by: str = Query("trust_score", pattern="^(trust_score|rating|review_count)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    List all verified teams with optional filtering
    Default sorting: trust_score (descending)
    """
    supabase = get_supabase()
    
    query = supabase.table("teams").select("*").eq("verified_status", "verified")
    
    if city:
        query = query.eq("city", city)
    
    # Order by requested field (descending)
    sort_field = {
        "trust_score": "trust_score",
        "rating": "avg_rating",
        "review_count": "review_count"
    }.get(sort_by, "trust_score")
    
    response = query.order(sort_field, desc=True).range(skip, skip + limit - 1).execute()
    
    return response.data or []

@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(team_id: str):
    """Get team details by ID"""
    supabase = get_supabase()
    
    response = supabase.table("teams").select("*").eq("id", team_id).single().execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    return response.data

@router.put("/{team_id}", response_model=dict)
async def update_team(
    team_id: str,
    request: TeamUpdate,
    current_user: dict = Depends(require_role("contractor"))
):
    """Update team details (owner only)"""
    supabase = get_supabase()
    
    # Check ownership
    team = supabase.table("teams").select("owner_user_id").eq("id", team_id).single().execute()
    
    if not team.data or team.data["owner_user_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own team"
        )
    
    update_data = request.dict(exclude_unset=True)
    
    try:
        supabase.table("teams").update(update_data).eq("id", team_id).execute()
        return {"message": "Team updated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{team_id}/analytics", response_model=dict)
async def get_team_analytics(team_id: str):
    """Get team analytics and statistics"""
    supabase = get_supabase()
    
    # Get team data
    team = supabase.table("teams").select("*").eq("id", team_id).single().execute()
    
    if not team.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Get reviews
    reviews = supabase.table("reviews").select("*").eq(
        "team_id", team_id
    ).eq("status", "approved").execute()
    
    return {
        "team_id": team_id,
        "team_name": team.data["name"],
        "trust_score": team.data["trust_score"],
        "avg_rating": team.data["avg_rating"],
        "total_reviews": team.data["review_count"],
        "verified_status": team.data["verified_status"],
        "created_at": team.data["created_at"]
    }
