from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProfileBase(BaseModel):
    email: str
    role: str
    display_name: str

class ProfileCreate(ProfileBase):
    password: Optional[str] = None

class ProfileOut(ProfileBase):
    id: str
    created_at: datetime
    camp_id: Optional[str] = None
    ngo_id: Optional[str] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str
    display_name: str
    org_name: Optional[str] = None # For Camp or NGO name

class AuthResponse(BaseModel):
    id: str
    email: str
    role: str
    displayName: str
    campId: Optional[str] = None
    campName: Optional[str] = None
    ngoId: Optional[str] = None
    ngoName: Optional[str] = None


class CampBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    capacity: int = 100
    current_population: int = 50

class CampCreate(CampBase):
    owner_id: Optional[str] = None

class CampCreateWithManager(BaseModel):
    name: str
    latitude: float = 13.0827
    longitude: float = 80.2707
    capacity: int = 500
    current_population: int = 100
    manager_email: str
    manager_password: str
    manager_name: str

class NGOCreateWithCoordinator(BaseModel):
    org_name: str
    base_latitude: float = 13.0600
    base_longitude: float = 80.2500
    service_radius_km: float = 100.0
    contact_info: str
    coord_email: str
    coord_password: str
    coord_name: str

class AuthorityCreate(BaseModel):
    email: str
    password: str
    display_name: str

class CampOut(CampBase):
    id: str
    owner_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NGOBase(BaseModel):
    org_name: str
    base_latitude: float
    base_longitude: float
    service_radius_km: float = 50.0
    contact_info: str

class NGOCreate(NGOBase):
    owner_id: Optional[str] = None

class NGOOut(NGOBase):
    id: str
    owner_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ResourceBase(BaseModel):
    category: str
    quantity: int
    unit: str = "units"
    expiry_date: Optional[str] = None

class ResourceCreate(ResourceBase):
    ngo_id: str

class ResourceOut(ResourceBase):
    id: str
    ngo_id: str
    updated_at: datetime

    class Config:
        from_attributes = True

class RequestBase(BaseModel):
    camp_id: str
    category: str
    quantity: int
    unit: str = "units"
    affected_count: int = 10
    notes: Optional[str] = None

class RequestCreate(RequestBase):
    pass

class RequestUpdateStatus(BaseModel):
    status: str

class PriorityOverride(BaseModel):
    priority: str
    reason: Optional[str] = None

class ReassignRequest(BaseModel):
    ngo_id: str

class RequestOut(RequestBase):
    id: str
    priority: str
    status: str
    matched_ngo_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    camp_name: Optional[str] = None
    matched_ngo_name: Optional[str] = None

    class Config:
        from_attributes = True

class MatchScoreBreakdown(BaseModel):
    ngo_id: str
    ngo_name: str
    resource_match_score: float
    distance_km: float
    distance_score: float
    availability_score: float
    quantity_score: float
    priority_score: float

class NotificationOut(BaseModel):
    id: str
    recipient_id: str
    type: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CampUpdate(BaseModel):
    current_population: Optional[int] = None
    capacity: Optional[int] = None

class BudgetRequestCreate(BaseModel):
    ngo_id: str
    request_type: str
    requested_amount: float
    unit: str = "INR"
    reason: str

class BudgetRequestReview(BaseModel):
    status: str # Approved, Rejected, Disbursed
    approved_amount: Optional[float] = None
    allocated_type: Optional[str] = None
    authority_notes: Optional[str] = None

class BudgetRequestOut(BaseModel):
    id: str
    ngo_id: str
    request_type: str
    requested_amount: float
    unit: str
    current_supplies_snapshot: Optional[str] = None
    reason: str
    status: str
    approved_amount: Optional[float] = None
    allocated_type: Optional[str] = None
    authority_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    ngo_name: Optional[str] = None

    class Config:
        from_attributes = True

class AnalyticsOverview(BaseModel):
    total_requests: int
    pending_requests: int
    matched_requests: int
    dispatched_requests: int
    delivered_requests: int
    critical_requests: int
    high_requests: int
    total_camps: int
    total_ngos: int
    requests_by_category: dict
    requests_by_priority: dict
    ngo_leaderboard: list
