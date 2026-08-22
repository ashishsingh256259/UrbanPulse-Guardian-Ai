const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
    createReport,
    getReports,
    getMyReports,
    getLeaderboard,
    getCityStats,
    getChartData,
    updateStatus,
    resolveReport,
    analyzePreview,
    analyzeScannerFrame
} = require('../controllers/reports.controller');

const scannerLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 frames per minute
    message: { success: false, message: 'Too many frames sent from this IP, please try again after a minute' }
});

router.get('/', getReports);
router.post('/', protect, upload.single('photo'), createReport);
router.post('/analyze-preview', protect, upload.single('photo'), analyzePreview);
router.post('/analyze-scanner-frame', protect, scannerLimiter, upload.single('photo'), analyzeScannerFrame);
router.get('/my-reports', protect, getMyReports);
router.get('/leaderboard', getLeaderboard);
router.get('/stats/city', getCityStats);
router.get('/stats/chart-data', getChartData);
router.put('/:report_id/status', protect, updateStatus);
router.post('/:report_id/resolve', protect, upload.single('resolved_photo'), resolveReport);

module.exports = router;
