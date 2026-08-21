const Report = require('../models/Report');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const ISSUE_BASE_RISK = { pothole: 65, garbage: 45, waterlogging: 75, streetlight: 55, road_crack: 60, sewer: 70, other: 40 };
const SEV_SCORE = { critical: 1.0, high: 0.75, medium: 0.5, low: 0.25 };

function calcRisk(issue_type, severity, lat, lng) {
    const base = (ISSUE_BASE_RISK[issue_type] || 40) / 100;
    const sev = SEV_SCORE[severity] || 0.5;
    const fac = (28.55 <= lat && lat <= 28.75 && 77.1 <= lng && lng <= 77.4) ? 0.7 : 0.4;
    const road = (28.60 <= lat && lat <= 28.70 && 77.20 <= lng && lng <= 77.35) ? 0.8 : 0.5;
    const score = (sev * 0.35 + 0.20 * 0.6 + road * 0.20 + fac * 0.15 + base * 0.10) * 100;
    return Math.round(Math.min(Math.max(score, 5), 99) * 10) / 10;
}

// Minimum confidence to classify an image as a confirmed infrastructure issue
const MIN_CONFIDENCE_THRESHOLD = 60;

async function analyzeImageWithAI(imagePath, userIssueType) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_google_gemini_api_key_here" || apiKey === "your_gemini_api_key_here") {
        throw new Error("AI analysis unavailable — Gemini API key not configured.");
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const context = userIssueType ? `The user believes this may be a '${userIssueType}'.` : "";
        const prompt = `You are an urban infrastructure AI analyst for a civic reporting system.
Your task is to examine this image and determine whether it shows a genuine urban infrastructure problem.

Supported issue categories:
- Pothole
- Broken Streetlight
- Garbage/Waste Overflow
- Road Damage
- Water Leakage
- Traffic/Road Obstruction
- Other Urban Infrastructure Issue
- No Infrastructure Issue

${context}

IMPORTANT RULES:
1. You MUST return issueDetected=false if the image shows: a person/selfie, an animal, indoor scene, clear sky, random objects, or anything that is NOT an urban infrastructure problem.
2. Only return issueDetected=true if you can clearly see a civic/infrastructure problem in the image.
3. Do NOT force a classification. If uncertain, lower your confidence and set issueDetected=false if confidence < ${MIN_CONFIDENCE_THRESHOLD}.
4. The reasoning must describe WHAT you see in the image that led to your conclusion.

Respond with ONLY a valid JSON object in this exact format:
{
  "issueDetected": true,
  "issueType": "Pothole",
  "confidence": 87,
  "severity": "High",
  "priority": "High",
  "description": "Visible road-surface depression with crumbling pavement edges and exposed aggregate.",
  "reasoning": "The image clearly shows a deep circular hole in the asphalt surface typical of a pothole."
}
OR if no issue:
{
  "issueDetected": false,
  "issueType": "No Infrastructure Issue",
  "confidence": 95,
  "severity": "Low",
  "priority": "Low",
  "description": "No valid urban infrastructure issue detected.",
  "reasoning": "The image does not show an urban infrastructure problem. It appears to be a clear sky and trees."
}`;

        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        // Detect MIME type from file extension
        const ext = path.extname(imagePath).toLowerCase();
        const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
        const mimeType = mimeMap[ext] || 'image/jpeg';
        
        console.log(`[DEV] Gemini response received. Parsing JSON...`);

        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        console.log(`[DEV] Starting Gemini request with model: ${modelName}...`);

        const response = await ai.models.generateContent({
            model: modelName,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { inlineData: { data: base64Image, mimeType } },
                        { text: prompt }
                    ]
                }
            ]
        });

        console.log(`[DEV] Gemini response received. Parsing JSON...`);

        let text = response.text.trim();
        if (text.startsWith("```json")) text = text.slice(7, -3).trim();
        else if (text.startsWith("```")) text = text.slice(3, -3).trim();
        
        const result = JSON.parse(text);
        console.log(`[DEV] Parsing successful. Detected: ${result.issueDetected}`);

        const confidence = parseFloat(result.confidence) || 0;
        const issueDetected = result.issueDetected === true && confidence >= MIN_CONFIDENCE_THRESHOLD;

        return {
            issue_detected: issueDetected,
            detected: issueDetected ? (result.issueType || 'Other Urban Infrastructure Issue') : null,
            confidence,
            severity: issueDetected ? (result.severity ? result.severity.toLowerCase() : 'medium') : null,
            priority: issueDetected ? (result.priority ? result.priority.toLowerCase() : 'medium') : null,
            explanation: result.description || 'No valid urban infrastructure issue detected.',
            recommendation: result.reasoning || ''
        };
    } catch (error) {
        console.error(`[DEV] Gemini API Error: ${error.message}`);
        // On API error: do NOT fabricate a result
        throw new Error('AI analysis failed: ' + error.message);
    }
}

