import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const Heatmap = () => {
  const { apiCall } = useAuth();
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [activeTab, setActiveTab] = useState('issues');
  
  // Layer states
  const [layers, setLayers] = useState({
    pothole: true,
    garbage: true,
    flood: true,
    streetlight: true,
    env: false
  });
  
  const [layerGroups, setLayerGroups] = useState({
    pothole: [], garbage: [], flood: [], streetlight: [], envLayers: []
  });

  const [recentReports, setRecentReports] = useState([]);
  
  const [envData, setEnvData] = useState({
    score:38, aqi:'156 — Poor', noise:'72 dB — High', heat:'41°C — Danger', flood:'23% — Low', uv:'8 — High', color:'var(--red)', badge:'🔴 Poor', alert:'red', alertMsg:'Sector 12 AQI critical — avoid outdoor activity today. Wear N95 mask if going out.', area:'central'
  });

  const ENV_DATA = {
    central: { score:38, aqi:'156 — Poor', noise:'72 dB — High', heat:'41°C — Danger', flood:'23% — Low', uv:'8 — High', color:'var(--red)', badge:'🔴 Poor', alert:'red', alertMsg:'AQI critical in Central Delhi — avoid outdoor activity. Wear N95 mask.' },
    north:   { score:52, aqi:'118 — Moderate', noise:'65 dB — Moderate', heat:'38°C — High', flood:'45% — Medium', uv:'7 — High', color:'var(--orange)', badge:'🟠 Moderate', alert:'yellow', alertMsg:'Moderate AQI in North Delhi. Sensitive groups should limit outdoor exposure.' },
    south:   { score:71, aqi:'82 — Satisfactory', noise:'58 dB — Moderate', heat:'36°C — Moderate', flood:'12% — Low', uv:'6 — Moderate', color:'var(--yellow)', badge:'🟡 Fair', alert:'yellow', alertMsg:'South Delhi air quality is satisfactory. Heat index elevated — stay hydrated.' },
    east:    { score:44, aqi:'142 — Poor', noise:'68 dB — High', heat:'40°C — High', flood:'62% — High', uv:'7 — High', color:'var(--orange)', badge:'🟠 Poor', alert:'red', alertMsg:'East Delhi: High flood risk + Poor AQI. Avoid low-lying areas.' },
  };

  const typeColors = { pothole:'#ff6b35', garbage:'#fbbf24', waterlogging:'#00d4ff', streetlight:'#8b5cf6', road_crack:'#ff6b35', other:'#7a8ba6' };

  useEffect(() => {
    if (!mapInstance && mapRef.current && !mapRef.current._leaflet_id) {
      const map = L.map(mapRef.current, { zoomControl: false }).setView([28.6139, 77.2090], 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© CARTO', maxZoom: 19 }).addTo(map);
      L.control.zoom({ position: 'topleft' }).addTo(map);
      
      // Static Flood zones
      L.circle([28.5850, 77.3150], { radius: 1200, color: '#00d4ff', fillColor: '#00d4ff', fillOpacity: 0.08, weight: 1 }).addTo(map).bindPopup('💧 Flood Risk Zone — 82%');
      L.circle([28.6700, 77.3000], { radius: 800, color: '#00d4ff', fillColor: '#00d4ff', fillOpacity: 0.06, weight: 1 }).addTo(map);
      
      setMapInstance(map);
      
      return () => {
        map.remove();
        setMapInstance(null);
      };
    }
  }, []);

  useEffect(() => {
    if (mapInstance) {
      loadMapReports();
    }
  }, [mapInstance]);

  const loadMapReports = async () => {
    try {
      const reports = await apiCall('/api/reports/?limit=100').catch(() => []);
      if (!reports || reports.length === 0) return;
      
      const newGroups = { pothole: [], garbage: [], flood: [], streetlight: [], envLayers: [] };
      
      reports.forEach(r => {
        const lat = r.location?.coordinates?.[1];
        const lng = r.location?.coordinates?.[0];
        if (!lat || !lng) return;
        
        const color = typeColors[r.issue_type] || '#7a8ba6';
        const rc = r.risk_score >= 80 ? 'var(--red)' : r.risk_score >= 60 ? 'var(--orange)' : r.risk_score >= 40 ? 'var(--yellow)' : 'var(--green)';
        const issueEmoji = r.issue_type === 'pothole' ? '🕳️' : r.issue_type === 'garbage' ? '🗑️' : r.issue_type === 'waterlogging' ? '💧' : r.issue_type === 'streetlight' ? '💡' : r.issue_type === 'road_crack' ? '🛣️' : '⚠️';
        
        const iconHtml = `<div style="width:32px;height:32px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 10px ${color}44;position:relative;">${issueEmoji}<div style="position:absolute;top:-3px;right:-3px;width:11px;height:11px;border-radius:50%;background:${rc};border:2px solid #07090f;"></div></div>`;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [32,32], iconAnchor: [16,16] });
        
        const m = L.marker([lat, lng], { icon });
        const popupContent = `<div style="padding:4px;min-width:170px;"><div style="font-weight:700;font-size:0.9rem;margin-bottom:6px;">${issueEmoji} ${(r.issue_type||'').replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</div><div style="font-size:0.75rem;color:#7a8ba6;">${r.location?.address||'—'}</div><div style="display:flex;justify-content:space-between;font-size:0.75rem;padding:3px 0;border-top:1px solid rgba(255,255,255,0.05);margin-top:6px;"><span>Risk</span><strong style="color:${rc}">${Math.round(r.risk_score||0)}/100</strong></div><div style="display:flex;justify-content:space-between;font-size:0.75rem;padding:2px 0;"><span>Status</span><strong>${r.status}</strong></div></div>`;
        m.bindPopup(popupContent);
        m.addTo(mapInstance);
        
        const ltype = r.issue_type === 'waterlogging' ? 'flood' : r.issue_type === 'road_crack' ? 'pothole' : (r.issue_type || 'other');
        if (newGroups[ltype]) newGroups[ltype].push(m);
      });
      
      setLayerGroups(prev => ({ ...prev, ...newGroups }));
      setRecentReports(reports.slice(0, 6));
    } catch (e) {
      console.log('Map error', e);
    }
  };

  const toggleLayer = (type) => {
    const isNowOff = layers[type];
    setLayers({ ...layers, [type]: !isNowOff });
    
    if (layerGroups[type]) {
      layerGroups[type].forEach(m => {
        if (isNowOff) mapInstance.removeLayer(m);
        else m.addTo(mapInstance);
      });
    }
  };

  const loadEnvData = (area) => {
    setEnvData({ ...ENV_DATA[area], area });
    
    // Draw zones
    layerGroups.envLayers.forEach(l => mapInstance.removeLayer(l));
    const newEnvLayers = [];
    
    const zones = {
      central: [[28.6315,77.2167],0.06,'#ff3d5a'],
      north:   [[28.7041,77.1025],0.05,'#ff6b35'],
      south:   [[28.5244,77.1855],0.05,'#fbbf24'],
      east:    [[28.6500,77.3000],0.05,'#ff6b35'],
    };
    
    if (layers.env) {
      const [center, radius, color] = zones[area] || zones.central;
      const c = L.circle(center, { radius: radius*111000, color, fillColor: color, fillOpacity: 0.08, weight: 2, dashArray: '6,4' }).addTo(mapInstance);
      newEnvLayers.push(c);
      mapInstance.setView(center, 13);
    }
    setLayerGroups({ ...layerGroups, envLayers: newEnvLayers });
  };

  const toggleEnvLayer = () => {
    const isNowOff = layers.env;
    setLayers({ ...layers, env: !isNowOff });
    
    layerGroups.envLayers.forEach(l => mapInstance.removeLayer(l));
    let newEnvLayers = [];
    
    if (!isNowOff) {
      const areas = [
        { lat:28.6315, lng:77.2167, color:'#ff3d5a', score:38, label:'Central Delhi' },
        { lat:28.7041, lng:77.1025, color:'#ff6b35', score:52, label:'North Delhi' },
        { lat:28.5244, lng:77.1855, color:'#fbbf24', score:71, label:'South Delhi' },
        { lat:28.6500, lng:77.3000, color:'#ff6b35', score:44, label:'East Delhi' },
      ];
      areas.forEach(a => {
        const c = L.circle([a.lat, a.lng], { radius: 3500, color: a.color, fillColor: a.color, fillOpacity: 0.1, weight: 2 })
          .bindPopup(`<b>${a.label}</b><br>Env Health: <b style="color:${a.color}">${a.score}/100</b>`)
          .addTo(mapInstance);
        newEnvLayers.push(c);
      });
    }
    setLayerGroups({ ...layerGroups, envLayers: newEnvLayers });
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-var(--nav-h))] mt-[var(--nav-h)] overflow-hidden">
      <div id="map" ref={mapRef} className="flex-1 bg-bg min-h-[50vh] md:min-h-full"></div>
      <div className="w-full md:w-[330px] shrink-0 bg-bg-card2 border-l border-border overflow-y-auto flex flex-col">
        
        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          <button className={`flex-1 py-3 px-2 text-center text-[0.75rem] font-bold cursor-pointer transition-all border-b-2 ${activeTab === 'issues' ? 'text-cyan border-cyan' : 'text-text2 border-transparent'}`} onClick={() => setActiveTab('issues')}>🗺️ Issues</button>
          <button className={`flex-1 py-3 px-2 text-center text-[0.75rem] font-bold cursor-pointer transition-all border-b-2 ${activeTab === 'env' ? 'text-cyan border-cyan' : 'text-text2 border-transparent'}`} onClick={() => setActiveTab('env')}>🌿 Env Health</button>
          <button className={`flex-1 py-3 px-2 text-center text-[0.75rem] font-bold cursor-pointer transition-all border-b-2 ${activeTab === 'flood' ? 'text-cyan border-cyan' : 'text-text2 border-transparent'}`} onClick={() => setActiveTab('flood')}>🌊 Flood</button>
        </div>

        {/* Tab 1: Issues */}
        {activeTab === 'issues' && (
          <div className="p-[18px] flex flex-col gap-3.5">
            <div className="font-display text-[0.9rem] font-bold">Map Layers</div>
            <div>
              {[
                { id: 'pothole', color: '#ff6b35', icon: '🕳️', label: 'Road Damage' },
                { id: 'garbage', color: '#fbbf24', icon: '🗑️', label: 'Garbage' },
                { id: 'flood', color: '#00d4ff', icon: '💧', label: 'Waterlogging' },
                { id: 'streetlight', color: '#8b5cf6', icon: '💡', label: 'Streetlight' },
              ].map(l => (
                <div key={l.id} className="flex items-center justify-between p-2.5 rounded-[10px] bg-[rgba(255,255,255,0.02)] border border-border cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-all mb-1.5" onClick={() => toggleLayer(l.id)}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }}></div>
                    <span className="text-[0.82rem] font-medium">{l.icon} {l.label}</span>
                  </div>
                  <div className={`w-[34px] h-[18px] rounded-full relative transition-colors ${layers[l.id] ? 'bg-cyan' : 'bg-[rgba(255,255,255,0.1)]'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] left-[2px] transition-transform ${layers[l.id] ? 'translate-x-4' : ''}`}></div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[rgba(255,255,255,0.02)] border border-border cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-all" onClick={toggleEnvLayer}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10d48e' }}></div>
                  <span className="text-[0.82rem] font-medium">🌿 Env Health</span>
                </div>
                <div className={`w-[34px] h-[18px] rounded-full relative transition-colors ${layers.env ? 'bg-cyan' : 'bg-[rgba(255,255,255,0.1)]'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] left-[2px] transition-transform ${layers.env ? 'translate-x-4' : ''}`}></div>
                </div>
              </div>
            </div>

            <div>
              <div className="font-display text-[0.88rem] font-bold mb-2.5">Legend</div>
              <div className="flex gap-2.5 flex-wrap">
                {['green', 'yellow', 'orange', 'red'].map((c, i) => (
                  <div key={i} className="flex items-center gap-1 text-[0.72rem]">
                    <div className="w-2 h-2 rounded-full" style={{ background: `var(--${c})` }}></div>
                    {c === 'green' ? 'Safe' : c === 'yellow' ? 'Warning' : c === 'orange' ? 'High' : 'Critical'}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-display text-[0.88rem] font-bold mb-2.5">Recent Reports</div>
              <div className="flex flex-col gap-1.5">
                {recentReports.map((r, i) => {
                  const lat = r.location?.coordinates?.[1] || 28.6139;
                  const lng = r.location?.coordinates?.[0] || 77.2090;
                  const rc = r.risk_score >= 80 ? 'var(--red)' : r.risk_score >= 60 ? 'var(--orange)' : r.risk_score >= 40 ? 'var(--yellow)' : 'var(--green)';
                  const rl = r.risk_score >= 80 ? 'Critical' : r.risk_score >= 60 ? 'High' : r.risk_score >= 40 ? 'Warning' : 'Safe';
                  const emoji = r.issue_type === 'pothole' ? '🕳️' : r.issue_type === 'garbage' ? '🗑️' : r.issue_type === 'waterlogging' ? '💧' : r.issue_type === 'streetlight' ? '💡' : r.issue_type === 'road_crack' ? '🛣️' : '⚠️';
                  return (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-border cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-all" onClick={() => mapInstance?.setView([lat, lng], 15)}>
                      <span className="text-[1.1rem]">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.8rem] font-semibold">{(r.issue_type||'').replace(/_/g,' ').toUpperCase()} — <span style={{color: rc}}>{rl}</span></div>
                        <div className="text-[0.68rem] text-text2">{timeAgo(r.created_at)}</div>
                      </div>
                      <div className="text-[0.8rem] font-bold" style={{color: rc}}>{Math.round(r.risk_score||0)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Env Health */}
        {activeTab === 'env' && (
          <div className="p-[18px] flex flex-col gap-3.5">
            <div>
              <div className="text-[0.72rem] text-text2 mb-2 font-semibold uppercase tracking-wider">Select Area</div>
              <div className="flex gap-1.5 flex-wrap">
                {['central', 'north', 'south', 'east'].map(a => (
                  <button key={a} className={`px-3 py-1.5 rounded-[20px] border text-[0.75rem] font-semibold cursor-pointer transition-all ${envData.area === a ? 'bg-[rgba(139,92,246,0.1)] border-purple text-purple' : 'bg-transparent border-border text-text2'}`} onClick={() => loadEnvData(a)}>
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[rgba(139,92,246,0.08)] to-[rgba(0,212,255,0.05)] border border-[rgba(139,92,246,0.2)] rounded-xl p-4">
              <div className="text-[0.72rem] text-text2 font-bold uppercase tracking-wider mb-2">🌿 Environmental Health Score</div>
              <div className="flex items-end gap-2 mb-1">
                <div className="font-display text-5xl font-extrabold leading-none" style={{color: envData.color}}>{envData.score}</div>
                <div className="text-[0.82rem] text-text2 mb-2">/100</div>
                <div className="mb-2"><span className={`badge ${envData.alert === 'red' ? 'badge-critical' : 'badge-pending'}`}>{envData.badge}</span></div>
              </div>
              <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden mt-8">
                <div className="h-full bg-orange transition-all duration-500" style={{width: `${envData.score}%`, backgroundColor: envData.color}}></div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] text-[0.82rem]">
                <span>💨 Air Quality (AQI)</span><span className="font-bold" style={{color: envData.color}}>{envData.aqi}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] text-[0.82rem]">
                <span>🔊 Noise Level</span><span className="font-bold text-orange">{envData.noise}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] text-[0.82rem]">
                <span>🌡️ Heat Index</span><span className="font-bold text-red">{envData.heat}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] text-[0.82rem]">
                <span>💧 Flood Risk</span><span className="font-bold text-green">{envData.flood}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-[0.82rem]">
                <span>☀️ UV Index</span><span className="font-bold text-yellow">{envData.uv}</span>
              </div>
            </div>

            <div className={`rounded-lg p-3 text-[0.8rem] flex gap-2 items-start border ${envData.alert === 'red' ? 'bg-[rgba(255,61,90,0.08)] border-[rgba(255,61,90,0.2)] text-red' : 'bg-[rgba(251,191,36,0.08)] border-[rgba(251,191,36,0.2)] text-yellow'}`}>
              <span>{envData.alert === 'red' ? '🚨' : '⚠️'}</span>
              <span>{envData.alertMsg}</span>
            </div>
            
            <div className="font-display text-[0.85rem] font-bold mt-2">SDG Impact</div>
            <div className="flex gap-2 flex-wrap">
              <div className="bg-[rgba(16,212,142,0.08)] border border-[rgba(16,212,142,0.15)] rounded-lg px-2.5 py-2 text-[0.72rem] font-semibold text-green">🌍 SDG 13 Climate Action</div>
              <div className="bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] rounded-lg px-2.5 py-2 text-[0.72rem] font-semibold text-cyan">🏙️ SDG 11 Sustainable Cities</div>
              <div className="bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.15)] rounded-lg px-2.5 py-2 text-[0.72rem] font-semibold text-purple">❤️ SDG 3 Good Health</div>
            </div>
          </div>
        )}

        {/* Tab 3: Flood */}
        {activeTab === 'flood' && (
          <div className="p-[18px] flex flex-col gap-3.5">
            <div className="bg-[rgba(255,61,90,0.05)] border border-[rgba(255,61,90,0.15)] rounded-xl p-4">
              <div className="text-[0.72rem] font-bold text-red tracking-wider uppercase mb-2">⚠️ 48-Hour Flood Prediction</div>
              <div className="font-display text-[2.5rem] font-extrabold text-red leading-none">82%</div>
              <div className="text-[0.75rem] text-text2 mt-1">Flood probability — Yamuna Basin</div>
              <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden mt-6">
                <div className="h-full bg-orange transition-all duration-500" style={{width: '82%'}}></div>
              </div>
            </div>

            <div className="card p-4">
              <div className="font-display text-[0.85rem] font-bold mb-2.5">Flood Risk Zones</div>
              <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] text-[0.82rem]">
                <span>🔴 Yamuna Basin</span><span className="font-bold text-red">82% — Critical</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] text-[0.82rem]">
                <span>🟠 Shahdara Drain</span><span className="font-bold text-orange">65% — High</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] text-[0.82rem]">
                <span>🟡 ITO Junction</span><span className="font-bold text-yellow">48% — Medium</span>
              </div>
              <div className="flex items-center justify-between py-2 text-[0.82rem]">
                <span>🟢 South Delhi</span><span className="font-bold text-green">18% — Low</span>
              </div>
            </div>

            <div className="rounded-lg p-3 text-[0.8rem] flex gap-2 items-start border bg-[rgba(255,61,90,0.08)] border-[rgba(255,61,90,0.2)] text-red">
              <span>🚨</span><span>Authority alerted. Sandbags being pre-positioned at Sector 21 drain.</span>
            </div>
            <div className="rounded-lg p-3 text-[0.8rem] flex gap-2 items-start border bg-[rgba(251,191,36,0.08)] border-[rgba(251,191,36,0.2)] text-yellow">
              <span>⚠️</span><span>Monsoon forecast: 180mm rainfall expected in 48hrs — above average.</span>
            </div>
            
            <div className="font-display text-[0.82rem] font-bold mt-2">Flood + Env Connection</div>
            <div className="rounded-lg p-3 text-[0.8rem] flex gap-2 items-start border bg-[rgba(16,212,142,0.08)] border-[rgba(16,212,142,0.2)] text-green">
              <span>🔗</span><span>Flood zone roads auto-removed from Safe Route recommendations.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Heatmap;
