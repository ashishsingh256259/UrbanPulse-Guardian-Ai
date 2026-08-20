const Emergency = require('../models/Emergency');

// POST /api/emergency/dispatch
exports.dispatch = async (req, res, next) => {
    try {
        const { category, facility, location, lat, lng } = req.body;

        if (!category || !facility || !location) {
            return res.status(400).json({ success: false, message: 'category, facility, and location are required.' });
        }

        const latNum  = parseFloat(lat);
        const lngNum  = parseFloat(lng);
        const hasCoords = !isNaN(latNum) && !isNaN(lngNum);

        const emergency = await Emergency.create({
            user_id: req.user?._id || null,
            category,
            facility,
            address: location,
            location: hasCoords
                ? { type: 'Point', coordinates: [lngNum, latNum] }
                : { type: 'Point', coordinates: [77.2090, 28.6139] }, // default Delhi centre
            status: 'REQUESTED'
        });

        res.status(201).json({
            success: true,
            emergency_id: emergency._id,
            status: emergency.status,
            message: 'Emergency dispatch request received. Units are being notified.',
            // NOTE: Status progression is manual / operator-driven. No live API is connected.
            _note: 'DEMO: Actual ambulance dispatch and status progression require integration with an emergency services API.'
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/emergency/:id/status
exports.getStatus = async (req, res, next) => {
    try {
        const emergency = await Emergency.findById(req.params.id);
        if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found.' });
        res.json({ status: emergency.status, created_at: emergency.created_at });
    } catch (error) {
        next(error);
    }
};
