const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'urbanpulse-secret-key-12345');
        
        if (decoded.sub.startsWith('municipal_')) {
            // Handle municipal accounts (which we hardcoded in auth.controller.js in Python)
            req.user = { _id: decoded.sub, id: decoded.sub, role: 'municipal' };
            return next();
        }

        req.user = await User.findById(decoded.sub);
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

module.exports = { protect };
