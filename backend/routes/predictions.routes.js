const express = require('express');
const router = express.Router();
const { flood, cityWide } = require('../controllers/predictions.controller');

router.get('/flood', flood);
router.get('/city-wide', cityWide);

module.exports = router;
