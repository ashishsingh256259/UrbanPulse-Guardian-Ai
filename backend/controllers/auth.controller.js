const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MUNICIPAL_ACCOUNTS = {
    "municipal@urbanpulse.gov": {
        password: "Municipal@2024",
        name: "Municipal Commissioner",
        city: "Delhi",
        id: "municipal_001"
    },
    "officer@urbanpulse.gov": {
        password: "Officer@2024",
        name: "Field Officer",
        city: "Delhi",
        id: "municipal_002"
    }
};

const makeToken = (id) => {
    return jwt.sign({ sub: id }, process.env.JWT_SECRET || 'urbanpulse-secret-key-12345', {
        expiresIn: '7d'
    });
};

const getLevel = (pts) => {
    if (pts >= 15000) return "Platinum Guardian";
    if (pts >= 5000) return "Gold Guardian";
    if (pts >= 1000) return "Silver Guardian";
    return "Bronze Guardian";
};

const formatUser = (u, role = "citizen") => {
    const pts = u.points || 0;
    const lvl = getLevel(pts);
    return {
        id: u._id || u.id,
        name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        email: u.email,
        city: u.city || '',
        role: u.role || role,
        points: pts,
        level: lvl,
        reports_count: u.reports_count || 0,
        resolved_count: u.resolved_count || 0,
    };
};

exports.register = async (req, res, next) => {
    try {
        const { first_name, last_name, email, phone, city, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const user = await User.create({
            first_name,
            last_name,
            email,
            phone,
            city,
            password_hash,
            role: 'citizen',
            points: 0,
            level: 'Bronze Guardian'
        });

        const token = makeToken(user._id);
        res.status(201).json({
            access_token: token,
            token_type: "bearer",
            user: formatUser(user)
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password, role = 'citizen' } = req.body;

        if (role === 'municipal' || MUNICIPAL_ACCOUNTS[email]) {
            const acc = MUNICIPAL_ACCOUNTS[email];
            if (!acc || acc.password !== password) {
                return res.status(401).json({ success: false, message: 'Invalid municipal credentials' });
            }
            const token = makeToken(acc.id);
            const user = {
                id: acc.id,
                name: acc.name,
                email: email,
                city: acc.city,
                role: 'municipal',
                points: 0,
                level: 'Municipal Officer',
                reports_count: 0,
                resolved_count: 0
            };
            return res.json({ access_token: token, token_type: "bearer", user });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = makeToken(user._id);
        res.json({
            access_token: token,
            token_type: "bearer",
            user: formatUser(user)
        });
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        if (req.user.role === 'municipal') {
            for (const [email, data] of Object.entries(MUNICIPAL_ACCOUNTS)) {
                if (data.id === req.user.id) {
                    return res.json({
                        id: data.id, name: data.name, email: email, city: data.city,
                        role: "municipal", points: 0, level: "Municipal Officer",
                        reports_count: 0, resolved_count: 0
                    });
                }
            }
        }
        res.json(formatUser(req.user));
    } catch (error) {
        next(error);
    }
};

exports.googleAuth = async (req, res, next) => {
    try {
        const { email, name, uid } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        if (MUNICIPAL_ACCOUNTS[email]) {
            const acc = MUNICIPAL_ACCOUNTS[email];
            const token = makeToken(acc.id);
            const user = {
                id: acc.id,
                name: acc.name,
                email: email,
                city: acc.city,
                role: 'municipal',
                points: 0,
                level: 'Municipal Officer',
                reports_count: 0,
                resolved_count: 0
            };
            return res.json({ access_token: token, token_type: "bearer", user });
        }

        let user = await User.findOne({ email });
        if (!user) {
            const parts = name ? name.split(' ') : ['Google', 'User'];
            const first_name = parts[0] || '';
            const last_name = parts.slice(1).join(' ') || '';
            
            // Generate a random password since they use Google
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(uid || Math.random().toString(), salt);

            user = await User.create({
                first_name,
                last_name,
                email,
                password_hash,
                role: 'citizen',
                points: 0,
                level: 'Bronze Guardian'
            });
        }

        const token = makeToken(user._id);
        res.json({
            access_token: token,
            token_type: "bearer",
            user: formatUser(user)
        });
    } catch (error) {
        next(error);
    }
};
