const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/error.middleware');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Route Files
const authRoutes = require('./routes/auth.routes');
const reportsRoutes = require('./routes/reports.routes');
const predictionsRoutes = require('./routes/predictions.routes');

// Mount Routes
app.use('/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/predict', predictionsRoutes);

// Root and Health
app.get('/', (req, res) => {
    res.json({ message: "UrbanPulse Guardian AI API", version: "2.0.0", status: "running", docs: "/docs" });
});

app.get('/health', (req, res) => {
    res.json({ status: "healthy", ai_models: "loaded", database: "connected" });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 8002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
