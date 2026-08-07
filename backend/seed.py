from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base
from models import Profile, Camp, NGO, Resource, Request, MatchLog, Notification, BudgetRequest
from engines.priority import evaluate_priority
from engines.matching import compute_ngo_match_scores

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Clear existing if any
    db.query(BudgetRequest).delete()
    db.query(Notification).delete()
    db.query(MatchLog).delete()
    db.query(Request).delete()
    db.query(Resource).delete()
    db.query(NGO).delete()
    db.query(Camp).delete()
    db.query(Profile).delete()
    db.commit()

    # 1. User Profiles for individual Camps, NGOs, and Admin Authority
    profile_camp1 = Profile(id="user_camp_1", email="camp1@relieflink.org", password_hash="camp123", role="camp", display_name="Ramesh (Central Camp Manager)")
    profile_camp2 = Profile(id="user_camp_2", email="camp2@relieflink.org", password_hash="camp123", role="camp", display_name="Sister Mary (St. Mary's Shelter Manager)")
    profile_camp3 = Profile(id="user_camp_3", email="camp3@relieflink.org", password_hash="camp123", role="camp", display_name="Kannan (Riverside High School Manager)")
    profile_camp4 = Profile(id="user_camp_4", email="camp4@relieflink.org", password_hash="camp123", role="camp", display_name="Priya (Coastal Evacuation Hub Manager)")

    profile_ngo1 = Profile(id="user_ngo_1", email="ngo1@relieflink.org", password_hash="ngo123", role="ngo", display_name="Divya (Red Cross Coord)")
    profile_ngo2 = Profile(id="user_ngo_2", email="ngo2@relieflink.org", password_hash="ngo123", role="ngo", display_name="Arun (Water Corps Coord)")
    profile_ngo3 = Profile(id="user_ngo_3", email="ngo3@relieflink.org", password_hash="ngo123", role="ngo", display_name="Meera (Food Aid Coord)")

    profile_admin = Profile(id="user_admin_1", email="admin@relieflink.org", password_hash="admin123", role="admin", display_name="Suresh Iyer (District Authority)")

    db.add_all([profile_camp1, profile_camp2, profile_camp3, profile_camp4, profile_ngo1, profile_ngo2, profile_ngo3, profile_admin])
    db.commit()

    # 2. Camps (each assigned to its own owner profile)
    camp1 = Camp(id="camp_1", owner_id=profile_camp1.id, name="Central Flood Shelter Camp #1", latitude=13.0827, longitude=80.2707, capacity=500, current_population=420)
    camp2 = Camp(id="camp_2", owner_id=profile_camp2.id, name="St. Mary's Relief Camp", latitude=13.0382, longitude=80.2458, capacity=350, current_population=290)
    camp3 = Camp(id="camp_3", owner_id=profile_camp3.id, name="Riverside High School Shelter", latitude=13.0104, longitude=80.2120, capacity=200, current_population=180)
    camp4 = Camp(id="camp_4", owner_id=profile_camp4.id, name="Coastal Evacuation Hub #4", latitude=12.9815, longitude=80.2520, capacity=600, current_population=520)

    db.add_all([camp1, camp2, camp3, camp4])
    db.commit()

    # 3. NGOs (each assigned to its own owner profile)
    ngo1 = NGO(id="ngo_1", owner_id=profile_ngo1.id, org_name="Red Cross Emergency Relief", base_latitude=13.0600, base_longitude=80.2500, service_radius_km=100.0, contact_info="+91-9876543210")
    ngo2 = NGO(id="ngo_2", owner_id=profile_ngo2.id, org_name="Humanitarian Water & Health Corps", base_latitude=13.0200, base_longitude=80.1900, service_radius_km=75.0, contact_info="+91-9812345678")
    ngo3 = NGO(id="ngo_3", owner_id=profile_ngo3.id, org_name="Global Food Aid Foundation", base_latitude=13.0900, base_longitude=80.2800, service_radius_km=120.0, contact_info="+91-9845012345")

    db.add_all([ngo1, ngo2, ngo3])
    db.commit()

    # 4. Resources
    res1 = Resource(id="res_1", ngo_id=ngo1.id, category="drinking_water", quantity=5000, unit="Liters", expiry_date="2026-12-31")
    res2 = Resource(id="res_2", ngo_id=ngo1.id, category="medicine", quantity=1200, unit="Kits", expiry_date="2027-06-30")
    res3 = Resource(id="res_3", ngo_id=ngo2.id, category="drinking_water", quantity=8000, unit="Liters", expiry_date="2026-12-31")
    res4 = Resource(id="res_4", ngo_id=ngo2.id, category="medicine", quantity=450, unit="Kits", expiry_date="2027-03-31")
    res5 = Resource(id="res_5", ngo_id=ngo3.id, category="food", quantity=10000, unit="Packets", expiry_date="2026-09-30")
    res6 = Resource(id="res_6", ngo_id=ngo1.id, category="blankets", quantity=2500, unit="Pieces", expiry_date=None)
    res7 = Resource(id="res_7", ngo_id=ngo3.id, category="shelter", quantity=350, unit="Tents", expiry_date=None)

    db.add_all([res1, res2, res3, res4, res5, res6, res7])
    db.commit()

    # 5. Requests & Auto-matching
    req1 = Request(
        id="req_1",
        camp_id=camp1.id,
        category="drinking_water",
        quantity=1500,
        unit="Liters",
        affected_count=420,
        priority=evaluate_priority("drinking_water", 1500, 420),
        status="Matched",
        matched_ngo_id=ngo2.id,
        notes="Main camp water supply contaminated due to overflow."
    )

    req2 = Request(
        id="req_2",
        camp_id=camp2.id,
        category="medicine",
        quantity=200,
        unit="Kits",
        affected_count=290,
        priority=evaluate_priority("medicine", 200, 290),
        status="Accepted",
        matched_ngo_id=ngo1.id,
        notes="Urgent need for water-borne infection treatment kits."
    )

    req3 = Request(
        id="req_3",
        camp_id=camp3.id,
        category="blankets",
        quantity=300,
        unit="Pieces",
        affected_count=180,
        priority=evaluate_priority("blankets", 300, 180),
        status="Pending",
        matched_ngo_id=None,
        notes="Cold wave night temperatures expected."
    )

    req4 = Request(
        id="req_4",
        camp_id=camp4.id,
        category="food",
        quantity=2000,
        unit="Packets",
        affected_count=520,
        priority=evaluate_priority("food", 2000, 520),
        status="Dispatched",
        matched_ngo_id=ngo3.id,
        notes="Dinner dry ration distribution."
    )

    db.add_all([req1, req2, req3, req4])
    db.commit()

    # 6. Notifications
    notif1 = Notification(recipient_id="user_camp_1", type="match", message="Request #req_1 matched with Humanitarian Water Corps (Score: 0.94)", is_read=False)
    notif2 = Notification(recipient_id="user_ngo_1", type="match", message="New Critical request #req_2 matched to your NGO", is_read=False)
    notif3 = Notification(recipient_id="user_admin_1", type="warning", message="Critical priority alert: Water shortage at Central Flood Shelter Camp #1", is_read=False)

    db.add_all([notif1, notif2, notif3])
    db.commit()

    # 7. Budget Requests
    b_req1 = BudgetRequest(
        id="breq_1",
        ngo_id=ngo1.id,
        request_type="Financial Grant (INR)",
        requested_amount=150000,
        unit="INR",
        current_supplies_snapshot="Drinking Water: 5000 Liters, Medicine: 1200 Kits, Blankets: 2500 Pieces",
        reason="Fuel & Transport operational logistics cost for medical dispatches.",
        status="Pending"
    )
    db.add(b_req1)
    db.commit()

    db.close()
    print("ReliefLink database successfully seeded with initial disaster relief data!")

if __name__ == "__main__":
    seed_database()
