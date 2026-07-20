from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import os, uuid, random
from database.connection import get_db
from routes.auth import current_user

router = APIRouter()

ISSUE_BASE_RISK = {"pothole":65,"garbage":45,"waterlogging":75,"streetlight":55,"road_crack":60,"sewer":70,"other":40}
SEV_SCORE = {"critical":1.0,"high":0.75,"medium":0.5,"low":0.25}

def calc_risk(issue_type, severity, lat, lng):
    base = ISSUE_BASE_RISK.get(issue_type, 40) / 100
    sev  = SEV_SCORE.get(severity, 0.5)
    # Proximity to major facilities (simplified)
    fac = 0.7 if (28.55 <= lat <= 28.75 and 77.1 <= lng <= 77.4) else 0.4
    road = 0.8 if (28.60 <= lat <= 28.70 and 77.20 <= lng <= 77.35) else 0.5
    score = (sev*0.35 + 0.20*0.6 + road*0.20 + fac*0.15 + base*0.10) * 100
    return round(min(max(score, 5), 99), 1)

from google import genai
from google.genai import types
import json

def analyze_image_with_ai(image_path: str, user_issue_type: str = None):
    # Retrieve API key from environment
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_google_gemini_api_key_here":
        # Fallback to mock if API key is not set
        types_list = ["pothole","garbage","waterlogging","streetlight","road_crack"]
        detected = user_issue_type if user_issue_type else random.choice(types_list)
        confidence = round(random.uniform(82, 97), 1)
        severities = ["medium","high","critical"]
        weights = [0.3, 0.45, 0.25]
        severity = random.choices(severities, weights=weights)[0]
        return detected, confidence, severity

    try:
        client = genai.Client(api_key=api_key)
        
        # Determine prompt based on whether user provided an issue type
        context = f"The user thinks this is a '{user_issue_type}'." if user_issue_type else ""
        
        prompt = f"""
        Analyze this image for civic issues like potholes, garbage, waterlogging, broken streetlights, or road cracks. {context}
        Respond with ONLY a JSON object in this format:
        {{
            "issue_type": "pothole|garbage|waterlogging|streetlight|road_crack|other",
            "confidence": 85.5, 
            "severity": "low|medium|high|critical"
        }}
        Make sure the confidence is a float between 0 and 100 representing your certainty.
        """
        
        with open(image_path, "rb") as f:
            image_data = f.read()
            
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=image_data, mime_type='image/jpeg'),
                prompt
            ]
        )
        
        # Parse the JSON response
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        result = json.loads(text)
        return result.get("issue_type", "other"), result.get("confidence", 80.0), result.get("severity", "medium")
        
    except Exception as e:
        print(f"Gemini API Error: {e}")
        # Fallback in case of error
        return user_issue_type or "other", 50.0, "medium"

def serialize(r):
    r["id"] = str(r.pop("_id"))
    if "user_id" in r: r["user_id"] = str(r["user_id"])
    return r

