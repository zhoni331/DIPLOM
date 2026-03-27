from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ============ ENUMS ============
class UserRole(str, Enum):
    HOMEOWNER = "homeowner"
    CONTRACTOR = "contractor"
    ADMIN = "admin"

class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

class ProjectStatus(str, Enum):
    PLANNED = "planned"
    ACTIVE = "active"
    COMPLETED = "completed"

# ============ AUTH ============
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    role: UserRole

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# ============ PROFILES ============
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    phone: Optional[str]
    avatar_url: Optional[str]
    status: str
    created_at: datetime

# ============ TEAMS ============
class TeamCreate(BaseModel):
    name: str
    city: str = "Astana"
    description: Optional[str] = None
    specialties: List[str] = []
    years_experience: int = 0
    pricing_model: Optional[str] = None

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    specialties: Optional[List[str]] = None
    years_experience: Optional[int] = None
    pricing_model: Optional[str] = None

class TeamResponse(BaseModel):
    id: str
    owner_user_id: str
    name: str
    city: str
    specialties: List[str]
    description: Optional[str]
    years_experience: int
    pricing_model: Optional[str]
    verified_status: str
    trust_score: float
    avg_rating: float
    review_count: int
    created_at: datetime

# ============ REVIEWS ============
class ReviewCreate(BaseModel):
    team_id: str
    project_id: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    title: str
    body: Optional[str] = None

class ReviewApprovalRequest(BaseModel):
    approve: bool
    rejection_reason: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    team_id: str
    homeowner_user_id: str
    project_id: Optional[str]
    rating: int
    title: str
    body: Optional[str]
    status: str
    verification_type: str
    created_at: datetime

class ReviewReplyCreate(BaseModel):
    body: str

class ReviewReplyResponse(BaseModel):
    id: str
    review_id: str
    contractor_user_id: str
    body: str
    created_at: datetime

# ============ PROJECTS ============
class ProjectCreate(BaseModel):
    team_id: str
    title: str
    description: Optional[str] = None
    district: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    end_date: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    homeowner_user_id: str
    team_id: str
    title: str
    description: Optional[str]
    district: Optional[str]
    status: str
    created_at: datetime

# ============ REPORTS ============
class ReportCreate(BaseModel):
    target_type: str = Field(pattern="^(review|team|user)$")
    target_id: str
    reason: str
    details: Optional[str] = None

# ============ TRUST SCORE ============
class TrustScoreBreakdown(BaseModel):
    rating_score: float
    volume_score: float
    recency_score: float
    verification_score: float
    total_score: float

class TrustScoreUpdate(BaseModel):
    team_id: str
    breakdown: TrustScoreBreakdown
