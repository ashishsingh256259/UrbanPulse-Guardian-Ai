exports.flood = async (req, res, next) => {
    try {
        const lat = parseFloat(req.query.lat) || 28.6139;
        const lng = parseFloat(req.query.lng) || 77.2090;

        res.json({
            probability: 82.0,
            risk_level: "High",
            forecast_hours: 48,
            affected_areas: ["Yamuna Basin", "Low-lying areas"],
            recommendation: "Pre-position sandbags. Alert drainage teams."
        });
    } catch (error) {
        next(error);
    }
};

exports.cityWide = async (req, res, next) => {
    try {
        res.json({
            flood_zones: [
                { area: "Yamuna Basin", probability: 82 },
                { area: "Shahdara Drain", probability: 65 }
            ],
            garbage_overflow: [
                { zone: "Sector 18", probability: 74, hours: 48 }
            ],
            updated_at: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};
