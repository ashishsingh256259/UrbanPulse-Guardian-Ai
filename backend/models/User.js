const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    city: { type: String },
    password_hash: { type: String, required: true },
    role: { type: String, default: 'citizen' },
    points: { type: Number, default: 0 },
    level: { type: String, default: 'Bronze Guardian' },
    reports_count: { type: Number, default: 0 },
    resolved_count: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('User', UserSchema);
