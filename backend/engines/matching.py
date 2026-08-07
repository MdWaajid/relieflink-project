import math
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from models import Camp, NGO, Resource, Request, MatchLog

W1 = 0.35 # Distance
W2 = 0.25 # Availability
W3 = 0.25 # Quantity
W4 = 0.15 # Priority Alignment

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance in kilometers between two lat/lon pairs using Haversine formula."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def compute_ngo_match_scores(db: Session, request: Request) -> List[Dict[str, Any]]:
    """
    Computes Resource Match Score (RMS) for all NGOs against a camp request.
    Returns ranked list of candidate NGOs with score breakdowns.
    """
    camp = db.query(Camp).filter(Camp.id == request.camp_id).first()
    if not camp:
        return []

    ngos = db.query(NGO).all()
    candidates = []

    for ngo in ngos:
        # Distance calculation
        distance_km = haversine_distance(camp.latitude, camp.longitude, ngo.base_latitude, ngo.base_longitude)
        max_radius = max(ngo.service_radius_km, 10.0)
        distance_score = max(0.0, 1.0 - (distance_km / max_radius))

        # Check NGO resource inventory
        matching_resources = db.query(Resource).filter(
            Resource.ngo_id == ngo.id,
            Resource.category.ilike(f"%{request.category}%")
        ).all()

        total_available = sum(r.quantity for r in matching_resources)
        
        if matching_resources:
            availability_score = 1.0
        else:
            # Check substitutable category (e.g. food ~ rations, water ~ mineral water)
            availability_score = 0.0

        if request.quantity > 0:
            quantity_score = min(1.0, float(total_available) / float(request.quantity))
        else:
            quantity_score = 1.0

        # Priority alignment score
        if request.priority == "Critical":
            priority_score = 1.0
        elif request.priority == "High":
            priority_score = 0.85
        elif request.priority == "Medium":
            priority_score = 0.70
        else:
            priority_score = 0.50

        # Weighted Resource Match Score (RMS)
        rms = (W1 * distance_score) + (W2 * availability_score) + (W3 * quantity_score) + (W4 * priority_score)
        rms = round(min(1.0, max(0.0, rms)), 3)

        candidates.append({
            "ngo_id": ngo.id,
            "ngo_name": ngo.org_name,
            "resource_match_score": rms,
            "distance_km": round(distance_km, 1),
            "distance_score": round(distance_score, 2),
            "availability_score": round(availability_score, 2),
            "quantity_score": round(quantity_score, 2),
            "priority_score": round(priority_score, 2),
            "available_qty": total_available
        })

    # Sort descending by RMS
    candidates.sort(key=lambda x: x["resource_match_score"], reverse=True)
    return candidates
