from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from models import RegisterRequest, LoginRequest, TokenResponse
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from supabase_client import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=dict)
async def register(request: RegisterRequest):
    """Register a new user"""
    supabase = get_supabase()
    
    try:
        # Create auth user via Supabase
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {"full_name": request.full_name, "role": request.role}
            }
        })
        
        user_id = response.user.id if response.user else None
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        # Create user role
        supabase.table("user_roles").insert({
            "user_id": user_id,
            "role": request.role
        }).execute()
        
        # Create profile
        supabase.table("profiles").insert({
            "user_id": user_id,
            "full_name": request.full_name
        }).execute()
        
        return {
            "message": "User registered successfully. Please verify your email.",
            "user_id": user_id
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login user and return JWT token"""
    supabase = get_supabase()
    
    try:
        # Supabase handles auth
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user_id = response.user.id
        
        # Get user role
        role_response = supabase.table("user_roles").select("role").eq(
            "user_id", user_id
        ).single().execute()
        
        role = role_response.data.get("role") if role_response.data else "homeowner"
        
        # Create JWT token (for consistency with frontend auth)
        access_token = create_access_token(
            data={
                "sub": user_id,
                "email": request.email,
                "role": role
            },
            expires_delta=timedelta(minutes=30)
        )
        
        return TokenResponse(
            access_token=access_token,
            user={
                "id": user_id,
                "email": request.email,
                "role": role
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (token invalidation handled client-side)"""
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    supabase = get_supabase()
    
    response = supabase.table("profiles").select("*").eq(
        "user_id", current_user["user_id"]
    ).single().execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return response.data
