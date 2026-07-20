// ===== URBANPULSE v2 - CORE JS =====
// Use localhost for local development, or your deployed backend URL for production
const API = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:'
    ? 'http://localhost:8002' 
    : 'https://your-backend-production-url.com'; // <-- UPDATE THIS when deploying backend

// ── API CALL ──────────────────────────────────────────────
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('upg_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'API Error');
  return data;
}

async function apiUpload(endpoint, formData) {
  const headers = {};
  const token = localStorage.getItem('upg_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + endpoint, { method: 'POST', headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Upload Error');
  return data;
}

// ── AUTH HELPERS ──────────────────────────────────────────
function getToken() { return localStorage.getItem('upg_token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('upg_user') || 'null'); }
  catch { return null; }
}
function setAuth(token, user) {
  localStorage.setItem('upg_token', token);
  localStorage.setItem('upg_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('upg_token');
  localStorage.removeItem('upg_user');
}
function isLoggedIn() { return !!getToken(); }
function isMunicipal() {
  const u = getUser();
  return u && u.role === 'municipal';
}

function requireAuth(redirectTo = '/pages/login.html') {
  if (!isLoggedIn()) { window.location.href = redirectTo; return false; }
  return true;
}
function requireMunicipal() {
  if (!isLoggedIn() || !isMunicipal()) { window.location.href = '/pages/login.html'; return false; }
  return true;
}
function redirectIfLoggedIn() {
  if (!isLoggedIn()) return;
  window.location.href = isMunicipal() ? '/pages/municipal.html' : '/pages/dashboard.html';
}

function logout() {
  clearAuth();
  window.location.href = '/index.html';
}

// ── NAVBAR BUILDER ────────────────────────────────────────
function buildNav(activePage = '') {
  const user = getUser();
  const loggedIn = isLoggedIn();
  const municipal = isMunicipal();

  let links = '';
  if (loggedIn && !municipal) {
    const pages = [
      { href: '/pages/dashboard.html',  label: 'Dashboard', id: 'dashboard' },
      { href: '/pages/report.html',     label: 'Report Issue', id: 'report' },
      { href: '/pages/heatmap.html',    label: 'City Heatmap', id: 'heatmap' },
      { href: '/pages/saferoute.html',  label: '🛡️ Safe Route', id: 'saferoute' },
      { href: '/pages/rewards.html',    label: 'Rewards', id: 'rewards' },
    ];
    links = pages.map(p =>
      `<a href="${p.href}" class="${activePage === p.id ? 'active' : ''}">${p.label}</a>`
    ).join('');
  } else if (loggedIn && municipal) {
    const pages = [
      { href: '/pages/municipal.html',  label: 'Dashboard', id: 'municipal' },
      { href: '/pages/heatmap.html',    label: 'City Heatmap', id: 'heatmap' },
    ];
    links = pages.map(p =>
      `<a href="${p.href}" class="${activePage === p.id ? 'active' : ''}">${p.label}</a>`
    ).join('');
  }

  let right = '';
  if (loggedIn) {
    right = `
      <span style="font-size:0.82rem;color:var(--text2);">👋 ${user?.name?.split(' ')[0] || 'User'}</span>
      <button class="btn-nav-outline" onclick="logout()">Logout</button>
    `;
  } else {
    right = `
      <a href="/pages/login.html" class="btn-nav-outline">Login</a>
      <a href="/pages/register.html" class="btn-nav-primary">Sign Up</a>
    `;
  }

  const nav = document.getElementById('main-nav');
  if (nav) {
    nav.innerHTML = `
      <a class="nav-brand" href="${loggedIn && municipal ? '/pages/municipal.html' : '/index.html'}">
        <div class="nav-logo">🏙️</div>
        <span>UrbanPulse <span style="color:var(--cyan)">Guardian</span></span>
      </a>
      <div class="nav-links">${links}</div>
      <div class="nav-right">${right}</div>
    `;
  }
}

// ── TOAST ─────────────────────────────────────────────────
function toast(type, title, msg, duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `
    <span class="toast-icon">${icons[type]||'ℹ️'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, duration);
}

// ── HELPERS ───────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function riskColor(score) {
  if (score >= 80) return 'var(--red)';
  if (score >= 60) return 'var(--orange)';
  if (score >= 40) return 'var(--yellow)';
  return 'var(--green)';
}

function riskLabel(score) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function riskBadge(score) {
  const cls = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';
  return `<span class="badge badge-${cls}">${riskLabel(score)}</span>`;
}

function statusBadge(status) {
  const map = {
    pending:     '<span class="badge badge-pending">⏳ Pending</span>',
    assigned:    '<span class="badge badge-medium">👷 Assigned</span>',
    in_progress: '<span class="badge badge-high">🔧 In Progress</span>',
    resolved:    '<span class="badge badge-resolved">✅ Resolved</span>',
    rejected:    '<span class="badge" style="background:rgba(255,255,255,0.05);color:var(--text2)">❌ Rejected</span>',
  };
  return map[status] || status;
}

function issueEmoji(type) {
  const map = { pothole:'🕳️', garbage:'🗑️', waterlogging:'💧', streetlight:'💡', road_crack:'🛣️', sewer:'🚧', other:'⚠️' };
  return map[type] || '⚠️';
}

function getLevel(points) {
  if (points >= 15000) return { name: 'Platinum Guardian', icon: '💎', next: null, nextAt: null };
  if (points >= 5000)  return { name: 'Gold Guardian',     icon: '🥇', next: 'Platinum', nextAt: 15000 };
  if (points >= 1000)  return { name: 'Silver Guardian',   icon: '🥈', next: 'Gold',     nextAt: 5000 };
  return                      { name: 'Bronze Guardian',   icon: '🥉', next: 'Silver',   nextAt: 1000 };
}

// ── NAVBAR SCROLL ─────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (nav) nav.style.background = window.scrollY > 20
    ? 'rgba(7,9,15,0.98)' : 'rgba(7,9,15,0.92)';
});

window.UPG = { apiCall, apiUpload, getToken, getUser, setAuth, clearAuth, isLoggedIn, isMunicipal, requireAuth, requireMunicipal, redirectIfLoggedIn, logout, buildNav, toast, timeAgo, riskColor, riskLabel, riskBadge, statusBadge, issueEmoji, getLevel };
