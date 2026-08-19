const express = require('express');
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
    resolveReport
} = require('../controllers/reports.controller');

router.get('/', getReports);
router.post('/', protect, upload.single('photo'), createReport);
router.get('/my-reports', protect, getMyReports);
router.get('/leaderboard', getLeaderboard);
router.get('/stats/city', getCityStats);
router.get('/stats/chart-data', getChartData);
router.put('/:report_id/status', protect, updateStatus);
router.post('/:report_id/resolve', protect, upload.single('resolved_photo'), resolveReport);

module.exports = router;
