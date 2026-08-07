import os
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import engine, get_db, Base
from models import Profile, Camp, NGO, Resource, Request, MatchLog, Notification, SystemConfig, BudgetRequest
import schemas
from engines.priority import evaluate_priority
from engines.matching import compute_ngo_match_scores
from seed import seed_database

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ReliefLink API",
    description="Smart Disaster Relief Resource Coordination Platform API",
    version="1.1"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    db = next(get_db())
    if db.query(Camp).count() == 0:
        print("Empty database detected. Seeding initial ReliefLink demo data...")
        seed_database()

@app.get("/api/health")
def health_check():
    return {"status": "online", "system": "ReliefLink Backend API", "timestamp": datetime.utcnow().isoformat()}

# --- AUTH / PROFILES ---
@app.post("/api/auth/login", response_model=schemas.AuthResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.email.ilike(payload.email)).first()
    if not profile or (profile.password_hash and profile.password_hash != payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    camp_id, camp_name, ngo_id, ngo_name = None, None, None, None
    if profile.role == "camp":
        camp = db.query(Camp).filter(Camp.owner_id == profile.id).first()
        if camp:
            camp_id, camp_name = camp.id, camp.name
    elif profile.role == "ngo":
        ngo = db.query(NGO).filter(NGO.owner_id == profile.id).first()
        if ngo:
            ngo_id, ngo_name = ngo.id, ngo.org_name

    return {
        "id": profile.id,
        "email": profile.email,
        "role": profile.role,
        "displayName": profile.display_name,
        "campId": camp_id,
        "campName": camp_name,
        "ngoId": ngo_id,
        "ngoName": ngo_name
    }

@app.post("/api/auth/register", response_model=schemas.AuthResponse)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Profile).filter(Profile.email.ilike(payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email already registered")
    
    profile = Profile(
        email=payload.email,
        password_hash=payload.password,
        role=payload.role,
        display_name=payload.display_name
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    camp_id, camp_name, ngo_id, ngo_name = None, None, None, None
    if payload.role == "camp":
        name = payload.org_name or f"{payload.display_name}'s Relief Camp"
        camp = Camp(owner_id=profile.id, name=name, latitude=13.0827, longitude=80.2707)
        db.add(camp)
        db.commit()
        db.refresh(camp)
        camp_id, camp_name = camp.id, camp.name
    elif payload.role == "ngo":
        org_name = payload.org_name or f"{payload.display_name} Organization"
        ngo = NGO(owner_id=profile.id, org_name=org_name, base_latitude=13.0600, base_longitude=80.2500, contact_info=profile.email)
        db.add(ngo)
        db.commit()
        db.refresh(ngo)
        ngo_id, ngo_name = ngo.id, ngo.org_name

    return {
        "id": profile.id,
        "email": profile.email,
        "role": profile.role,
        "displayName": profile.display_name,
        "campId": camp_id,
        "campName": camp_name,
        "ngoId": ngo_id,
        "ngoName": ngo_name
    }

@app.get("/api/auth/me", response_model=schemas.ProfileOut)
def get_me(role: str = Query("camp"), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.role == role).first()
    if not profile:
        profile = Profile(email=f"{role}@relieflink.org", role=role, display_name=f"Default {role.title()} User")
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

# --- CAMPS ---
@app.post("/api/camps/create-with-manager", response_model=schemas.CampOut)
def create_camp_with_manager(payload: schemas.CampCreateWithManager, db: Session = Depends(get_db)):
    existing = db.query(Profile).filter(Profile.email.ilike(payload.manager_email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Manager email already registered")
    
    profile = Profile(
        email=payload.manager_email,
        password_hash=payload.manager_password,
        role="camp",
        display_name=payload.manager_name
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    camp = Camp(
        name=payload.name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        capacity=payload.capacity,
        current_population=payload.current_population,
        owner_id=profile.id
    )
    db.add(camp)
    db.commit()
    db.refresh(camp)
    return camp

@app.post("/api/camps", response_model=schemas.CampOut)
def create_camp(camp_in: schemas.CampCreate, db: Session = Depends(get_db)):
    new_camp = Camp(**camp_in.dict())
    db.add(new_camp)
    db.commit()
    db.refresh(new_camp)
    return new_camp

@app.get("/api/camps", response_model=List[schemas.CampOut])
def list_camps(owner_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Camp)
    if owner_id:
        query = query.filter(Camp.owner_id == owner_id)
    return query.all()

@app.get("/api/camps/{camp_id}", response_model=schemas.CampOut)
def get_camp(camp_id: str, db: Session = Depends(get_db)):
    camp = db.query(Camp).filter(Camp.id == camp_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")
    return camp

@app.patch("/api/camps/{camp_id}", response_model=schemas.CampOut)
def update_camp(camp_id: str, payload: schemas.CampUpdate, db: Session = Depends(get_db)):
    camp = db.query(Camp).filter(Camp.id == camp_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")
    if payload.current_population is not None:
        camp.current_population = payload.current_population
    if payload.capacity is not None:
        camp.capacity = payload.capacity
    db.commit()
    db.refresh(camp)
    return camp

# --- NGOS ---
@app.post("/api/ngos/create-with-coordinator", response_model=schemas.NGOOut)
def create_ngo_with_coordinator(payload: schemas.NGOCreateWithCoordinator, db: Session = Depends(get_db)):
    existing = db.query(Profile).filter(Profile.email.ilike(payload.coord_email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coordinator email already registered")
    
    profile = Profile(
        email=payload.coord_email,
        password_hash=payload.coord_password,
        role="ngo",
        display_name=payload.coord_name
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    ngo = NGO(
        org_name=payload.org_name,
        base_latitude=payload.base_latitude,
        base_longitude=payload.base_longitude,
        service_radius_km=payload.service_radius_km,
        contact_info=payload.contact_info,
        owner_id=profile.id
    )
    db.add(ngo)
    db.commit()
    db.refresh(ngo)
    return ngo

@app.post("/api/auth/create-authority", response_model=schemas.AuthResponse)
def create_authority(payload: schemas.AuthorityCreate, db: Session = Depends(get_db)):
    existing = db.query(Profile).filter(Profile.email.ilike(payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Authority email already registered")
    
    profile = Profile(
        email=payload.email,
        password_hash=payload.password,
        role="admin",
        display_name=payload.display_name
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return {
        "id": profile.id,
        "email": profile.email,
        "role": profile.role,
        "displayName": profile.display_name
    }
@app.post("/api/ngos", response_model=schemas.NGOOut)
def create_ngo(ngo_in: schemas.NGOCreate, db: Session = Depends(get_db)):
    new_ngo = NGO(**ngo_in.dict())
    db.add(new_ngo)
    db.commit()
    db.refresh(new_ngo)
    return new_ngo

@app.get("/api/ngos", response_model=List[schemas.NGOOut])
def list_ngos(owner_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(NGO)
    if owner_id:
        query = query.filter(NGO.owner_id == owner_id)
    return query.all()

@app.post("/api/ngos/{ngo_id}/resources", response_model=schemas.ResourceOut)
def add_resource(ngo_id: str, resource_in: schemas.ResourceBase, db: Session = Depends(get_db)):
    existing = db.query(Resource).filter(Resource.ngo_id == ngo_id, Resource.category.ilike(resource_in.category)).first()
    if existing:
        existing.quantity += resource_in.quantity
        existing.unit = resource_in.unit
        db.commit()
        db.refresh(existing)
        return existing
    
    new_res = Resource(ngo_id=ngo_id, **resource_in.dict())
    db.add(new_res)
    db.commit()
    db.refresh(new_res)
    return new_res

@app.get("/api/ngos/{ngo_id}/resources", response_model=List[schemas.ResourceOut])
def get_ngo_resources(ngo_id: str, db: Session = Depends(get_db)):
    return db.query(Resource).filter(Resource.ngo_id == ngo_id).all()

@app.get("/api/resources", response_model=List[schemas.ResourceOut])
def get_all_resources(db: Session = Depends(get_db)):
    return db.query(Resource).all()

# --- REQUESTS & ENGINES ---
@app.post("/api/requests", response_model=schemas.RequestOut)
def create_request(req_in: schemas.RequestCreate, db: Session = Depends(get_db)):
    camp = db.query(Camp).filter(Camp.id == req_in.camp_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Relief Camp not found")

    # Auto-update camp population if affected count is higher than current population
    if req_in.affected_count > camp.current_population:
        camp.current_population = req_in.affected_count
        db.commit()
        db.refresh(camp)

    # 1. Evaluate Priority automatically
    auto_priority = evaluate_priority(req_in.category, req_in.quantity, req_in.affected_count)

    new_req = Request(
        camp_id=req_in.camp_id,
        category=req_in.category.lower().strip(),
        quantity=req_in.quantity,
        unit=req_in.unit,
        affected_count=req_in.affected_count,
        priority=auto_priority,
        status="Pending",
        notes=req_in.notes
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    # 2. Trigger Smart Matching Engine
    candidates = compute_ngo_match_scores(db, new_req)
    if candidates and candidates[0]["resource_match_score"] >= 0.3:
        best_ngo = candidates[0]
        new_req.status = "Matched"
        new_req.matched_ngo_id = best_ngo["ngo_id"]
        db.commit()

        # Log match audit
        match_log = MatchLog(
            request_id=new_req.id,
            ngo_id=best_ngo["ngo_id"],
            resource_match_score=best_ngo["resource_match_score"],
            distance_score=best_ngo["distance_score"],
            availability_score=best_ngo["availability_score"],
            quantity_score=best_ngo["quantity_score"],
            priority_score=best_ngo["priority_score"]
        )
        db.add(match_log)

        # Trigger Notifications
        notif_ngo = Notification(
            recipient_id=best_ngo["ngo_id"],
            type="match",
            message=f"Matched to Request #{new_req.id[:6]} ({new_req.category.title()} x{new_req.quantity} {new_req.unit}) from {camp.name}. Match Score: {int(best_ngo['resource_match_score']*100)}%"
        )
        notif_camp = Notification(
            recipient_id=camp.owner_id or "user_camp_1",
            type="match",
            message=f"Your request for {new_req.category.title()} has been matched to NGO {best_ngo['ngo_name']}."
        )
        db.add_all([notif_ngo, notif_camp])
        db.commit()

    db.refresh(new_req)
    
    # Attach extra UI metadata
    res = schemas.RequestOut.from_orm(new_req)
    res.camp_name = camp.name
    if new_req.matched_ngo_id:
        ngo_obj = db.query(NGO).filter(NGO.id == new_req.matched_ngo_id).first()
        if ngo_obj:
            res.matched_ngo_name = ngo_obj.org_name
    return res

@app.get("/api/requests", response_model=List[schemas.RequestOut])
def list_requests(
    camp_id: Optional[str] = Query(None, alias="camp_id"),
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    category_filter: Optional[str] = Query(None, alias="category"),
    db: Session = Depends(get_db)
):
    query = db.query(Request)
    if camp_id:
        query = query.filter(Request.camp_id == camp_id)
    if status_filter:
        query = query.filter(Request.status == status_filter)
    if priority_filter:
        query = query.filter(Request.priority == priority_filter)
    if category_filter:
        query = query.filter(Request.category.ilike(f"%{category_filter}%"))

    requests = query.order_by(Request.created_at.desc()).all()
    results = []
    for req in requests:
        out = schemas.RequestOut.from_orm(req)
        camp = db.query(Camp).filter(Camp.id == req.camp_id).first()
        if camp:
            out.camp_name = camp.name
        if req.matched_ngo_id:
            ngo = db.query(NGO).filter(NGO.id == req.matched_ngo_id).first()
            if ngo:
                out.matched_ngo_name = ngo.org_name
        results.append(out)
    return results

@app.get("/api/requests/{req_id}/matches", response_model=List[schemas.MatchScoreBreakdown])
def get_request_matches(req_id: str, db: Session = Depends(get_db)):
    req = db.query(Request).filter(Request.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return compute_ngo_match_scores(db, req)

@app.patch("/api/requests/{req_id}/accept", response_model=schemas.RequestOut)
def accept_request(req_id: str, db: Session = Depends(get_db)):
    req = db.query(Request).filter(Request.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "Accepted"
    db.commit()
    db.refresh(req)

    camp = db.query(Camp).filter(Camp.id == req.camp_id).first()
    ngo = db.query(NGO).filter(NGO.id == req.matched_ngo_id).first()
    
    notif = Notification(
        recipient_id=camp.owner_id if camp else "user_camp_1",
        type="info",
        message=f"NGO {ngo.org_name if ngo else 'Matched NGO'} ACCEPTED your request for {req.category.title()}."
    )
    db.add(notif)
    db.commit()

    out = schemas.RequestOut.from_orm(req)
    if camp: out.camp_name = camp.name
    if ngo: out.matched_ngo_name = ngo.org_name
    return out

@app.patch("/api/requests/{req_id}/status", response_model=schemas.RequestOut)
def update_request_status(req_id: str, status_payload: schemas.RequestUpdateStatus, db: Session = Depends(get_db)):
    req = db.query(Request).filter(Request.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    new_status = status_payload.status
    req.status = new_status

    # If status becomes Dispatched or Delivered, automatically decrement NGO resource stock ONCE
    if new_status in ["Dispatched", "Delivered"] and req.matched_ngo_id and not req.stock_deducted:
        res = db.query(Resource).filter(
            Resource.ngo_id == req.matched_ngo_id,
            Resource.category.ilike(f"%{req.category}%")
        ).first()
        if res:
            res.quantity = max(0, res.quantity - req.quantity)
        req.stock_deducted = True
    elif new_status == "Cancelled" and req.stock_deducted and req.matched_ngo_id:
        res = db.query(Resource).filter(
            Resource.ngo_id == req.matched_ngo_id,
            Resource.category.ilike(f"%{req.category}%")
        ).first()
        if res:
            res.quantity += req.quantity
        req.stock_deducted = False

    db.commit()
    db.refresh(req)

    camp = db.query(Camp).filter(Camp.id == req.camp_id).first()
    ngo = db.query(NGO).filter(NGO.id == req.matched_ngo_id).first()

    notif = Notification(
        recipient_id=camp.owner_id if camp else "user_camp_1",
        type="dispatch" if new_status == "Dispatched" else "delivery",
        message=f"Status update: Request #{req.id[:6]} ({req.category.title()}) is now {new_status.upper()}."
    )
    db.add(notif)
    db.commit()

    out = schemas.RequestOut.from_orm(req)
    if camp: out.camp_name = camp.name
    if ngo: out.matched_ngo_name = ngo.org_name
    return out

@app.patch("/api/requests/{req_id}/priority", response_model=schemas.RequestOut)
def override_priority(req_id: str, payload: schemas.PriorityOverride, db: Session = Depends(get_db)):
    req = db.query(Request).filter(Request.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    old_prio = req.priority
    req.priority = payload.priority
    if payload.reason:
        req.notes = f"{req.notes or ''} [Admin Priority Override from {old_prio} to {payload.priority}: {payload.reason}]"
    
    db.commit()
    db.refresh(req)
    
    out = schemas.RequestOut.from_orm(req)
    camp = db.query(Camp).filter(Camp.id == req.camp_id).first()
    if camp: out.camp_name = camp.name
    return out

@app.patch("/api/requests/{req_id}/reassign", response_model=schemas.RequestOut)
def reassign_request(req_id: str, payload: schemas.ReassignRequest, db: Session = Depends(get_db)):
    req = db.query(Request).filter(Request.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    ngo = db.query(NGO).filter(NGO.id == payload.ngo_id).first()
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    
    req.matched_ngo_id = ngo.id
    req.status = "Matched"
    db.commit()
    db.refresh(req)

    out = schemas.RequestOut.from_orm(req)
    camp = db.query(Camp).filter(Camp.id == req.camp_id).first()
    if camp: out.camp_name = camp.name
    out.matched_ngo_name = ngo.org_name
    return out

# --- NGO BUDGET & AID REQUISITIONS ---
@app.post("/api/budget-requests", response_model=schemas.BudgetRequestOut)
def create_budget_request(payload: schemas.BudgetRequestCreate, db: Session = Depends(get_db)):
    ngo = db.query(NGO).filter(NGO.id == payload.ngo_id).first()
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO organization not found")
    
    # Snapshot current inventory
    resources = db.query(Resource).filter(Resource.ngo_id == payload.ngo_id).all()
    snapshot = ", ".join([f"{r.category.replace('_', ' ').title()}: {r.quantity} {r.unit}" for r in resources]) or "No active stock listed"

    b_req = BudgetRequest(
        ngo_id=payload.ngo_id,
        request_type=payload.request_type,
        requested_amount=payload.requested_amount,
        unit=payload.unit,
        current_supplies_snapshot=snapshot,
        reason=payload.reason,
        status="Pending"
    )
    db.add(b_req)
    db.commit()
    db.refresh(b_req)

    # Notify District Authority Admin
    notif = Notification(
        recipient_id="user_admin_1",
        type="warning",
        message=f"EMERGENCY BUDGET REQUISITION: NGO '{ngo.org_name}' requested {payload.request_type} ({payload.requested_amount} {payload.unit}). Stock snapshot: [{snapshot}]"
    )
    db.add(notif)
    db.commit()

    out = schemas.BudgetRequestOut.from_orm(b_req)
    out.ngo_name = ngo.org_name
    return out

@app.get("/api/budget-requests", response_model=List[schemas.BudgetRequestOut])
def list_budget_requests(
    ngo_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(BudgetRequest)
    if ngo_id:
        query = query.filter(BudgetRequest.ngo_id == ngo_id)
    if status_filter:
        query = query.filter(BudgetRequest.status == status_filter)
    
    b_requests = query.order_by(BudgetRequest.created_at.desc()).all()
    results = []
    for br in b_requests:
        out = schemas.BudgetRequestOut.from_orm(br)
        ngo = db.query(NGO).filter(NGO.id == br.ngo_id).first()
        if ngo:
            out.ngo_name = ngo.org_name
        results.append(out)
    return results

@app.patch("/api/budget-requests/{b_req_id}/review", response_model=schemas.BudgetRequestOut)
def review_budget_request(b_req_id: str, payload: schemas.BudgetRequestReview, db: Session = Depends(get_db)):
    b_req = db.query(BudgetRequest).filter(BudgetRequest.id == b_req_id).first()
    if not b_req:
        raise HTTPException(status_code=404, detail="Budget Request not found")
    
    b_req.status = payload.status
    if payload.approved_amount is not None:
        b_req.approved_amount = payload.approved_amount
    if payload.allocated_type is not None:
        b_req.allocated_type = payload.allocated_type
    if payload.authority_notes:
        b_req.authority_notes = payload.authority_notes

    # If approved/disbursed and physical supplies allocated, credit to NGO resource stock!
    if payload.status in ["Approved", "Disbursed"] and payload.approved_amount and payload.approved_amount > 0:
        req_type_lower = (payload.allocated_type or b_req.request_type).lower()
        cat_map = {
            "food": "food",
            "ration": "food",
            "water": "drinking_water",
            "medicine": "medicine",
            "blanket": "blankets",
            "shelter": "shelter",
            "tent": "shelter"
        }
        matched_cat = None
        for key, val in cat_map.items():
            if key in req_type_lower:
                matched_cat = val
                break
        
        if matched_cat:
            res = db.query(Resource).filter(
                Resource.ngo_id == b_req.ngo_id,
                Resource.category.ilike(f"%{matched_cat}%")
            ).first()
            if res:
                res.quantity += int(payload.approved_amount)
            else:
                new_res = Resource(
                    ngo_id=b_req.ngo_id,
                    category=matched_cat,
                    quantity=int(payload.approved_amount),
                    unit=b_req.unit if b_req.unit != "INR" else "units"
                )
                db.add(new_res)

    db.commit()
    db.refresh(b_req)

    ngo = db.query(NGO).filter(NGO.id == b_req.ngo_id).first()
    if payload.status == "Rejected":
        notif_msg = f"Budget Requisition REJECTED by District Authority. Reason: {payload.authority_notes or 'No reason provided.'}"
    else:
        notif_msg = f"Budget Requisition Status Updated to {payload.status.upper()}. Approved Amount: {payload.approved_amount or 0} {b_req.unit}. Remark: {payload.authority_notes or 'N/A'}"

    notif = Notification(
        recipient_id=ngo.owner_id if ngo else "user_ngo_1",
        type="info",
        message=notif_msg
    )
    db.add(notif)
    db.commit()

    out = schemas.BudgetRequestOut.from_orm(b_req)
    if ngo:
        out.ngo_name = ngo.org_name
    return out

# --- NOTIFICATIONS ---
@app.get("/api/notifications", response_model=List[schemas.NotificationOut])
def get_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).order_by(Notification.created_at.desc()).limit(20).all()

@app.patch("/api/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}

# --- ANALYTICS ---
@app.get("/api/analytics/overview", response_model=schemas.AnalyticsOverview)
def get_analytics(db: Session = Depends(get_db)):
    requests = db.query(Request).all()
    camps_count = db.query(Camp).count()
    ngos_count = db.query(NGO).count()

    total_requests = len(requests)
    pending_requests = sum(1 for r in requests if r.status == "Pending")
    matched_requests = sum(1 for r in requests if r.status == "Matched")
    dispatched_requests = sum(1 for r in requests if r.status == "Dispatched")
    delivered_requests = sum(1 for r in requests if r.status == "Delivered")
    critical_requests = sum(1 for r in requests if r.priority == "Critical")
    high_requests = sum(1 for r in requests if r.priority == "High")

    by_category = {}
    by_priority = {}
    for r in requests:
        cat = r.category.title()
        prio = r.priority
        by_category[cat] = by_category.get(cat, 0) + 1
        by_priority[prio] = by_priority.get(prio, 0) + 1

    # NGO Leaderboard
    ngos = db.query(NGO).all()
    leaderboard = []
    for ngo in ngos:
        fulfilled_count = sum(1 for r in requests if r.matched_ngo_id == ngo.id and r.status in ["Dispatched", "Delivered"])
        leaderboard.append({
            "ngo_name": ngo.org_name,
            "fulfilled_count": fulfilled_count,
            "contact_info": ngo.contact_info
        })
    leaderboard.sort(key=lambda x: x["fulfilled_count"], reverse=True)

    return {
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "matched_requests": matched_requests,
        "dispatched_requests": dispatched_requests,
        "delivered_requests": delivered_requests,
        "critical_requests": critical_requests,
        "high_requests": high_requests,
        "total_camps": camps_count,
        "total_ngos": ngos_count,
        "requests_by_category": by_category,
        "requests_by_priority": by_priority,
        "ngo_leaderboard": leaderboard
    }
