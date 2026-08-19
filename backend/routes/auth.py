from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from bson import ObjectId
import os
from database.connection import get_db

router = APIRouter()
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")
SECRET = os.getenv("SECRET_KEY","urbanpulse-secret-2024")
ALGO   = "HS256"

# ── Fixed municipal accounts ──────────────────────────────
MUNICIPAL_ACCOUNTS = {
    "municipal@urbanpulse.gov": {
        "password": "Municipal@2024",
        "name": "Municipal Commissioner",
        "city": "Delhi",
        "id": "municipal_001"
    },
    "officer@urbanpulse.gov": {
        "password": "Officer@2024",
        "name": "Field Officer",
        "city": "Delhi",
        "id": "municipal_002"
    }
}

class RegisterIn(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    city: Optional[str] = None
    password: str

class LoginIn(BaseModel):
    email: str
    password: str
    role: Optional[str] = "citizen"

def make_token(sub: str) -> str:
    return jwt.encode({"sub": sub, "exp": datetime.utcnow()+timedelta(days=7)}, SECRET, ALGO)

def hash_pw(p): return pwd.hash(p)
def check_pw(p, h): return pwd.verify(p, h)

async def current_user(token: str = Depends(oauth2)):
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGO])
        uid = payload.get("sub")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    if uid and uid.startswith("municipal_"):
        # Municipal user
        for email, data in MUNICIPAL_ACCOUNTS.items():
            if data["id"] == uid:
                return {"_id": uid, "id": uid, "name": data["name"], "email": email,
                        "city": data["city"], "role": "municipal", "points": 0}
        raise HTTPException(401, "Municipal account not found")
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(uid)})
    if not user: raise HTTPException(401, "User not found")
    return user

def fmt_user(u, role="citizen"):
    pts = u.get("points",0)
    lvl = get_level(pts)
    return {
        "id": str(u.get("_id","")) or u.get("id",""),
        "name": u.get("name") or f"{u.get('first_name','')} {u.get('last_name','')}".strip(),
        "email": u.get("email",""),
        "city": u.get("city",""),
        "role": u.get("role", role),
        "points": pts,
        "level": lvl,
        "reports_count": u.get("reports_count",0),
        "resolved_count": u.get("resolved_count",0),
    }

def get_level(pts):
    if pts >= 15000: return "Platinum Guardian"
    if pts >= 5000:  return "Gold Guardian"
    if pts >= 1000:  return "Silver Guardian"
    return "Bronze Guardian"

@router.post("/register")
async def register(data: RegisterIn):
    db = get_db()
    if await db.users.find_one({"email": data.email}):
        raise HTTPException(400, "Email already registered")
    doc = {
        "first_name": data.first_name, "last_name": data.last_name,
        "email": data.email, "phone": data.phone, "city": data.city,
        "password_hash": hash_pw(data.password),
        "role": "citizen", "points": 0, "level": "Bronze Guardian",
        "reports_count": 0, "resolved_count": 0,
        "created_at": datetime.utcnow()
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    token = make_token(str(res.inserted_id))
    return {"access_token": token, "token_type": "bearer", "user": fmt_user(doc)}

@router.post("/login")
async def login(data: LoginIn):
    # Municipal login
    if data.role == "municipal" or data.email in MUNICIPAL_ACCOUNTS:
        acc = MUNICIPAL_ACCOUNTS.get(data.email)
        if not acc or acc["password"] != data.password:
            raise HTTPException(401, "Invalid municipal credentials")
        token = make_token(acc["id"])
        user = {"id": acc["id"], "name": acc["name"], "email": data.email,
                "city": acc["city"], "role": "municipal", "points": 0,
                "level": "Municipal Officer", "reports_count": 0, "resolved_count": 0}
        return {"access_token": token, "token_type": "bearer", "user": user}
    # Citizen login
    db = get_db()
    user = await db.users.find_one({"email": data.email})
    if not user or not check_pw(data.password, user.get("password_hash","")):
        raise HTTPException(401, "Invalid email or password")
    token = make_token(str(user["_id"]))
    return {"access_token": token, "token_type": "bearer", "user": fmt_user(user)}

@router.get("/me")
async def me(user=Depends(current_user)):
    return fmt_user(user)