const getLevel = (pts) => {
    if (pts >= 15000) return "Platinum Guardian";
    if (pts >= 5000) return "Gold Guardian";
    if (pts >= 1000) return "Silver Guardian";
    return "Bronze Guardian";
};

exports.analyzePreview = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image' });
        }
        const { issue_type } = req.body;
        const imagePath = req.file.path;

        let aiResult;
        try {
            aiResult = await analyzeImageWithAI(imagePath, issue_type);
        } catch (e) {
            // Clean up uploaded file
            try { fs.unlinkSync(imagePath); } catch (_) {}
            return res.status(500).json({
                success: false,
                message: 'AI analysis failed. Please try again.',
                error: e.message
            });
        }

        // Clean up temp file after analysis
        try { fs.unlinkSync(imagePath); } catch (_) {}

        res.json({
            issue_detected: aiResult.issue_detected,
            issue_type: aiResult.detected,
            confidence: aiResult.confidence,
            severity: aiResult.severity,
            priority: aiResult.priority,
            explanation: aiResult.explanation,
            recommendation: aiResult.recommendation
        });
    } catch (error) {
        next(error);
    }
};

exports.createReport = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image' });
        }
        
        const { lat, lng, address, issue_type, landmark = "", description = "" } = req.body;
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        const imagePath = req.file.path;
        const imageUrl = `/uploads/${req.file.filename}`;

        let aiResult;
        try {
            aiResult = await analyzeImageWithAI(imagePath, issue_type);
        } catch (e) {
            console.error('AI analysis failed during report creation:', e.message);
            // Fall back gracefully: use user-provided type or 'other'
            aiResult = {
                issue_detected: !!issue_type,
                detected: issue_type || 'other',
                confidence: 50,
                severity: 'medium',
                explanation: 'AI analysis unavailable.',
                recommendation: 'Issue submitted manually.'
            };
        }

        const detectedType = aiResult.detected || issue_type || 'other';
        const severity = aiResult.severity || 'medium';
        const risk = calcRisk(detectedType, severity, latNum, lngNum);
        const points = risk >= 80 ? 20 : 10;

        const report = await Report.create({
            user_id: req.user.id || req.user._id.toString(),
            user_name: req.user.name || `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim(),
            issue_type: detectedType,
            severity,
            description,
            landmark,
            location: { type: 'Point', coordinates: [lngNum, latNum], address: address || "" },
            ai_confidence: aiResult.confidence,
            ai_detected: aiResult.issue_detected ? detectedType : null,
            risk_score: risk,
            image_url: imageUrl,
            points_awarded: points
        });

        let updatedUser = null;
        if (req.user.role !== 'municipal') {
            const user = await User.findById(req.user._id);
            if (user) {
                user.points += points;
                user.reports_count += 1;
                user.level = getLevel(user.points);
                await user.save();
                
                updatedUser = {
                    id: user._id,
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    email: user.email,
                    city: user.city || '',
                    role: 'citizen',
                    points: user.points,
                    level: user.level
                };
            }
        }

        res.status(201).json({
            id: report._id,
            message: "Report submitted successfully",
            issue_detected: aiResult.issue_detected,
            ai_detected: aiResult.issue_detected ? detectedType : null,
            confidence: aiResult.confidence,
            severity,
            risk_score: risk,
            points_awarded: points,
            status: "pending",
            explanation: aiResult.explanation,
            recommendation: aiResult.recommendation,
            updated_user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

exports.getReports = async (req, res, next) => {
    try {
        const { status, issue_type, limit = 100, skip = 0 } = req.query;
        const query = {};
        if (status) query.status = status;
        if (issue_type) query.issue_type = issue_type;

        const reports = await Report.find(query)
            .sort({ risk_score: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));
            
        const formattedReports = reports.map(r => ({
            ...r.toObject(),
            id: r._id
        }));

        res.json(formattedReports);
    } catch (error) {
        next(error);
    }
};

exports.getMyReports = async (req, res, next) => {
    try {
        const uid = req.user.id || req.user._id.toString();
        const reports = await Report.find({ user_id: uid }).sort({ created_at: -1 });
        
        const formattedReports = reports.map(r => ({
            ...r.toObject(),
            id: r._id
        }));
        
        res.json(formattedReports);
    } catch (error) {
        next(error);
    }
};

exports.getLeaderboard = async (req, res, next) => {
    try {
        const users = await User.find({})
            .select('first_name last_name email points reports_count resolved_count city')
            .sort({ points: -1 })
            .limit(20);

        const result = users.map(u => ({
            user_id: u._id,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            email: u.email,
            points: u.points || 0,
            reports_count: u.reports_count || 0,
            city: u.city || ''
        }));
        
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.getCityStats = async (req, res, next) => {
    try {
        const total = await Report.countDocuments({});
        const resolved = await Report.countDocuments({ status: "resolved" });
        const pending = await Report.countDocuments({ status: "pending" });
        const critical = await Report.countDocuments({ risk_score: { $gte: 80 }, status: { $ne: "resolved" } });
        
        res.json({
            total, resolved, pending, critical,
            resolution_rate: total > 0 ? Math.round((resolved / total * 100) * 10) / 10 : 0
        });
    } catch (error) {
        next(error);
    }
};

exports.getChartData = async (req, res, next) => {
    try {
        const categoriesResult = await Report.aggregate([
            { $group: { _id: "$issue_type", count: { $sum: 1 } } }
        ]);
        const categories = { labels: [], data: [] };
        categoriesResult.forEach(doc => {
            categories.labels.push(doc._id);
            categories.data.push(doc.count);
        });

        const statusResult = await Report.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const statuses = { labels: [], data: [] };
        statusResult.forEach(doc => {
            statuses.labels.push(doc._id);
            statuses.data.push(doc.count);
        });

        res.json({ categories, statuses });
    } catch (error) {
        next(error);
    }
};

exports.updateStatus = async (req, res, next) => {
    try {
        if (req.user.role !== 'municipal') {
            return res.status(403).json({ success: false, message: 'Only municipal officers can update report status' });
        }
        const { report_id } = req.params;
        const { status, assigned_team } = req.body;

        const updateData = { status };
        if (assigned_team) updateData.assigned_team = assigned_team;

        const report = await Report.findByIdAndUpdate(report_id, updateData, { new: true });
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        res.json({ message: `Status updated to ${status}` });
    } catch (error) {
        next(error);
    }
};

exports.resolveReport = async (req, res, next) => {
    try {
        if (req.user.role !== 'municipal') {
            return res.status(403).json({ success: false, message: 'Only municipal officers can resolve reports' });
        }
        const { report_id } = req.params;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload resolution proof image' });
        }

        const resolved_url = `/uploads/${req.file.filename}`;

        const report = await Report.findById(report_id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        report.status = 'resolved';
        report.resolved_image_url = resolved_url;
        report.resolved_at = Date.now();
        await report.save();

        // Award +5 points to original reporter
        try {
            await User.findByIdAndUpdate(report.user_id, {
                $inc: { points: 5, resolved_count: 1 }
            });
        } catch (e) {
            // Ignore if user not found (e.g. guest or municipal)
        }

        res.json({ message: "Report resolved successfully", resolved_image_url: resolved_url });
    } catch (error) {
        next(error);
    }
};
