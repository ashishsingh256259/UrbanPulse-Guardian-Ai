const express = require('express');
const router = express.Router();
const { dispatch, getStatus } = require('../controllers/emergency.controller');
const { protect } = require('../middleware/auth.middleware');

// POST /api/emergency/dispatch — requires a logged-in user
router.post('/dispatch', protect, dispatch);

// GET /api/emergency/:id/status — public (ref id is opaque)
router.get('/:id/status', protect, getStatus);

module.exports = router;
