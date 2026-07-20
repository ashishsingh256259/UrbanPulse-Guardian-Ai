from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
load_dotenv()

class DB:
    client: AsyncIOMotorClient = None
    db = None

db = DB()

async def connect_db():
    db.client = AsyncIOMotorClient(os.getenv("MONGODB_URL","mongodb://localhost:27017"))
    db.db = db.client["urbanpulse"]
    await db.db.reports.create_index([("location","2dsphere")])
    await db.db.reports.create_index([("risk_score",-1)])
    await db.db.reports.create_index([("status",1)])
    await db.db.reports.create_index([("user_id",1)])
    await db.db.users.create_index([("email",1)],unique=True)
    print("✅ Connected to MongoDB Atlas")
    print("✅ MongoDB indexes created")

async def disconnect_db():
    if db.client: db.client.close()

def get_db(): return db.db
