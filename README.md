# UrbanPulse Guardian AI v2

UrbanPulse is an AI-powered civic platform designed to help citizens and municipal authorities track, manage, and resolve urban infrastructure issues efficiently.

## Architecture

This project was successfully migrated to a modern web stack:
- **Frontend**: React (Vite) + Tailwind CSS + React Router + React Leaflet
- **Backend**: Node.js + Express + Mongoose
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: Google Gemini API (@google/genai) for automated issue categorization and risk scoring.

## Features

- **Citizen Dashboard**: Track reported issues and Guardian points.
- **Report Civic Issues**: Take a photo and let AI instantly categorize the issue (Potholes, Garbage, Waterlogging, etc.).
- **Live Heatmap**: View real-time risks across the city with interactive Leaflet maps.
- **Safe Route Planning**: Compute routes that avoid high-risk infrastructure hazards.
- **Municipal Command Center**: Municipal authorities can view all reports, filter them, update statuses, and upload resolution proof photos.
- **Rewards System**: Gamified Guardian Points and leaderboards to incentivize civic engagement.

## Directory Structure

```
UrbanPulseV2/
├── frontend_react/         # React Vite Application
│   ├── src/
│   │   ├── components/
│   │   ├── context/        # Auth Context
│   │   ├── layouts/        # Public, User, and Admin Layouts
│   │   ├── pages/          # All React Views
│   │   └── services/       # Axios API integration
├── backend/                # Node.js Express API
│   ├── config/             # Database Connection
│   ├── controllers/        # Route Handlers
│   ├── middleware/         # Auth, Error handling, Multer uploads
│   ├── models/             # Mongoose Schemas (User, Report)
│   ├── routes/             # Express Routers
│   └── uploads/            # Local Image Storage
└── package.json            # Root script runner
```

## Setup & Installation

1. **Clone the repository** and install dependencies for the root, frontend, and backend:
   ```bash
   npm run install:all
   ```

2. **Environment Variables:**
   Update the `backend/.env` file with your credentials:
   ```env
   PORT=8002
   MONGODB_URL=mongodb+srv://<user>:<password>@cluster...
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_google_gemini_api_key
   UPLOAD_DIR=uploads
   ```

3. **Start the Application:**
   Run the following command from the root directory to start both the Node.js backend and the React frontend concurrently:
   ```bash
   npm run dev
   ```

## Demo Accounts

**Citizen:** (Register a new account from the UI)
**Municipal Officer:** `municipal@urbanpulse.gov` / `Municipal@2024`
**Field Officer:** `officer@urbanpulse.gov` / `Officer@2024`
