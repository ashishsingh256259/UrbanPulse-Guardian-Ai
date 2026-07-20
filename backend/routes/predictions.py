from fastapi import APIRouter
router = APIRouter()

@router.get("/flood")
async def flood(lat: float = 28.6139, lng: float = 77.2090):
    return {"probability": 82.0, "risk_level": "High", "forecast_hours": 48,
            "affected_areas": ["Yamuna Basin", "Low-lying areas"],
            "recommendation": "Pre-position sandbags. Alert drainage teams."}

@router.get("/city-wide")
async def city_wide():
    return {
        "flood_zones": [{"area":"Yamuna Basin","probability":82},{"area":"Shahdara Drain","probability":65}],
        "garbage_overflow": [{"zone":"Sector 18","probability":74,"hours":48}],
        "updated_at": "2024-01-15T14:30:00Z"
    }
