from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import List, Optional
from models import TeamCreate
from auth import require_role
from supabase_client import get_supabase

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/reviews/pending", response_model=List[dict])
async def list_pending_reviews(
    current_user: dict = Depends(require_role("admin")),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List pending reviews for moderation"""
    supabase = get_supabase()
    
    response = supabase.table("reviews").select(
        "*, teams(name), review_evidence(*)"
    ).eq("status", "pending").order(
        "created_at", desc=False  # Oldest first
    ).range(skip, skip + limit - 1).execute()
    
    return response.data or []

@router.get("/teams/pending", response_model=List[dict])
async def list_pending_teams(
    current_user: dict = Depends(require_role("admin")),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List teams pending verification"""
    supabase = get_supabase()
    
    response = supabase.table("teams").select("*").eq(
        "verified_status", "pending"
    ).order("created_at", desc=False).range(skip, skip + limit - 1).execute()
    
    return response.data or []

@router.post("/teams/{team_id}/verify", response_model=dict)
async def verify_team(
    team_id: str,
    current_user: dict = Depends(require_role("admin"))
):
    """Verify a team"""
    supabase = get_supabase()
    
    team = supabase.table("teams").select("id").eq("id", team_id).single().execute()
    
    if not team.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    try:
        supabase.table("teams").update({
            "verified_status": "verified"
        }).eq("id", team_id).execute()
        
        # Log action
        supabase.table("audit_logs").insert({
            "actor_user_id": current_user["user_id"],
            "action": "verify_team",
            "entity_type": "team",
            "entity_id": team_id
        }).execute()
        
        return {"message": "Team verified"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/teams/{team_id}/reject", response_model=dict)
async def reject_team(
    team_id: str,
    reason: str,
    current_user: dict = Depends(require_role("admin"))
):
    """Reject a team verification"""
    supabase = get_supabase()
    
    team = supabase.table("teams").select("id").eq("id", team_id).single().execute()
    
    if not team.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    try:
        supabase.table("teams").update({
            "verified_status": "rejected"
        }).eq("id", team_id).execute()
        
        # Log action
        supabase.table("audit_logs").insert({
            "actor_user_id": current_user["user_id"],
            "action": "reject_team",
            "entity_type": "team",
            "entity_id": team_id,
            "meta_json": {"reason": reason}
        }).execute()
        
        return {"message": "Team rejected"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/reports", response_model=List[dict])
async def list_reports(
    current_user: dict = Depends(require_role("admin")),
    status: str = Query("open", pattern="^(open|closed)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List user reports"""
    supabase = get_supabase()
    
    response = supabase.table("reports").select("*").eq(
        "status", status
    ).order("created_at", desc=False).range(skip, skip + limit - 1).execute()
    
    return response.data or []

@router.post("/reports/{report_id}/close", response_model=dict)
async def close_report(
    report_id: str,
    action_taken: str = Query(...),
    current_user: dict = Depends(require_role("admin"))
):
    """Close a report and take action"""
    supabase = get_supabase()
    
    report = supabase.table("reports").select("*").eq("id", report_id).single().execute()
    
    if not report.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    try:
        supabase.table("reports").update({
            "status": "closed"
        }).eq("id", report_id).execute()
        
        # Log action
        supabase.table("audit_logs").insert({
            "actor_user_id": current_user["user_id"],
            "action": f"close_report_{action_taken}",
            "entity_type": "report",
            "entity_id": report_id
        }).execute()
        
        return {"message": "Report closed"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/users/{user_id}/ban", response_model=dict)
async def ban_user(
    user_id: str,
    reason: str = Query(...),
    current_user: dict = Depends(require_role("admin"))
):
    """Ban a user"""
    supabase = get_supabase()
    
    try:
        supabase.table("profiles").update({
            "status": "banned"
        }).eq("user_id", user_id).execute()
        
        # Log action
        supabase.table("audit_logs").insert({
            "actor_user_id": current_user["user_id"],
            "action": "ban_user",
            "entity_type": "user",
            "entity_id": user_id,
            "meta_json": {"reason": reason}
        }).execute()
        
        return {"message": "User banned"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/users/{user_id}/unban", response_model=dict)
async def unban_user(
    user_id: str,
    current_user: dict = Depends(require_role("admin"))
):
    """Unban a user"""
    supabase = get_supabase()
    
    try:
        supabase.table("profiles").update({
            "status": "active"
        }).eq("user_id", user_id).execute()
        
        # Log action
        supabase.table("audit_logs").insert({
            "actor_user_id": current_user["user_id"],
            "action": "unban_user",
            "entity_type": "user",
            "entity_id": user_id
        }).execute()
        
        return {"message": "User unbanned"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/audit-logs", response_model=List[dict])
async def get_audit_logs(
    current_user: dict = Depends(require_role("admin")),
    entity_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get audit logs"""
    supabase = get_supabase()
    
    query = supabase.table("audit_logs").select("*")
    
    if entity_type:
        query = query.eq("entity_type", entity_type)
    
    response = query.order("created_at", desc=True).range(
        skip, skip + limit - 1
    ).execute()
    
    return response.data or []

@router.get("/dashboard/stats", response_model=dict)
async def get_dashboard_stats(
    current_user: dict = Depends(require_role("admin"))
):
    """Get admin dashboard statistics"""
    supabase = get_supabase()
    
    # Count pending reviews
    pending_reviews = supabase.table("reviews").select(
        "id", count="exact"
    ).eq("status", "pending").execute()
    
    # Count pending teams
    pending_teams = supabase.table("teams").select(
        "id", count="exact"
    ).eq("verified_status", "pending").execute()
    
    # Count open reports
    open_reports = supabase.table("reports").select(
        "id", count="exact"
    ).eq("status", "open").execute()
    
    # Total teams verified
    verified_teams = supabase.table("teams").select(
        "id", count="exact"
    ).eq("verified_status", "verified").execute()
    
    # Total approved reviews
    approved_reviews = supabase.table("reviews").select(
        "id", count="exact"
    ).eq("status", "approved").execute()
    
    return {
        "pending_reviews": pending_reviews.count or 0,
        "pending_teams": pending_teams.count or 0,
        "open_reports": open_reports.count or 0,
        "verified_teams": verified_teams.count or 0,
        "approved_reviews": approved_reviews.count or 0,
    }
