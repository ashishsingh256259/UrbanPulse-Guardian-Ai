const fs = require('fs');

const API_URL = 'https://urbanpulse-guardian-ai.onrender.com';
let citizenToken = '';
let municipalToken = '';
let reportId = '';

const logResult = (name, res, body) => {
    console.log(`[${name}] STATUS: ${res.status}`);
    console.log(`[${name}] BODY:`, JSON.stringify(body).substring(0, 500));
    if (!res.ok) {
        console.error(`[${name}] ERROR:`, body);
    }
};

async function runTests() {
    console.log('--- STARTING E2E SMOKE TEST ---');

    // 1. HEALTH
    try {
        const healthRes = await fetch(`${API_URL}/health`);
        const healthBody = await healthRes.json();
        logResult('HEALTH', healthRes, healthBody);
        console.log('Health:', healthBody);
    } catch (e) {
        console.error('[HEALTH] ERROR:', e.message);
    }

    // 2. CITIZEN REGISTER
    const email = `test_citizen_${Date.now()}@example.com`;
    try {
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: 'Test',
                last_name: 'Citizen',
                email: email,
                phone: '1234567890',
                city: 'Delhi',
                password: 'Password123',
                role: 'citizen'
            })
        });
        const regBody = await regRes.json();
        logResult('REGISTER', regRes, regBody);
    } catch (e) {
        console.error('[REGISTER] ERROR:', e.message);
    }

    // 3. CITIZEN LOGIN
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: 'Password123'
            })
        });
        const loginBody = await loginRes.json();
        logResult('LOGIN', loginRes, loginBody);
        if (loginBody.token || loginBody.access_token) {
            citizenToken = loginBody.token || loginBody.access_token;
            console.log('[LOGIN] Token received');
        }
    } catch (e) {
        console.error('[LOGIN] ERROR:', e.message);
    }

    // 4. CITIZEN /ME
    try {
        if (citizenToken) {
            const meRes = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${citizenToken}` }
            });
            const meBody = await meRes.json();
            logResult('CITIZEN_ME', meRes, meBody);
        }
    } catch (e) {
        console.error('[CITIZEN_ME] ERROR:', e.message);
    }

    // 5. REPORT CREATION
    try {
        if (citizenToken) {
            // Write a dummy image file
            fs.writeFileSync('dummy.jpg', 'fake image content');
            
            const formData = new FormData();
            const blob = new Blob([fs.readFileSync('dummy.jpg')], { type: 'image/jpeg' });
            formData.append('photo', blob, 'dummy.jpg');
            formData.append('lat', '28.6139');
            formData.append('lng', '77.2090');
            formData.append('address', 'New Delhi');
            formData.append('issue_type', 'pothole');
            formData.append('description', 'Test pothole');

            const reportRes = await fetch(`${API_URL}/api/reports`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${citizenToken}` },
                body: formData
            });
            console.log('[CREATE_REPORT] STATUS:', reportRes.status);
            const rawBody = await reportRes.text();
            if (!reportRes.ok) {
                console.log('[CREATE_REPORT] RAW ERROR BODY:', rawBody.substring(0, 500));
            } else {
                const reportBody = JSON.parse(rawBody);
                logResult('CREATE_REPORT', reportRes, reportBody);
                if (reportBody.id) {
                    reportId = reportBody.id;
                    console.log('[CREATE_REPORT] Report ID:', reportId);
                    console.log('[CREATE_REPORT] AI Detected:', reportBody.ai_detected, reportBody.severity);
                }
            }
        }
    } catch (e) {
        console.error('[CREATE_REPORT] ERROR:', e.message);
    }

    // 6. MUNICIPAL LOGIN
    try {
        const mLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'municipal@urbanpulse.gov',
                password: 'Municipal@2024'
            })
        });
        const mLoginBody = await mLoginRes.json();
        logResult('MUNICIPAL_LOGIN', mLoginRes, mLoginBody);
        if (mLoginBody.token || mLoginBody.access_token) {
            municipalToken = mLoginBody.token || mLoginBody.access_token;
        }
    } catch (e) {
        console.error('[MUNICIPAL_LOGIN] ERROR:', e.message);
    }

    // 7. SECURITY - CITIZEN TRIES TO RESOLVE
    try {
        if (citizenToken && reportId) {
            const formData = new FormData();
            const blob = new Blob([fs.readFileSync('dummy.jpg')], { type: 'image/jpeg' });
            formData.append('resolved_photo', blob, 'dummy.jpg');

            const cResolveRes = await fetch(`${API_URL}/api/reports/${reportId}/resolve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${citizenToken}` },
                body: formData
            });
            const cResolveBody = await cResolveRes.json();
            logResult('CITIZEN_RESOLVE_ATTEMPT', cResolveRes, cResolveBody);
        }
    } catch (e) {
        console.error('[CITIZEN_RESOLVE_ATTEMPT] ERROR:', e.message);
    }

    // 8. MUNICIPAL STATUS UPDATE
    try {
        if (municipalToken && reportId) {
            const statusRes = await fetch(`${API_URL}/api/reports/${reportId}/status`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${municipalToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'in-progress' })
            });
            const statusBody = await statusRes.json();
            logResult('MUNICIPAL_STATUS_UPDATE', statusRes, statusBody);
        }
    } catch (e) {
        console.error('[MUNICIPAL_STATUS_UPDATE] ERROR:', e.message);
    }

    // 9. MUNICIPAL RESOLVE
    try {
        if (municipalToken && reportId) {
            const formData = new FormData();
            const blob = new Blob([fs.readFileSync('dummy.jpg')], { type: 'image/jpeg' });
            formData.append('resolved_photo', blob, 'dummy.jpg');

            const mResolveRes = await fetch(`${API_URL}/api/reports/${reportId}/resolve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${municipalToken}` },
                body: formData
            });
            const mResolveBody = await mResolveRes.json();
            logResult('MUNICIPAL_RESOLVE', mResolveRes, mResolveBody);
        }
    } catch (e) {
        console.error('[MUNICIPAL_RESOLVE] ERROR:', e.message);
    }

    console.log('--- END SMOKE TEST ---');
}

runTests();
