from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import List, Optional
from models import ProjectCreate, ProjectUpdate, ProjectResponse
from auth import get_current_user, require_role
from supabase_client import get_supabase

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=dict)
async def create_project(
    request: ProjectCreate,
    current_user: dict = Depends(require_role("homeowner"))
):
    """Create a new project (homeowner only)"""
    supabase = get_supabase()
    
    # Verify team exists
    team = supabase.table("teams").select("id").eq("id", request.team_id).single().execute()
    if not team.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    try:
        response = supabase.table("projects").insert({
            "homeowner_user_id": current_user["user_id"],
            "team_id": request.team_id,
            "title": request.title,
            "description": request.description,
            "district": request.district,
            "start_date": request.start_date,
            "end_date": request.end_date,
            "status": "planned"
        }).execute()
        
        project_id = response.data[0]["id"] if response.data else None
        
        return {
            "message": "Project created successfully",
            "project_id": project_id
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    current_user: dict = Depends(require_role("homeowner")),
    status: Optional[str] = Query(None, pattern="^(planned|active|completed)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List user's projects"""
    supabase = get_supabase()
    
    query = supabase.table("projects").select(
        "*, teams(name)"
    ).eq("homeowner_user_id", current_user["user_id"])
    
    if status:
        query = query.eq("status", status)
    
    response = query.order("created_at", desc=True).range(
        skip, skip + limit - 1
    ).execute()
    
    return response.data or []

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get project details"""
    supabase = get_supabase()
    
    response = supabase.table("projects").select(
        "*, teams(name)"
    ).eq("id", project_id).single().execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if user has access (owner or contractor of the team)
    project = response.data
    if project["homeowner_user_id"] != current_user["user_id"]:
        # Check if current user is contractor of the team
        team = supabase.table("teams").select("owner_user_id").eq(
            "id", project["team_id"]
        ).single().execute()
        
        if not team.data or team.data["owner_user_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this project"
            )
    
    return response.data

@router.put("/{project_id}", response_model=dict)
async def update_project(
    project_id: str,
    request: ProjectUpdate,
    current_user: dict = Depends(require_role("homeowner"))
):
    """Update project (owner only)"""
    supabase = get_supabase()
    
    # Check ownership
    project = supabase.table("projects").select(
        "homeowner_user_id"
    ).eq("id", project_id).single().execute()
    
    if not project.data or project.data["homeowner_user_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own projects"
        )
    
    update_data = request.dict(exclude_unset=True)
    
    try:
        supabase.table("projects").update(update_data).eq("id", project_id).execute()
        return {"message": "Project updated successfully"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{project_id}", response_model=dict)
async def delete_project(
    project_id: str,
    current_user: dict = Depends(require_role("homeowner"))
):
    """Delete project (owner only)"""
    supabase = get_supabase()
    
    # Check ownership
    project = supabase.table("projects").select(
        "homeowner_user_id"
    ).eq("id", project_id).single().execute()
    
    if not project.data or project.data["homeowner_user_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own projects"
        )
    
    try:
        supabase.table("projects").delete().eq("id", project_id).execute()
        return {"message": "Project deleted successfully"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
