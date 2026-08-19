import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

const Municipal = () => {
  const { user, apiCall, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [allReports, setAllReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');
  
  const [resolvePhotoFile, setResolvePhotoFile] = useState(null);
  const [resolvePreview, setResolvePreview] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  const miniMapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'municipal') {
      navigate('/login');
      return;
    }
    loadAll();
  }, [user]);

  useEffect(() => {
    if (selectedReport && miniMapRef.current) {
      const lat = selectedReport.location?.coordinates?.[1] || 28.6139;
      const lng = selectedReport.location?.coordinates?.[0] || 77.2090;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (miniMapRef.current._leaflet_id) {
        miniMapRef.current._leaflet_id = null;
      }
      
      const map = L.map(miniMapRef.current, { zoomControl: false }).setView([lat, lng], 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© CARTO' }).addTo(map);
      L.marker([lat, lng]).addTo(map);
      mapInstanceRef.current = map;
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedReport]);

  const loadAll = async () => {
    try {
      const data = await apiCall('/api/reports/?limit=200');
      setAllReports(data || []);
      
      // Update selected report if it exists to refresh its status
      if (selectedReport) {
        const updated = (data || []).find(r => r.id === selectedReport.id);
        if (updated) setSelectedReport(updated);
      }
    } catch (e) {
      console.log('Failed to load reports', e);
    }
  };

  const handleResolvePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResolvePhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setResolvePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const markResolved = async (id) => {
    if (!resolvePhotoFile) {
      alert('Upload a proof photo first');
      return;
    }
    setIsResolving(true);
    try {
      const token = localStorage.getItem('upg_token');
      const fd = new FormData();
      fd.append('resolved_photo', resolvePhotoFile);
      fd.append('status', 'resolved');
      
      const res = await fetch(`https://urbanpulse-guardian-ai.onrender.com/api/reports/${id}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      if (!res.ok) throw new Error('Failed to resolve');
      
      setResolvePhotoFile(null);
      setResolvePreview(null);
      await loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setIsResolving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await apiCall(`/api/reports/${id}/status`, 'PUT', { status });
      await loadAll();
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };

  // Helpers
  const issueEmoji = (type) => ({ pothole: '🕳️', garbage: '🗑️', waterlogging: '💧', streetlight: '💡', road_crack: '🛣️' }[type] || '⚠️');
  const riskColor = (score) => score >= 80 ? 'var(--red)' : score >= 60 ? 'var(--orange)' : score >= 40 ? 'var(--yellow)' : 'var(--green)';
  const statusBadge = (status) => {
    const m = { pending: 'bg-orange text-black', assigned: 'bg-cyan text-black', in_progress: 'bg-purple text-white', resolved: 'bg-green text-black' };
    return <span className={`px-2 py-0.5 rounded-[10px] text-[0.62rem] font-bold uppercase tracking-wider ${m[status] || 'bg-gray-500 text-white'}`}>{status.replace('_', ' ')}</span>;
  };
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  // Derived state
  const pendingCount = allReports.filter(r => r.status === 'pending').length;
  const progressCount = allReports.filter(r => ['assigned', 'in_progress'].includes(r.status)).length;
  const criticalCount = allReports.filter(r => r.risk_score >= 80 && r.status !== 'resolved').length;
  const resolvedCount = allReports.filter(r => r.status === 'resolved').length;

  const top5 = [...allReports].filter(r => r.status !== 'resolved').sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 5);

  const getFilteredList = (tab) => {
    let list = [];
    if (tab === 'pending') list = allReports.filter(r => r.status === 'pending');
    else if (tab === 'inprogress') list = allReports.filter(r => ['assigned', 'in_progress'].includes(r.status));
    else if (tab === 'resolved') list = allReports.filter(r => r.status === 'resolved');
    else if (tab === 'critical') list = allReports.filter(r => r.risk_score >= 80 && r.status !== 'resolved');
    else if (tab === 'priority') list = [...allReports].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));

    if (tab === 'pending') {
      if (filter === 'critical') list = list.filter(r => r.risk_score >= 80);
      else if (filter === 'high') list = list.filter(r => r.risk_score >= 60 && r.risk_score < 80);
      else if (filter !== 'all') list = list.filter(r => r.issue_type === filter);
    }
    return list;
  };

  const renderRow = (r, i) => {
    const isSelected = selectedReport?.id === r.id;
    return (
      <div key={r.id} className={`flex items-center gap-3.5 p-4 rounded-xl border transition-all cursor-pointer mb-2.5 ${isSelected ? 'border-cyan bg-[rgba(0,212,255,0.03)]' : 'bg-bg-card border-border hover:border-[rgba(0,212,255,0.15)] hover:translate-x-0.5'}`} onClick={() => setSelectedReport(r)}>
        <div className="w-7 text-center font-display font-extrabold text-[0.85rem] text-text2">{i + 1}</div>
        <div className="text-2xl shrink-0">{issueEmoji(r.issue_type)}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[0.9rem]">{(r.issue_type || '').replace(/_/g, ' ').toUpperCase()}{r.landmark ? ` — ${r.landmark}` : ''}</div>
          <div className="text-[0.75rem] text-text2 mt-1">{r.location?.address || 'Location recorded'} · {timeAgo(r.created_at)}</div>
          <div className="mt-1.5 flex gap-1.5 items-center">{statusBadge(r.status)}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-[1.4rem] font-extrabold" style={{ color: riskColor(r.risk_score || 0) }}>{Math.round(r.risk_score || 0)}</div>
          <div className="text-[0.65rem] text-text2">risk score</div>
        </div>
      </div>
    );
  };

  const renderDetail = () => {
    if (!selectedReport) return null;
    const r = selectedReport;
    const canResolve = r.status !== 'resolved';

    return (
      <div className="bg-bg-card border border-border rounded-xl p-6 mt-5 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <div className="font-display text-[1.1rem] font-extrabold">{issueEmoji(r.issue_type)} Issue Details — #{r.id?.slice(-6)}</div>
          <button className="bg-transparent border-none text-text2 cursor-pointer text-xl hover:text-text" onClick={() => setSelectedReport(null)}>✕</button>
        </div>

        {r.image_url && <img src={r.image_url.startsWith('http') ? r.image_url : `https://placehold.co/600x220/0d1120/7a8ba6?text=Report+Photo`} className="w-full rounded-lg max-h-[220px] object-cover border border-border mb-4" />}

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="bg-[rgba(255,255,255,0.02)] border border-border rounded-lg p-3">
            <label className="text-[0.7rem] text-text2 uppercase tracking-wider block mb-1">Issue Type</label>
            <span className="text-[0.88rem] font-semibold">{(r.issue_type || '').replace(/_/g, ' ').toUpperCase()}</span>
          </div>
          <div className="bg-[rgba(255,255,255,0.02)] border border-border rounded-lg p-3">
            <label className="text-[0.7rem] text-text2 uppercase tracking-wider block mb-1">Severity</label>
            <span className="text-[0.88rem] font-semibold" style={{ color: riskColor(r.risk_score || 0) }}>{r.risk_score >= 80 ? 'Critical' : r.risk_score >= 60 ? 'High' : r.risk_score >= 40 ? 'Warning' : 'Low'}</span>
          </div>
          <div className="bg-[rgba(255,255,255,0.02)] border border-border rounded-lg p-3">
            <label className="text-[0.7rem] text-text2 uppercase tracking-wider block mb-1">Risk Score</label>
            <span className="font-display text-[1.3rem]" style={{ color: riskColor(r.risk_score || 0) }}>{Math.round(r.risk_score || 0)}/100</span>
          </div>
          <div className="bg-[rgba(255,255,255,0.02)] border border-border rounded-lg p-3">
            <label className="text-[0.7rem] text-text2 uppercase tracking-wider block mb-1">Status</label>
            <span>{statusBadge(r.status)}</span>
          </div>
          <div className="bg-[rgba(255,255,255,0.02)] border border-border rounded-lg p-3">
            <label className="text-[0.7rem] text-text2 uppercase tracking-wider block mb-1">AI Confidence</label>
            <span className="text-[0.88rem] font-semibold">{r.ai_confidence || '—'}%</span>
          </div>
          <div className="bg-[rgba(255,255,255,0.02)] border border-border rounded-lg p-3">
            <label className="text-[0.7rem] text-text2 uppercase tracking-wider block mb-1">Submitted</label>
            <span className="text-[0.88rem] font-semibold">{timeAgo(r.created_at)}</span>
          </div>
        </div>

        {r.description && <div className="bg-[rgba(255,255,255,0.02)] border border-border rounded-lg p-3 mb-4"><label className="text-[0.7rem] text-text2 uppercase tracking-wider block mb-1">Description</label><span className="text-text2">{r.description}</span></div>}
        {r.landmark && <div className="bg-[rgba(255,255,255,0.02)] border border-border rounded-lg p-3 mb-4"><label className="text-[0.7rem] text-text2 uppercase tracking-wider block mb-1">Landmark</label><span>{r.landmark}</span></div>}

        <div className="text-[0.75rem] text-text2 mb-1.5 font-semibold uppercase tracking-wider">Location</div>
        <div ref={miniMapRef} className="h-[160px] rounded-lg overflow-hidden mb-4 border border-border"></div>

        {canResolve ? (
          <>
            <div className="flex items-center gap-4 my-6"><div className="h-px bg-[rgba(255,255,255,0.1)] flex-1"></div><div className="text-[0.72rem] text-text2 uppercase tracking-wider font-semibold">Mark as Resolved</div><div className="h-px bg-[rgba(255,255,255,0.1)] flex-1"></div></div>
            <div className="flex gap-2.5 mb-4 flex-wrap">
              <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(r.id, 'assigned')}>👷 Assign Team</button>
              <button className="btn border border-orange text-orange hover:bg-[rgba(255,107,53,0.1)] btn-sm" onClick={() => updateStatus(r.id, 'in_progress')}>🔧 In Progress</button>
            </div>
            
            <div className="text-[0.82rem] font-semibold mb-2">📸 Upload Resolved Photo (Required to mark resolved)</div>
            {!resolvePreview ? (
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-green hover:bg-[rgba(16,212,142,0.03)] transition-all relative">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleResolvePhoto} />
                <div>📷 Click to upload proof photo</div>
                <div className="text-[0.75rem] text-text2 mt-1.5">Photo confirms the issue has been fixed</div>
              </div>
            ) : (
              <div className="mt-2.5">
                <img src={resolvePreview} className="w-full rounded-lg max-h-[160px] object-cover border border-border mb-4" />
                <button className="btn btn-success w-full" onClick={() => markResolved(r.id)} disabled={isResolving}>
                  {isResolving ? 'Resolving...' : '✅ Mark as Resolved'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-4 bg-[rgba(16,212,142,0.05)] border border-[rgba(16,212,142,0.15)] rounded-lg text-green font-semibold">
            ✅ This issue has been resolved
          </div>
        )}
      </div>
    );
  };

  const navItems = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'pending', icon: '⏳', label: 'Pending Issues', count: pendingCount },
    { id: 'inprogress', icon: '🔧', label: 'In Progress', count: progressCount, countColor: 'bg-yellow text-black' },
    { id: 'resolved', icon: '✅', label: 'Resolved' },
    { id: 'critical', icon: '🚨', label: 'Critical', count: criticalCount },
    { id: 'priority', icon: '📋', label: 'Priority Queue' }
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-var(--nav-h))] mt-[var(--nav-h)]">
      {/* Sidebar */}
      <div className="w-full md:w-[240px] shrink-0 bg-bg-card2 border-r border-border py-6 flex flex-col h-auto md:h-[calc(100vh-var(--nav-h))] md:sticky md:top-[var(--nav-h)] md:overflow-y-auto">
        <div className="px-4 mb-6">
          <div className="text-[0.7rem] text-text2">Logged in as</div>
          <div className="font-bold text-[0.9rem] mt-0.5">{user?.name || 'Municipal Officer'}</div>
          <div className="text-[0.72rem] text-cyan mt-0.5">{user?.city || 'Delhi NCR'}</div>
        </div>
        
        <div className="px-4 flex-1">
          <div className="text-[0.68rem] font-bold text-text3 tracking-wider uppercase mb-2 px-2">Main</div>
          {navItems.slice(0, 5).map(i => (
            <button key={i.id} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-[0.85rem] font-medium mb-0.5 text-left ${activeTab === i.id ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:bg-[rgba(255,255,255,0.04)] hover:text-text'}`} onClick={() => { setActiveTab(i.id); setSelectedReport(null); }}>
              <span>{i.icon}</span> {i.label}
              {i.count !== undefined && <span className={`ml-auto px-2 py-px rounded-[10px] text-[0.68rem] font-bold ${i.countColor || 'bg-red text-white'}`}>{i.count}</span>}
            </button>
          ))}
          
          <div className="text-[0.68rem] font-bold text-text3 tracking-wider uppercase mb-2 mt-6 px-2">Tools</div>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-[0.85rem] font-medium mb-0.5 text-text2 hover:bg-[rgba(255,255,255,0.04)] hover:text-text text-left" onClick={() => navigate('/copilot')}>✨ AI City Copilot</button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-[0.85rem] font-medium mb-0.5 text-text2 hover:bg-[rgba(255,255,255,0.04)] hover:text-text text-left" onClick={() => navigate('/heatmap')}>🗺️ City Heatmap</button>
          <button className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-[0.85rem] font-medium mb-0.5 text-left ${activeTab === 'priority' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:bg-[rgba(255,255,255,0.04)] hover:text-text'}`} onClick={() => { setActiveTab('priority'); setSelectedReport(null); }}>📋 Priority Queue</button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-[0.85rem] font-medium mb-0.5 text-text2 hover:bg-[rgba(255,255,255,0.04)] hover:text-text text-left" onClick={() => navigate('/emergency')}>🚨 Emergency Dispatch</button>
        </div>
        
        <div className="px-4 mt-6">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-[0.85rem] font-medium mb-0.5 text-red hover:bg-[rgba(255,255,255,0.04)] text-left" onClick={() => { logout(); navigate('/login'); }}>🚪 Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-7 overflow-y-auto">
        
        {activeTab === 'overview' && (
          <div>
            <div className="mb-7">
              <h1 className="text-[clamp(1.8rem,3vw,2.6rem)] font-display font-extrabold tracking-tight mb-2">🏛️ Municipal Dashboard</h1>
              <p className="text-text2">Real-time city issue management</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
              <div className="bg-bg-card border border-border rounded-xl p-5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-cyan"><div className="font-display text-[2.2rem] font-extrabold leading-none">{allReports.length}</div><div className="text-[0.75rem] text-text2 mt-1.5">Total Reports</div></div>
              <div className="bg-bg-card border border-border rounded-xl p-5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-red"><div className="font-display text-[2.2rem] font-extrabold leading-none">{criticalCount}</div><div className="text-[0.75rem] text-text2 mt-1.5">Critical Issues</div></div>
              <div className="bg-bg-card border border-border rounded-xl p-5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-yellow"><div className="font-display text-[2.2rem] font-extrabold leading-none">{pendingCount}</div><div className="text-[0.75rem] text-text2 mt-1.5">Pending</div></div>
              <div className="bg-bg-card border border-border rounded-xl p-5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-green"><div className="font-display text-[2.2rem] font-extrabold leading-none">{resolvedCount}</div><div className="text-[0.75rem] text-text2 mt-1.5">Resolved</div></div>
            </div>
            <div className="font-display text-base font-bold mb-4">🤖 AI Priority Queue (Top 5)</div>
            <div>
              {top5.length ? top5.map((r, i) => renderRow(r, i)) : <div className="text-center py-10 text-text2 border border-border border-dashed rounded-xl">✅ All clear! No pending issues.</div>}
            </div>
            {selectedReport && renderDetail()}
          </div>
        )}

        {['pending', 'inprogress', 'resolved', 'critical', 'priority'].includes(activeTab) && (
          <div>
            <div className="mb-7">
              <h1 className="text-[clamp(1.8rem,3vw,2.6rem)] font-display font-extrabold tracking-tight mb-2">
                {activeTab === 'pending' ? '⏳ Pending Issues' : activeTab === 'inprogress' ? '🔧 In Progress' : activeTab === 'resolved' ? '✅ Resolved Issues' : activeTab === 'critical' ? '🚨 Critical Issues' : '📋 AI Priority Queue'}
              </h1>
              <p className="text-text2">
                {activeTab === 'pending' ? 'All reports awaiting action — click any to view details and resolve' : activeTab === 'inprogress' ? 'Issues currently being worked on' : activeTab === 'resolved' ? 'Successfully fixed issues with proof photos' : activeTab === 'critical' ? 'Risk score ≥ 80 — requires immediate action' : 'Sorted by risk score — highest first'}
              </p>
            </div>

            {activeTab === 'pending' && (
              <div className="flex gap-2 mb-5 flex-wrap">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'critical', label: '🔴 Critical' },
                  { id: 'high', label: '🟠 High' },
                  { id: 'pothole', label: '🕳️ Pothole' },
                  { id: 'garbage', label: '🗑️ Garbage' },
                  { id: 'waterlogging', label: '💧 Flood' }
                ].map(f => (
                  <button key={f.id} className={`px-4 py-1.5 rounded-[20px] border text-[0.8rem] font-semibold cursor-pointer transition-all ${filter === f.id ? 'bg-[rgba(0,212,255,0.1)] text-cyan border-[rgba(0,212,255,0.3)]' : 'bg-transparent text-text2 border-border'}`} onClick={() => { setFilter(f.id); setSelectedReport(null); }}>{f.label}</button>
                ))}
              </div>
            )}

            <div>
              {getFilteredList(activeTab).length ? getFilteredList(activeTab).map((r, i) => renderRow(r, i)) : <div className="text-center py-10 text-text2 border border-border border-dashed rounded-xl">✅ Nothing here</div>}
            </div>
            
            {selectedReport && renderDetail()}
          </div>
        )}

      </div>
    </div>
  );
};

export default Municipal;
