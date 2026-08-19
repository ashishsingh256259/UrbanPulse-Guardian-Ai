const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    user_id: { type: String, required: true, index: true },
    user_name: { type: String },
    issue_type: { type: String },
    severity: { type: String },
    description: { type: String },
    landmark: { type: String },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' },
        address: { type: String }
    },
    ai_confidence: { type: Number },
    ai_detected: { type: String },
    risk_score: { type: Number, index: -1 },
    image_url: { type: String },
    resolved_image_url: { type: String },
    status: { type: String, default: 'pending', index: 1 },
    points_awarded: { type: Number, default: 0 },
    assigned_team: { type: String },
    resolved_at: { type: Date }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Report', ReportSchema);
