# 🏙️ UrbanPulse Guardian AI v2

## 🚀 Quick Start

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8002
```

### Frontend
```bash
cd frontend
python3 -m http.server 3000
```
Open: http://localhost:3000

---

## 🔐 Login Credentials

### Citizen
- Register at /pages/register.html with any email
- Login at /pages/login.html → select "Citizen" tab

### 🏛️ Municipality (Fixed Accounts)

| Email | Password | Role |
|-------|----------|------|
| municipal@urbanpulse.gov | Municipal@2024 | Commissioner |
| officer@urbanpulse.gov   | Officer@2024   | Field Officer |

Login at /pages/login.html → select "Municipality" tab

---

## 📱 Pages

| Page | URL | Who |
|------|-----|-----|
| Home | / | Public |
| Register | /pages/register.html | Public |
| Login | /pages/login.html | Public |
| Dashboard | /pages/dashboard.html | Citizens |
| Report Issue | /pages/report.html | Citizens |
| City Heatmap | /pages/heatmap.html | All logged in |
| Rewards | /pages/rewards.html | Citizens |
| Municipal Dashboard | /pages/municipal.html | Municipality only |

---

## 🏆 Points System (Real — Not Fake)

Points only update when you actually submit reports:
- +10 pts per valid report
- +20 pts for critical issue (risk ≥ 80)
- +5 pts when your report is resolved by municipality

---

## 🏛️ Municipal Dashboard Features

- **Overview** — Total, Critical, Pending, Resolved counts
- **Pending Issues** — Full list with location, filter by type/severity
- **In Progress** — Reports assigned to teams
- **Resolved** — Completed issues with proof photos
- **Critical** — Risk score ≥ 80 issues
- **Priority Queue** — AI-sorted by risk score
- **Resolve Flow** — Select report → Upload proof photo → Mark Resolved
  - Automatically awards +5 pts to the citizen who reported it
