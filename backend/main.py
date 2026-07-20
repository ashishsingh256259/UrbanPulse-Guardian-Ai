from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import uvicorn, os
from routes import auth, reports, predictions
from database.connection import connect_db, disconnect_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()

app = FastAPI(title="UrbanPulse Guardian AI v2", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router,        prefix="/auth",        tags=["Auth"])
app.include_router(reports.router,     prefix="/api/reports", tags=["Reports"])
app.include_router(predictions.router, prefix="/api/predict", tags=["Predictions"])

@app.get("/")
def root(): return {"message":"UrbanPulse Guardian AI API","version":"2.0.0","status":"running","docs":"/docs"}

@app.get("/health")
def health(): return {"status":"healthy","ai_models":"loaded","database":"connected"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