@router.post("/")
async def create_report(
    photo: UploadFile = File(...),
    lat: float = Form(...),
    lng: float = Form(...),
    address: Optional[str] = Form(None),
    issue_type: Optional[str] = Form(None),
    landmark: Optional[str] = Form(""),
    description: Optional[str] = Form(""),
    user=Depends(current_user)
):
    db = get_db()
    img_bytes = await photo.read()
    if len(img_bytes) > 10*1024*1024:
        raise HTTPException(400, "Image too large (max 10MB)")

    # Save image locally (in production: upload to S3)
    os.makedirs("uploads", exist_ok=True)
    filename = f"{uuid.uuid4()}.jpg"
    image_path = f"uploads/{filename}"
    with open(image_path, "wb") as f: f.write(img_bytes)
    image_url = f"http://localhost:8002/{image_path}"

    detected, confidence, severity = analyze_image_with_ai(image_path, issue_type)
    risk = calc_risk(detected, severity, lat, lng)

    # Points: 20 for critical, 10 for others
    points = 20 if risk >= 80 else 10

    doc = {
        "user_id": str(user["_id"]) if "_id" in user else user.get("id",""),
        "user_name": user.get("name",""),
        "issue_type": detected,
        "severity": severity,
        "description": description,
        "landmark": landmark,
        "location": {"type":"Point","coordinates":[lng,lat],"address":address or ""},
        "ai_confidence": confidence,
        "ai_detected": detected,
        "risk_score": risk,
        "image_url": image_url,
        "resolved_image_url": None,
        "status": "pending",
        "points_awarded": points,
        "assigned_team": None,
        "resolved_at": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    res = await db.reports.insert_one(doc)

    # Update user points & count
    uid = doc["user_id"]
    try:
        await db.users.update_one(
            {"_id": ObjectId(uid)},
            {"$inc": {"points": points, "reports_count": 1},
             "$set": {"updated_at": datetime.utcnow()}}
        )
        # Refresh user in response
        updated = await db.users.find_one({"_id": ObjectId(uid)})
        if updated:
            from routes.auth import get_level
            updated_user = {
                "id": str(updated["_id"]), "name": f"{updated.get('first_name','')} {updated.get('last_name','')}".strip(),
                "email": updated.get("email",""), "city": updated.get("city",""),
                "role": "citizen", "points": updated.get("points",0),
                "level": get_level(updated.get("points",0))
            }
        else: updated_user = None
    except: updated_user = None

    return {
        "id": str(res.inserted_id),
        "message": "Report submitted successfully",
        "ai_detected": detected,
        "confidence": confidence,
        "severity": severity,
        "risk_score": risk,
        "points_awarded": points,
        "status": "pending",
        "updated_user": updated_user
    }

@router.get("/")
async def get_reports(
    status: Optional[str] = Query(None),
    issue_type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    skip: int = Query(0)
):
    db = get_db()
    q = {}
    if status: q["status"] = status
    if issue_type: q["issue_type"] = issue_type
    cursor = db.reports.find(q).sort("risk_score",-1).skip(skip).limit(limit)
    return [serialize(r) async for r in cursor]

@router.get("/my-reports")
async def my_reports(user=Depends(current_user)):
    db = get_db()
    uid = str(user.get("_id","")) or user.get("id","")
    cursor = db.reports.find({"user_id": uid}).sort("created_at",-1)
    return [serialize(r) async for r in cursor]

@router.get("/leaderboard")
async def leaderboard():
    db = get_db()
    cursor = db.users.find({},{"first_name":1,"last_name":1,"email":1,"points":1,"reports_count":1,"resolved_count":1,"city":1}).sort("points",-1).limit(20)
    result = []
    async for u in cursor:
        result.append({
            "user_id": str(u["_id"]),
            "name": f"{u.get('first_name','')} {u.get('last_name','')}".strip(),
            "email": u.get("email",""),
            "points": u.get("points",0),
            "reports_count": u.get("reports_count",0),
            "city": u.get("city","")
        })
    return result

@router.get("/stats/city")
async def city_stats():
    db = get_db()
    total    = await db.reports.count_documents({})
    resolved = await db.reports.count_documents({"status":"resolved"})
    pending  = await db.reports.count_documents({"status":"pending"})
    critical = await db.reports.count_documents({"risk_score":{"$gte":80},"status":{"$ne":"resolved"}})
    return {"total":total,"resolved":resolved,"pending":pending,"critical":critical,
            "resolution_rate": round(resolved/total*100,1) if total else 0}

@router.get("/stats/chart-data")
async def chart_data():
    db = get_db()
    # Issues by category
    pipeline = [{"$group": {"_id": "$issue_type", "count": {"$sum": 1}}}]
    cursor = db.reports.aggregate(pipeline)
    categories = {"labels": [], "data": []}
    async for doc in cursor:
        categories["labels"].append(doc["_id"])
        categories["data"].append(doc["count"])

    # Reports by status
    status_pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    status_cursor = db.reports.aggregate(status_pipeline)
    statuses = {"labels": [], "data": []}
    async for doc in status_cursor:
        statuses["labels"].append(doc["_id"])
        statuses["data"].append(doc["count"])
        
    return {"categories": categories, "statuses": statuses}

@router.put("/{report_id}/status")
async def update_status(report_id: str, data: dict, user=Depends(current_user)):
    db = get_db()
    update = {"status": data["status"], "updated_at": datetime.utcnow()}
    if data.get("assigned_team"): update["assigned_team"] = data["assigned_team"]
    res = await db.reports.update_one({"_id": ObjectId(report_id)}, {"$set": update})
    if res.matched_count == 0: raise HTTPException(404, "Report not found")
    return {"message": f"Status updated to {data['status']}"}

@router.post("/{report_id}/resolve")
async def resolve_report(
    report_id: str,
    resolved_photo: UploadFile = File(...),
    status: str = Form("resolved"),
    user=Depends(current_user)
):
    db = get_db()
    img_bytes = await resolved_photo.read()
    os.makedirs("uploads", exist_ok=True)
    filename = f"resolved_{uuid.uuid4()}.jpg"
    with open(f"uploads/{filename}", "wb") as f: f.write(img_bytes)
    resolved_url = f"http://localhost:8002/uploads/{filename}"

    report = await db.reports.find_one({"_id": ObjectId(report_id)})
    if not report: raise HTTPException(404, "Report not found")

    await db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"status":"resolved","resolved_image_url":resolved_url,"resolved_at":datetime.utcnow(),"updated_at":datetime.utcnow()}}
    )

    # Award +5 points to original reporter
    try:
        await db.users.update_one(
            {"_id": ObjectId(report["user_id"])},
            {"$inc": {"points":5,"resolved_count":1}}
        )
    except: pass

    return {"message":"Report resolved successfully","resolved_image_url":resolved_url}
