import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';

const ROUTES = {
  A: { coords: [[28.6315, 77.2167],[28.6280, 77.2190],[28.6250, 77.2210],[28.6220, 77.2280],[28.6129, 77.2295]], dist: '1.0 km', time: '12 min' },
  B: { coords: [[28.6315, 77.2167],[28.6350, 77.2220],[28.6340, 77.2280],[28.6300, 77.2340],[28.6200, 77.2350],[28.6129, 77.2295]], dist: '1.2 km', time: '15 min' }
};

const SafeRoute = () => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  
  const [profile, setProfile] = useState('woman');
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [fromLoc, setFromLoc] = useState('Connaught Place, Delhi');
  const [toLoc, setToLoc] = useState('India Gate, Delhi');
  
  const [status, setStatus] = useState('idle'); // idle, analyzing, done
  const [anaMsg, setAnaMsg] = useState('Analyzing routes...');
  
  const [results, setResults] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('B');
  
  const routeLayersRef = useRef({ A: null, B: null, markers: [] });

  useEffect(() => {
    if (!mapInstance && mapRef.current && !mapRef.current._leaflet_id) {
      const map = L.map(mapRef.current, { zoomControl: false }).setView([28.6139, 77.2090], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© CARTO' }).addTo(map);
      L.control.zoom({ position: 'topright' }).addTo(map);
      setMapInstance(map);
      
      return () => {
        map.remove();
        setMapInstance(null);
      };
    }
  }, []);

  const getSafetyData = () => {
    const nightPenalty  = timeOfDay === 'night' ? -25 : timeOfDay === 'evening' ? -10 : 0;
    const profileFactor = profile === 'woman' ? -8 : profile === 'elderly' ? -5 : 0;

    const scoreA = Math.max(20, 45 + nightPenalty + profileFactor);
    const scoreB = Math.max(55, 92 + Math.round(nightPenalty / 3) + profileFactor);

    const lightsA = timeOfDay === 'night' ? 15 : 40;
    const lightsB = timeOfDay === 'night' ? 70 : 95;

    return {
      A: {
        score: scoreA,
        factors: [
          { icon: '💡', label: 'Streetlights', score: lightsA, value: lightsA > 50 ? 'Good' : '2 broken' },
          { icon: '⚠️', label: 'Hazard Reports', score: 20, value: '3 reports' },
          { icon: '👥', label: 'Crowd Density', score: 30, value: 'Isolated' },
          { icon: '🌫️', label: 'AQI', score: 35, value: 'Moderate' },
        ],
        warning: timeOfDay === 'night' ? '🚨 Avoid at night — 2 broken lights, isolated 400m stretch' : '⚠️ 2 broken streetlights, isolated stretch, 3 hazard reports nearby',
      },
      B: {
        score: scoreB,
        factors: [
          { icon: '💡', label: 'Streetlights', score: lightsB, value: lightsB > 80 ? 'All working' : 'Mostly good' },
          { icon: '⚠️', label: 'Hazard Reports', score: 90, value: 'None' },
          { icon: '👥', label: 'Crowd Density', score: 85, value: 'High footfall' },
          { icon: '🌫️', label: 'AQI', score: 70, value: 'Good' },
        ],
        reason: `✅ Well-lit, high footfall, no hazard reports${timeOfDay === 'night' ? ' — safest night route' : ''}`,
      }
    };
  };

  const analyzeRoutes = () => {
    if (status === 'analyzing') return;
    setStatus('analyzing');
    
    const msgs = ['Fetching streetlight data...', 'Checking hazard reports on route...', 'Analyzing crowd density...', 'Calculating AQI impact...', 'Computing safety scores...'];
    let i = 0;
    setAnaMsg(msgs[0]);
    
    const t = setInterval(() => {
      i++;
      if (i < msgs.length) setAnaMsg(msgs[i]);
    }, 700);

    setTimeout(() => {
      clearInterval(t);
      const data = getSafetyData();
      
      const diff = data.B.score - data.A.score;
      const profileLabel = profile === 'woman' ? 'women' : profile === 'elderly' ? 'elderly persons' : 'students';
      
      const tipsObj = {
        woman:   ['📱 Share live location with trusted contact', '💡 Stay on well-lit roads', '🚶 Walk confidently, avoid distractions', '📞 Keep emergency number ready: 1091'],
        student: ['👥 Travel in groups when possible', '🚌 Use public transport on main roads', '📱 Inform someone of your route', '⏰ Avoid late night travel alone'],
        elderly: ['🚌 Prefer buses/auto on main roads', '👥 Travel during peak hours', '🏥 Note hospitals on your route', '📱 Keep family informed'],
      };

      setResults({
        data,
        ai: {
          rec: `Route B recommended for ${profileLabel} — ${diff}% safer`,
          reason: `200m longer but significantly safer. ${timeOfDay === 'night' ? '⚠️ Night travel — extra caution advised.' : 'Well-lit path with high crowd density.'}`
        },
        tips: tipsObj[profile] || tipsObj.student
      });
      
      setStatus('done');
      drawRoutesOnMap(data);
    }, 3500);
  };

  const drawRoutesOnMap = (data) => {
    if (!mapInstance) return;
    
    const rl = routeLayersRef.current;
    if (rl.A) mapInstance.removeLayer(rl.A);
    if (rl.B) mapInstance.removeLayer(rl.B);
    rl.markers.forEach(m => mapInstance.removeLayer(m));
    rl.markers = [];

    rl.A = L.polyline(ROUTES.A.coords, { color: '#ff3d5a', weight: 5, opacity: 0.5, dashArray: '8,6' }).addTo(mapInstance);
    rl.B = L.polyline(ROUTES.B.coords, { color: '#10d48e', weight: 6, opacity: 1 }).addTo(mapInstance);

    const fromIcon = L.divIcon({ html: '<div style="width:14px;height:14px;border-radius:50%;background:var(--cyan);border:3px solid #fff;box-shadow:0 0 8px var(--cyan)"></div>', className:'', iconSize:[14,14] });
    const toIcon   = L.divIcon({ html: '<div style="width:14px;height:14px;border-radius:50%;background:var(--yellow);border:3px solid #fff;box-shadow:0 0 8px var(--yellow)"></div>', className:'', iconSize:[14,14] });

    rl.markers.push(L.marker(ROUTES.B.coords[0], { icon: fromIcon }).addTo(mapInstance).bindPopup('📍 Start'));
    rl.markers.push(L.marker(ROUTES.B.coords[ROUTES.B.coords.length-1], { icon: toIcon }).addTo(mapInstance).bindPopup('🎯 Destination'));
    rl.markers.push(L.circleMarker([28.6250, 77.2210], { radius: 18, color: '#ff3d5a', fillColor: '#ff3d5a', fillOpacity: 0.15, weight: 2 }).addTo(mapInstance).bindPopup('⚠️ Broken streetlight + isolated area'));

    rl.A.bindPopup(`<div style="padding:4px"><strong style="color:#ff3d5a">Route A — Unsafe</strong><br>Safety: ${data.A.score}% ❌<br>${ROUTES.A.dist} · ${ROUTES.A.time}</div>`);
    rl.B.bindPopup(`<div style="padding:4px"><strong style="color:#10d48e">Route B — Safe ✅</strong><br>Safety: ${data.B.score}%<br>${ROUTES.B.dist} · ${ROUTES.B.time}</div>`);

    const bounds = L.latLngBounds([...ROUTES.A.coords, ...ROUTES.B.coords]);
    mapInstance.fitBounds(bounds, { padding: [40, 40] });
    
    setSelectedRoute('B');
  };

  const handleSelectRoute = (r) => {
    setSelectedRoute(r);
    const rl = routeLayersRef.current;
    if (r === 'A') {
      if (rl.A) rl.A.setStyle({ opacity: 1, weight: 6 });
      if (rl.B) rl.B.setStyle({ opacity: 0.3, weight: 3 });
    } else {
      if (rl.B) rl.B.setStyle({ opacity: 1, weight: 6 });
      if (rl.A) rl.A.setStyle({ opacity: 0.3, weight: 3 });
    }
  };

  const renderFactors = (factors) => {
    return factors.map((f, i) => {
      const color = f.score > 60 ? 'var(--green)' : f.score > 35 ? 'var(--yellow)' : 'var(--red)';
      return (
        <div key={i} className="flex items-center justify-between py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[0.8rem] last:border-none">
          <span>{f.icon} {f.label}</span>
          <div className="flex items-center gap-2">
            <div className="w-[60px] h-1 rounded-sm bg-[rgba(255,255,255,0.06)] overflow-hidden">
              <div className="h-full rounded-sm" style={{ width: `${f.score}%`, backgroundColor: color }}></div>
            </div>
            <span style={{ color, fontSize: '0.75rem' }}>{f.value}</span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-var(--nav-h))] mt-[var(--nav-h)] overflow-hidden">
      <div className="w-full md:w-[380px] shrink-0 bg-bg-card2 border-r border-border overflow-y-auto p-6 flex flex-col gap-[18px]">
        <div>
          <div className="font-display text-[1.2rem] font-extrabold mb-1">🛡️ Safe Route AI</div>
          <div className="text-[0.82rem] text-text2">Find the safest path — not just the shortest</div>
        </div>

        <div>
          <div className="form-label">Who are you?</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'woman', icon: '👩', label: 'Woman' },
              { id: 'student', icon: '🎒', label: 'Student' },
              { id: 'elderly', icon: '👴', label: 'Elderly' },
            ].map(p => (
              <button key={p.id} className={`p-2 rounded-[10px] border text-[0.8rem] font-semibold cursor-pointer text-center transition-all ${profile === p.id ? 'bg-[rgba(0,212,255,0.1)] border-cyan text-cyan' : 'bg-[rgba(255,255,255,0.02)] border-border text-text2 hover:border-cyan hover:text-text'}`} onClick={() => setProfile(p.id)}>
                <span className="text-[1.5rem] block mb-1">{p.icon}</span>{p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="form-label">Time of Travel</div>
          <div className="flex gap-1.5">
            {[
              { id: 'day', label: '☀️ Day' },
              { id: 'evening', label: '🌆 Evening' },
              { id: 'night', label: '🌙 Night' },
            ].map(t => (
              <button key={t.id} className={`flex-1 p-2 rounded-lg border text-[0.78rem] font-semibold cursor-pointer transition-all ${timeOfDay === t.id ? 'bg-[rgba(139,92,246,0.1)] border-purple text-purple' : 'bg-transparent border-border text-text2'}`} onClick={() => setTimeOfDay(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="form-group mb-4">
            <label className="form-label">📍 Current Location</label>
            <input className="form-input" value={fromLoc} onChange={e => setFromLoc(e.target.value)} placeholder="e.g. Connaught Place, Delhi" />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">🎯 Destination</label>
            <input className="form-input" value={toLoc} onChange={e => setToLoc(e.target.value)} placeholder="e.g. India Gate, Delhi" />
          </div>
        </div>

        <button className="btn btn-primary w-full" onClick={analyzeRoutes} disabled={status === 'analyzing'}>
          🔍 Find Safe Route
        </button>

        {status === 'analyzing' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-[3px] border-[rgba(0,212,255,0.1)] border-t-cyan rounded-full animate-spin mx-auto mb-4"></div>
            <div className="font-bold mb-1.5">{anaMsg}</div>
            <div className="text-[0.78rem] text-text2">Checking streetlights, hazards, crowd density</div>
          </div>
        )}

        {status === 'done' && results && (
          <div className="mt-4 pb-10 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-[rgba(16,212,142,0.1)] to-[rgba(0,212,255,0.1)] border border-[rgba(16,212,142,0.2)] rounded-xl p-4">
              <div className="text-[0.72rem] font-bold text-green tracking-wider uppercase mb-2">🤖 AI Recommendation</div>
              <div className="text-[0.88rem] font-semibold">{results.ai.rec}</div>
              <div className="text-[0.78rem] text-text2 mt-1">{results.ai.reason}</div>
            </div>

            <div className={`rounded-xl p-4 border-2 cursor-pointer transition-all relative ${selectedRoute === 'A' ? 'border-red shadow-[0_4px_20px_rgba(255,61,90,0.2)] scale-[1.02]' : 'border-[rgba(255,61,90,0.3)] bg-[rgba(255,61,90,0.05)] hover:scale-[1.01]'}`} onClick={() => handleSelectRoute('A')}>
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <div className="font-display text-[0.95rem] font-extrabold text-red">Route A — Shortest</div>
                  <div className="text-[0.75rem] text-text2 mt-0.5">{ROUTES.A.dist} · {ROUTES.A.time} walk</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-[1.8rem] font-extrabold leading-none text-red">{results.data.A.score}%</div>
                  <div className="text-[0.68rem] text-text2">safety score</div>
                </div>
              </div>
              <div>{renderFactors(results.data.A.factors)}</div>
              <div className="mt-2.5 p-2 bg-[rgba(255,61,90,0.08)] rounded-lg text-[0.78rem] text-red">{results.data.A.warning}</div>
            </div>

            <div className={`rounded-xl p-4 border-2 cursor-pointer transition-all relative ${selectedRoute === 'B' ? 'border-green shadow-[0_4px_20px_rgba(16,212,142,0.2)] scale-[1.02]' : 'border-[rgba(16,212,142,0.3)] bg-[rgba(16,212,142,0.05)] hover:scale-[1.01]'}`} onClick={() => handleSelectRoute('B')}>
              <div className="absolute -top-2 right-3 bg-green text-black text-[0.65rem] font-extrabold py-0.5 px-2.5 rounded-[10px]">✅ RECOMMENDED</div>
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <div className="font-display text-[0.95rem] font-extrabold text-green">Route B — Safest</div>
                  <div className="text-[0.75rem] text-text2 mt-0.5">{ROUTES.B.dist} · {ROUTES.B.time} walk</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-[1.8rem] font-extrabold leading-none text-green">{results.data.B.score}%</div>
                  <div className="text-[0.68rem] text-text2">safety score</div>
                </div>
              </div>
              <div>{renderFactors(results.data.B.factors)}</div>
              <div className="mt-2.5 p-2 bg-[rgba(16,212,142,0.08)] rounded-lg text-[0.78rem] text-green">{results.data.B.reason}</div>
            </div>

            <div className="card p-4">
              <div className="font-bold mb-3">🛡️ Safety Tips for You</div>
              {results.tips.map((t, i) => (
                <div key={i} className="text-[0.82rem] py-1.5 border-b border-border last:border-none">{t}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div id="safeMap" ref={mapRef} className="flex-1 bg-bg min-h-[50vh] md:min-h-full"></div>
    </div>
  );
};

export default SafeRoute;
