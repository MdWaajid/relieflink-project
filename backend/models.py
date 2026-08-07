import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=True)
    role = Column(String, nullable=False) # 'camp', 'ngo', 'admin'
    display_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Camp(Base):
    __tablename__ = "camps"

    id = Column(String, primary_key=True, default=generate_uuid)
    owner_id = Column(String, ForeignKey("profiles.id"), nullable=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False, default=100)
    current_population = Column(Integer, nullable=False, default=50)
    created_at = Column(DateTime, default=datetime.utcnow)

    requests = relationship("Request", back_populates="camp", cascade="all, delete-orphan")

class NGO(Base):
    __tablename__ = "ngos"

    id = Column(String, primary_key=True, default=generate_uuid)
    owner_id = Column(String, ForeignKey("profiles.id"), nullable=True)
    org_name = Column(String, nullable=False)
    base_latitude = Column(Float, nullable=False)
    base_longitude = Column(Float, nullable=False)
    service_radius_km = Column(Float, nullable=False, default=50.0)
    contact_info = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    resources = relationship("Resource", back_populates="ngo", cascade="all, delete-orphan")

class Resource(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True, default=generate_uuid)
    ngo_id = Column(String, ForeignKey("ngos.id"), nullable=False)
    category = Column(String, nullable=False) # food, water, medicine, blankets, clothes, shelter
    quantity = Column(Integer, nullable=False, default=0)
    unit = Column(String, nullable=False, default="units")
    expiry_date = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ngo = relationship("NGO", back_populates="resources")

class Request(Base):
    __tablename__ = "requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    camp_id = Column(String, ForeignKey("camps.id"), nullable=False)
    category = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit = Column(String, nullable=False, default="units")
    affected_count = Column(Integer, nullable=False, default=10)
    priority = Column(String, nullable=False, default="Medium") # Critical, High, Medium, Low
    status = Column(String, nullable=False, default="Pending") # Pending, Matched, Accepted, Dispatched, Delivered, Cancelled
    matched_ngo_id = Column(String, ForeignKey("ngos.id"), nullable=True)
    stock_deducted = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    camp = relationship("Camp", back_populates="requests")

class BudgetRequest(Base):
    __tablename__ = "budget_requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    ngo_id = Column(String, ForeignKey("ngos.id"), nullable=False)
    request_type = Column(String, nullable=False) # Financial Grant (INR), Food Rations, Medicine Kits, Shelter Tents, Blankets & Bedding
    requested_amount = Column(Float, nullable=False)
    unit = Column(String, nullable=False, default="INR")
    current_supplies_snapshot = Column(Text, nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="Pending") # Pending, Approved, Rejected, Disbursed
    approved_amount = Column(Float, nullable=True)
    allocated_type = Column(String, nullable=True)
    authority_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ngo = relationship("NGO")

class MatchLog(Base):
    __tablename__ = "match_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    request_id = Column(String, ForeignKey("requests.id"), nullable=False)
    ngo_id = Column(String, ForeignKey("ngos.id"), nullable=False)
    resource_match_score = Column(Float, nullable=False)
    distance_score = Column(Float, nullable=False)
    availability_score = Column(Float, nullable=False)
    quantity_score = Column(Float, nullable=False)
    priority_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    recipient_id = Column(String, nullable=False) # user profile id or role name
    type = Column(String, nullable=False) # info, match, dispatch, delivery, warning
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemConfig(Base):
    __tablename__ = "system_config"

    id = Column(String, primary_key=True, default=generate_uuid)
    key = Column(String, unique=True, nullable=False)
    value = Column(Text, nullable=False)
