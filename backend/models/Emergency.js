const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, required: true },
    facility: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    address: { type: String },
    status: {
        type: String,
        enum: ['REQUESTED', 'DISPATCHING', 'EN_ROUTE', 'ARRIVED', 'RESOLVED'],
        default: 'REQUESTED'
    },
    created_at: { type: Date, default: Date.now }
});

emergencySchema.index({ location: '2dsphere' });
emergencySchema.index({ user_id: 1 });
emergencySchema.index({ status: 1 });
emergencySchema.index({ created_at: -1 });

module.exports = mongoose.model('Emergency', emergencySchema);
