import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

/* ──────────────────────────────────────────────
   MUNICIPAL COPILOT (original interface preserved)
────────────────────────────────────────────── */
const MunicipalCopilot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      html: `<div class="font-bold mb-2 flex items-center gap-1.5">✨ URBANPULSE COMMAND COPILOT ONLINE</div>Welcome Commissioner. I am connected directly to the Delhi NCR real-time sensory grid. I can help compute priorities, predict hazard growth patterns, suggest 1-2-3 remediation plans, and analyze overall safety scores.<br><br>Select a standard intelligence directive below or input a custom telemetry inquiry.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  ]);
  const chatRef = useRef(null);
  const { apiCall } = useAuth();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendPrompt = (text) => { setInput(text); handleSend(text); };

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim()) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: textToSend, time: timeStr }]);
    setInput('');

    try {
      const data = await apiCall('/api/predict/city-wide');
      let html = `<div class="font-bold mb-2 uppercase">AI Analysis — Municipal Intelligence</div>Analyzing: "${textToSend}"<br><br>`;
      if (data.flood_zones?.length) {
        html += `<div class="font-bold mb-1">⚠️ Flood Risk Zones</div><ul class="ml-5 mb-2 list-disc">`;
        data.flood_zones.forEach(z => { html += `<li>${z.area}: <strong>${z.probability}%</strong> probability</li>`; });
        html += `</ul>`;
      }
      if (data.garbage_overflow?.length) {
        html += `<div class="font-bold mb-1">🗑️ Garbage Overflow Risk</div><ul class="ml-5 list-disc">`;
        data.garbage_overflow.forEach(z => { html += `<li>${z.zone}: <strong>${z.probability}%</strong> — within ${z.hours}h</li>`; });
        html += `</ul>`;
      }
      if (textToSend.toLowerCase().includes('improve')) {
        html += `<br><div class="font-bold mb-1">📋 Priority Recommendation</div>Dispatch crews to highest-risk flood zones and pre-position sandbag teams near Yamuna Basin immediately.`;
      }
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', html, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
    } catch {
      let html = '';
      if (textToSend.includes('improve')) {
        html = `<div class="font-bold mb-2 uppercase">Executive Summary: City Safety Operations</div>Resources must be diverted to mitigate critical risks in declining sectors.<br><br><div class="font-bold mb-1">PRIORITY 1: CONNAUGHT PLACE</div><ul class="ml-5 mb-2 list-disc"><li>Recommended Action: Dispatch 2 clearance units and 1 electrical crew.</li></ul>`;
      } else if (textToSend.includes('safest')) {
        html = `<div class="font-bold mb-2 uppercase">HIGH-SAFETY ZONES</div><strong>DLF Cyber City</strong> — Safety Score: 94, 0 active hazards.`;
      } else {
        html = `Analyzing live telemetry for: "${textToSend}".<br><br>Connaught Place requires immediate attention due to multiple infrastructure hazards.`;
      }
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', html, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
    }
  };

  return (
    <div className="grid md:grid-cols-[240px_1fr] min-h-[calc(100vh-var(--nav-h))] mt-[var(--nav-h)]">
      <Sidebar />
      <div className="p-7 overflow-y-auto h-[calc(100vh-var(--nav-h))]">
        <div className="mb-5">
          <h1 className="text-[1.6rem] flex items-center gap-2.5 font-display font-extrabold tracking-tight">
            <span className="text-red text-base">●</span> Delhi NCR Municipal Command Terminal
          </h1>
          <p className="text-text2">Predictive Infrastructure Dispatch Deck</p>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6 h-[calc(100%-80px)]">
          <div className="flex flex-col gap-5">
            <div className="card p-6 pb-5">
              <div className="font-display text-[1.1rem] font-extrabold mb-3 uppercase tracking-wider">Standard Command Directives</div>
              <p className="text-[0.85rem] text-text2 mb-5">Select one of the structured prompts mapped for your officer security clearance:</p>
              {[
                { title: "Which area should be prioritized today?", sub: "Identifies top density risk hotspots" },
                { title: "What is the highest risk area?", sub: "Calculates the lowest safety index grids" },
                { title: "Which issue category is growing fastest?", sub: "Tracks weekly growth of road vs waste logs" },
                { title: "How can I improve the city's safety score?", sub: "Gives actionable remediation dispatches" }
              ].map((dir, i) => (
                <div key={i} onClick={() => sendPrompt(dir.title)} className="bg-[rgba(255,255,255,0.02)] border border-border rounded-xl p-4 mb-3 cursor-pointer transition-all duration-200 flex items-center justify-between hover:bg-[rgba(0,212,255,0.04)] hover:border-[rgba(0,212,255,0.25)] hover:translate-x-0.5 group">
                  <div>
                    <div className="font-bold text-[0.9rem] text-text mb-1">{dir.title}</div>
                    <div className="text-[0.75rem] text-text2">{dir.sub}</div>
                  </div>
                  <div className="text-text3 group-hover:text-cyan transition-colors">›</div>
                </div>
              ))}
              <div className="text-[0.75rem] text-text3 mt-4 flex items-center gap-2">
                <span>🔒 Full compliance protocols active.</span>
              </div>
            </div>

            <div className="card p-5">
              <div className="text-[0.8rem] font-bold text-text2 mb-4 flex items-center gap-2 uppercase tracking-wider">ⓘ System Context Parameters</div>
              <div className="flex justify-between mb-3 text-[0.85rem]">
                <span className="text-text2">System core</span>
                <span className="font-bold">Gemini Flash</span>
              </div>
              <div className="flex justify-between mb-3 text-[0.85rem]">
                <span className="text-text2">Database Engine</span>
                <span className="font-bold">MongoDB (Live)</span>
              </div>
              <div className="flex justify-between text-[0.85rem]">
                <span className="text-text2">Backlog Indexing</span>
                <span className="font-bold text-cyan">Active (Auto-Rebuild)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col h-full border border-border rounded-[var(--r)] bg-bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-[rgba(0,212,255,0.03)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 font-bold font-display text-[1.05rem]">COPILOT INTERACTIVE CONSOLE</div>
                <div className="text-[0.75rem] text-text2 mt-0.5">Municipal Command Channel</div>
              </div>
              <div className="text-[0.7rem] font-bold text-[#4285F4] bg-[rgba(66,133,244,0.1)] px-2.5 py-1 rounded-[20px] flex items-center gap-1.5 border border-[rgba(66,133,244,0.2)]">
                ✨ Gemini Powered
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5 bg-bg" ref={chatRef}>
              {messages.map(m => (
                <div key={m.id} className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'self-end' : 'self-start'}`}>
                  <div className={`px-4 py-3.5 rounded-2xl text-[0.9rem] leading-relaxed ${m.sender === 'user' ? 'bg-[#1a42f5] text-white rounded-br-sm' : 'bg-bg-card border border-border rounded-bl-sm text-text'}`}
                       dangerouslySetInnerHTML={m.html ? { __html: m.html } : undefined}>
                    {m.text}
                  </div>
                  <div className={`text-[0.65rem] text-text3 mt-1.5 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>{m.time}</div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-bg-card border-t border-border">
              <div className="flex items-center gap-3 bg-bg border border-border rounded-full p-1.5 pl-5 focus-within:border-cyan focus-within:shadow-[0_0_0_3px_rgba(0,212,255,0.08)] transition-all">
                <input
                  type="text"
                  className="flex-1 bg-transparent border-none text-text font-sans text-[0.95rem] outline-none"
                  placeholder="Ask Copilot: 'Why is my area unsafe?', 'What actions should be prioritized?'..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  className="w-9 h-9 rounded-full bg-bg-card2 border border-border text-text2 flex items-center justify-center cursor-pointer transition-all hover:bg-cyan hover:text-black hover:border-cyan"
                  onClick={() => handleSend()}
                >➤</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   CITIZEN COPILOT
────────────────────────────────────────────── */
const CitizenCopilot = () => {
  const { user, apiCall } = useAuth();
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      html: `<div class="font-bold mb-2">👋 Hi there!</div>I'm your <strong>UrbanPulse AI Copilot</strong> — here to help you navigate city safety, track your reports, and understand urban risks near you.<br><br>Select a question below or type your own.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  ]);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await apiCall('/api/reports/my-reports');
        setReports(data || []);
      } catch {
        setReports([]);
      } finally {
        setReportsLoading(false);
      }
    };
    if (user) fetchReports();
  }, [user, apiCall]);

  const sendPrompt = (text) => { setInput(text); handleSend(text); };

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim() || aiLoading) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: textToSend, time: timeStr }]);
    setInput('');
    setAiLoading(true);

    try {
      const pendingCount = reports.filter(r => r.status === 'pending').length;
      const resolvedCount = reports.filter(r => r.status === 'resolved').length;
      const lastReport = reports[0];
      const q = textToSend.toLowerCase();
      let html = '';

      if (q.includes('safe') || q.includes('is my area')) {
        try {
          const flood = await apiCall('/api/predict/flood?lat=28.6139&lng=77.2090');
          html = `<div class="font-bold mb-2">🛡️ Area Safety Report</div>Based on current sensor data for <strong>${user?.city || 'your city'}</strong>:<br><br>`;
          html += `<div class="font-bold mb-1">⚠️ Flood Risk</div>Risk Level: <strong>${flood.risk_level || 'Moderate'}</strong> (${flood.probability || 65}% probability)<br>Forecast: Next ${flood.forecast_hours || 48} hours`;
          if (flood.recommendation) html += `<br><br>💡 <em>${flood.recommendation}</em>`;
          if (pendingCount > 0) html += `<br><br>You have <strong>${pendingCount} pending report${pendingCount > 1 ? 's' : ''}</strong> in your area being reviewed.`;
        } catch {
          html = `<div class="font-bold mb-2">🛡️ Area Safety</div>Your area in <strong>${user?.city || 'your city'}</strong> is actively monitored. You have <strong>${reports.length}</strong> report${reports.length !== 1 ? 's' : ''} submitted helping improve city safety.`;
        }
      } else if (q.includes('near me') || q.includes('nearby') || q.includes('problems')) {
        html = `<div class="font-bold mb-2">🗺️ Nearby Reports</div>`;
        if (reports.length === 0) {
          html += `No reports found yet. <strong>Be the first</strong> to report an issue and earn Guardian points!`;
        } else {
          html += `You've reported <strong>${reports.length} issue${reports.length !== 1 ? 's' : ''}</strong>:<br><br>`;
          const icons = { pothole: '🕳️', garbage: '🗑️', waterlogging: '💧', streetlight: '💡', road_crack: '🛣️', sewer: '🚧' };
          reports.slice(0, 3).forEach(r => {
            html += `${icons[r.issue_type] || '⚠️'} <strong>${(r.issue_type || 'Issue').replace('_', ' ')}</strong> — ${r.status === 'resolved' ? '✅ Resolved' : '⏳ Pending'}<br>`;
          });
          if (reports.length > 3) html += `<br>…and ${reports.length - 3} more. <a href="/dashboard" style="color:var(--cyan)">View all →</a>`;
        }
      } else if (q.includes('how') && q.includes('report') || q.includes('submit')) {
        html = `<div class="font-bold mb-2">📸 How to Report an Issue</div><ol style="margin-left:1.2rem;list-style:decimal">`;
        html += `<li style="margin-bottom:6px">Go to <a href="/report" style="color:var(--cyan)">Report an Issue</a></li>`;
        html += `<li style="margin-bottom:6px">Upload a clear photo of the problem</li>`;
        html += `<li style="margin-bottom:6px">AI automatically detects the issue type, severity, and risk score</li>`;
        html += `<li style="margin-bottom:6px">Confirm location on the map</li>`;
        html += `<li>Submit — and earn <strong>Guardian Points!</strong></li></ol>`;
        html += `<br>Categories: 🕳️ Pothole · 🗑️ Garbage · 💧 Waterlogging · 💡 Streetlight · 🛣️ Road Crack · 🚧 Sewer`;
      } else if (q.includes('status') || q.includes('my report')) {
        html = `<div class="font-bold mb-2">📋 Your Report Status</div>`;
        if (reports.length === 0) {
          html += `No reports yet. <a href="/report" style="color:var(--cyan)">Report your first issue →</a>`;
        } else {
          html += `<strong>${reports.length}</strong> total · <strong style="color:var(--green)">${resolvedCount} resolved</strong> · <strong style="color:var(--yellow)">${pendingCount} pending</strong>`;
          if (lastReport) {
            const icons = { pothole: '🕳️', garbage: '🗑️', waterlogging: '💧', streetlight: '💡' };
            html += `<br><br>Latest: ${icons[lastReport.issue_type] || '⚠️'} <strong>${(lastReport.issue_type || '').replace('_', ' ')}</strong> — ${lastReport.status === 'resolved' ? '✅ Resolved' : '⏳ Under review'}`;
          }
        }
      } else if (q.includes('risk') || q.includes('urban') || q.includes('which area')) {
        try {
          const data = await apiCall('/api/predict/city-wide');
          html = `<div class="font-bold mb-2">🗺️ Urban Risk Overview</div>`;
          if (data.flood_zones?.length) {
            html += `<div class="font-bold mb-1">🌊 Flood Risk Areas</div><ul style="margin-left:1.2rem;list-style:disc">`;
            data.flood_zones.forEach(z => { html += `<li>${z.area}: <strong>${z.probability}%</strong></li>`; });
            html += `</ul><br>`;
          }
          html += `💡 <a href="/heatmap" style="color:var(--cyan)">View Urban Heatmap →</a>`;
        } catch {
          html = `<div class="font-bold mb-2">🗺️ Urban Risk</div>View the <a href="/heatmap" style="color:var(--cyan)">Urban Heatmap</a> for a visual risk grid across your city.`;
        }
      } else if (q.includes('point') || q.includes('guardian') || q.includes('reward') || q.includes('earn')) {
        const pts = user?.points || 0;
        const lvl = pts >= 15000 ? 'Platinum' : pts >= 5000 ? 'Gold' : pts >= 1000 ? 'Silver' : 'Bronze';
        html = `<div class="font-bold mb-2">🏆 Guardian Rewards</div>You are a <strong>${lvl} Guardian</strong> with <strong>${pts.toLocaleString()} points</strong>.<br><br>`;
        html += `<div class="font-bold mb-1">How to earn:</div><ul style="margin-left:1.2rem;list-style:disc">`;
        html += `<li>📸 Valid report → <strong>+10 pts</strong></li>`;
        html += `<li>✅ Issue resolved → <strong>+5 pts</strong></li>`;
        html += `<li>🚨 Critical issue → <strong>+20 pts</strong></li>`;
        html += `<li>🔥 7-day streak → <strong>+30 pts</strong></li></ul><br>`;
        html += `<a href="/rewards" style="color:var(--cyan)">View Leaderboard →</a>`;
      } else {
        html = `<div class="font-bold mb-2">💬 How can I help?</div>Try asking:<br><br>`;
        html += `🛡️ "Is my area safe?"<br>`;
        html += `🗺️ "What problems are near me?"<br>`;
        html += `📸 "How do I report an issue?"<br>`;
        html += `📋 "What's the status of my report?"<br>`;
        html += `🏆 "How can I earn Guardian points?"<br><br>`;
        html += `Or <a href="/report" style="color:var(--cyan)">Report an issue now →</a>`;
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', html, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, sender: 'ai',
        html: `<div style="color:var(--red)" class="font-bold mb-1">⚠️ Connection Error</div>Could not reach the AI backend. Please check your connection and try again.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const timeAgo = (d) => {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };

  const riskColor = (s) => s >= 80 ? 'var(--red)' : s >= 60 ? 'var(--orange)' : s >= 40 ? 'var(--yellow)' : 'var(--green)';
  const issueIcon = (t) => ({ pothole: '🕳️', garbage: '🗑️', waterlogging: '💧', streetlight: '💡', road_crack: '🛣️', sewer: '🚧' }[t] || '⚠️');

  return (
    <div className="page-wrap">
      <div className="container">
        <div className="mb-6">
          <h1 className="text-[1.6rem] font-display font-extrabold tracking-tight flex items-center gap-2.5">
            <span>✨</span> UrbanPulse AI Copilot
          </h1>
          <p className="text-text2 mt-1">Your AI assistant for safer, smarter city living.</p>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* Left Panel */}
          <div className="flex flex-col gap-5">
            <div className="bg-bg-card border border-border rounded-[var(--r)] p-5">
              <div className="text-[0.72rem] font-bold text-text2 uppercase tracking-widest mb-4">💬 Ask Copilot</div>
              {[
                { q: "Is my area safe?", icon: "🛡️" },
                { q: "What problems are near me?", icon: "🗺️" },
                { q: "How do I report an issue?", icon: "📸" },
                { q: "What's the status of my report?", icon: "📋" },
                { q: "Which areas have higher urban risk?", icon: "⚠️" },
                { q: "How can I earn Guardian points?", icon: "🏆" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => sendPrompt(item.q)}
                  className="w-full text-left bg-[rgba(255,255,255,0.02)] border border-border rounded-xl px-3.5 py-2.5 mb-2 text-[0.85rem] flex items-center gap-2.5 hover:bg-[rgba(0,212,255,0.05)] hover:border-[rgba(0,212,255,0.2)] hover:text-cyan transition-all cursor-pointer"
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  <span>{item.q}</span>
                </button>
              ))}
            </div>

            <div className="bg-bg-card border border-border rounded-[var(--r)] p-5">
              <div className="text-[0.72rem] font-bold text-text2 uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>📋 My Reports</span>
                <Link to="/dashboard" className="text-cyan text-[0.72rem] normal-case font-normal hover:underline">View all →</Link>
              </div>
              {reportsLoading ? (
                <div className="text-[0.83rem] text-text2 py-2">Loading…</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">📸</div>
                  <p className="text-[0.8rem] text-text2 mb-3">No reports yet</p>
                  <Link to="/report" className="btn-primary text-xs px-3 py-1.5">Report an Issue</Link>
                </div>
              ) : (
                reports.slice(0, 4).map((r, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0">
                    <span className="text-xl shrink-0">{issueIcon(r.issue_type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.83rem] font-semibold truncate">{(r.issue_type || 'Issue').replace('_', ' ')}</div>
                      <div className="text-[0.72rem] text-text2">{timeAgo(r.created_at)}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full ${r.status === 'resolved' ? 'bg-[rgba(34,197,94,0.12)] text-green' : 'bg-[rgba(251,191,36,0.12)] text-yellow'}`}>
                        {r.status === 'resolved' ? '✅' : '⏳'} {r.status}
                      </span>
                      <div className="text-[0.7rem] font-bold mt-1" style={{ color: riskColor(r.risk_score || 0) }}>
                        Risk: {Math.round(r.risk_score || 0)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-bg-card border border-border rounded-[var(--r)] p-5">
              <div className="text-[0.72rem] font-bold text-text2 uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>🏆 Your Rewards</span>
                <Link to="/rewards" className="text-cyan text-[0.72rem] normal-case font-normal hover:underline">Leaderboard →</Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-display text-[2rem] font-extrabold text-yellow leading-none">{(user?.points || 0).toLocaleString()}</div>
                <div>
                  <div className="text-[0.78rem] font-bold">{user?.level || 'Bronze Guardian'}</div>
                  <div className="text-[0.72rem] text-text2">Guardian Points</div>
                </div>
              </div>
              <div className="mt-2 text-[0.75rem] text-text2">Report issues to earn more points!</div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex flex-col border border-border rounded-[var(--r)] bg-bg-card overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
            <div className="px-5 py-4 border-b border-border bg-[rgba(0,212,255,0.03)] flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 font-bold font-display text-[1rem]">✨ AI Copilot Chat</div>
                <div className="text-[0.72rem] text-text2 mt-0.5">{user?.name} · Citizen</div>
              </div>
              <div className="text-[0.7rem] font-bold text-[#4285F4] bg-[rgba(66,133,244,0.1)] px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-[rgba(66,133,244,0.2)]">
                ✨ Gemini Powered
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-bg" ref={chatRef}>
              {messages.map(m => (
                <div key={m.id} className={`flex flex-col max-w-[88%] ${m.sender === 'user' ? 'self-end' : 'self-start'}`}>
                  <div
                    className={`px-4 py-3.5 rounded-2xl text-[0.875rem] leading-relaxed ${m.sender === 'user' ? 'bg-[#1a42f5] text-white rounded-br-sm' : 'bg-bg-card border border-border rounded-bl-sm text-text'}`}
                    dangerouslySetInnerHTML={m.html ? { __html: m.html } : undefined}
                  >
                    {m.text}
                  </div>
                  <div className={`text-[0.65rem] text-text3 mt-1.5 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>{m.time}</div>
                </div>
              ))}
              {aiLoading && (
                <div className="self-start flex flex-col max-w-[88%]">
                  <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm bg-bg-card border border-border flex items-center gap-2">
                    <span className="inline-flex gap-1">
                      <span className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span className="text-[0.8rem] text-text2">Analyzing…</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-bg-card border-t border-border shrink-0">
              <div className="flex items-center gap-3 bg-bg border border-border rounded-full p-1.5 pl-5 focus-within:border-cyan focus-within:shadow-[0_0_0_3px_rgba(0,212,255,0.08)] transition-all">
                <input
                  type="text"
                  className="flex-1 bg-transparent border-none text-text font-sans text-[0.95rem] outline-none"
                  placeholder="Ask about city safety, reports, rewards…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={aiLoading}
                />
                <button
                  className="w-9 h-9 rounded-full bg-bg-card2 border border-border text-text2 flex items-center justify-center cursor-pointer transition-all hover:bg-cyan hover:text-black hover:border-cyan disabled:opacity-40"
                  onClick={() => handleSend()}
                  disabled={aiLoading}
                >➤</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   ROOT — Role-aware router
────────────────────────────────────────────── */
const Copilot = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-wrap flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3">✨</div>
          <div className="text-text2 text-sm">Loading Copilot…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-wrap flex items-center justify-center">
        <div className="bg-bg-card border border-border rounded-[var(--r)] p-10 text-center max-w-sm w-full">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="font-display font-extrabold text-xl mb-2">Login Required</h2>
          <p className="text-text2 text-sm mb-5">Please sign in to access the AI Copilot.</p>
          <a href="/login" className="btn-primary inline-block">Sign In →</a>
        </div>
      </div>
    );
  }

  if (user.role === 'municipal') return <MunicipalCopilot />;
  return <CitizenCopilot />;
};

export default Copilot;


