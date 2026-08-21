import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Shield, User, GraduationCap, Users, Sun, Sunset, Moon, MapPin, Flag, Navigation, AlertTriangle, Info, CheckCircle, Check } from 'lucide-react';

// ── Haversine distance between two [lat, lng] points in meters ──────────────
function haversine([lat1, lng1], [lat2, lng2]) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Find hazards within radius metres of a polyline ─────────────────────────
function hazardsNearRoute(routeCoords, hazards, radius = 150) {
  return hazards.filter((h) => {
    const hLatLng = [h.lat, h.lng];
    return routeCoords.some((pt) => haversine(pt, hLatLng) < radius);
  });
}

// ── Build a risk score (0–100) from nearby hazards ──────────────────────────
const ISSUE_RISK = {
  pothole: 15, road_crack: 12, waterlogging: 18,
  streetlight: 20, garbage: 8, sewer: 16, other: 10,
};
function calcRouteRisk(nearbyHazards) {
  if (!nearbyHazards.length) return 8;
  const raw = nearbyHazards.reduce((sum, h) => sum + (ISSUE_RISK[h.issue_type] || 10), 0);
  return Math.min(Math.round(raw * 1.5), 95);
}

// ── Geocode a place name → { lat, lng } via Nominatim ───────────────────────
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data.length) throw new Error(`Location not found: "${query}"`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// ── Fetch walking routes from OSRM ──────────────────────────────────────────
async function fetchRoutes(from, to) {
  const url = `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${to.lng},${to.lat}?alternatives=true&geometries=geojson&overview=full&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Routing service error: ${res.status}`);
  const data = await res.json();
  if (!data.routes || !data.routes.length) throw new Error('No routes returned by the routing service.');
  return data.routes;
}

// ── Route metadata (label, colour) per rank after risk-sort ─────────────────
const ROUTE_META = [
  { label: 'Route 1', tag: 'LOWEST RISK', colour: '#10d48e' },
  { label: 'Route 2', tag: 'BALANCED',    colour: '#f59e0b' },
  { label: 'Route 3', tag: 'FASTEST',     colour: '#ff3d5a' },
];

const SafeRoute = () => {
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const layersRef = useRef([]);

  const [profile,   setProfile]   = useState('woman');
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [fromLoc,   setFromLoc]   = useState('Connaught Place, Delhi');
  const [toLoc,     setToLoc]     = useState('India Gate, Delhi');

  const [status,  setStatus]  = useState('idle');
  const [anaMsg,  setAnaMsg]  = useState('');
  const [error,   setError]   = useState('');
  const [routes,  setRoutes]  = useState([]);
  const [selected, setSelected] = useState(0);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInst.current && mapRef.current && !mapRef.current._leaflet_id) {
      const map = L.map(mapRef.current, { zoomControl: false }).setView([28.6139, 77.2090], 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO',
      }).addTo(map);
      L.control.zoom({ position: 'topright' }).addTo(map);
      mapInst.current = map;
    }
    return () => {
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    };
  }, []);

  const clearLayers = () => {
    layersRef.current.forEach((l) => { if (mapInst.current) mapInst.current.removeLayer(l); });
    layersRef.current = [];
  };

  // ── Fetch UrbanPulse hazard reports ───────────────────────────────────────
  const fetchHazards = async () => {
    try {
      const res = await fetch('https://urbanpulse-guardian-ai.onrender.com/api/reports?limit=200');
      if (!res.ok) return [];
      const data = await res.json();
      return data
        .filter((r) => r.location?.coordinates?.length === 2)
        .map((r) => ({
          lat: r.location.coordinates[1], lng: r.location.coordinates[0],
          issue_type: r.issue_type, severity: r.severity, risk_score: r.risk_score,
        }));
    } catch { return []; }
  };

  // ── Analyze routes ────────────────────────────────────────────────────────
  const analyzeRoutes = async () => {
    if (status === 'analyzing') return;
    setStatus('analyzing'); setError(''); setRoutes([]); clearLayers();

    const msgs = ['Geocoding locations...', 'Fetching route alternatives...', 'Loading hazard data...', 'Calculating risk scores...', 'Rendering map...'];
    let mi = 0; setAnaMsg(msgs[0]);
    const ticker = setInterval(() => { mi = Math.min(mi + 1, msgs.length - 1); setAnaMsg(msgs[mi]); }, 900);

    try {
      const [from, to] = await Promise.all([geocode(fromLoc), geocode(toLoc)]);
      const rawRoutes  = await fetchRoutes(from, to);
      const hazards    = await fetchHazards();

      const enriched = rawRoutes.slice(0, 3).map((r) => {
        const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const nearby = hazardsNearRoute(coords, hazards);
        return {
          coords,
          distKm:      (r.distance / 1000).toFixed(2),
          etaMin:      Math.round(r.duration / 60),
          distLabel:   `${(r.distance / 1000).toFixed(2)} km`,
          etaLabel:    `${Math.round(r.duration / 60)} min`,
          risk:        calcRouteRisk(nearby),
          nearby,
          hazardCount: nearby.length,
        };
      });

      // Sort lowest-risk first, re-assign meta
      enriched.sort((a, b) => a.risk - b.risk);
      enriched.forEach((r, i) => { r.meta = ROUTE_META[i]; });

      setRoutes(enriched);
      setSelected(0);
      setStatus('done');
      drawRoutes(enriched, from, to);
    } catch (e) {
      setError(e.message || 'Routing failed. Check your location names and try again.');
      setStatus('error');
    } finally {
      clearInterval(ticker);
    }
  };

  const drawRoutes = (enriched, from, to) => {
    if (!mapInst.current) return;
    clearLayers();
    const allCoords = [];

    enriched.forEach((route, idx) => {
      const poly = L.polyline(route.coords, {
        color: route.meta.colour, weight: idx === 0 ? 7 : 4,
        opacity: idx === 0 ? 1 : 0.35, dashArray: idx === 0 ? null : '10,7',
      }).addTo(mapInst.current).bindPopup(
        `<div style="padding:4px"><strong style="color:${route.meta.colour}">${route.meta.label} — ${route.meta.tag}</strong><br>` +
        `${route.distLabel} Â· ${route.etaLabel}<br>Risk: ${route.risk}/100 Â· ${route.hazardCount} hazard(s)</div>`
      );
      layersRef.current.push(poly);
      allCoords.push(...route.coords);
    });

    const mkIcon = (bg, glow) => L.divIcon({
      html: `<div style="width:14px;height:14px;border-radius:50%;background:${bg};border:3px solid #fff;box-shadow:0 0 8px ${glow}"></div>`,
      className: '', iconSize: [14, 14],
    });
    layersRef.current.push(
      L.marker([from.lat, from.lng], { icon: mkIcon('var(--cyan)',   'var(--cyan)'  ) }).addTo(mapInst.current).bindPopup('📍 Start'),
      L.marker([to.lat,   to.lng  ], { icon: mkIcon('var(--yellow)', 'var(--yellow)') }).addTo(mapInst.current).bindPopup('<div style="display:flex;align-items:center;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> Destination</div>')
    );

    // De-duplicate & plot hazard circles
    const allNearby = [...new Map(
      enriched.flatMap((r) => r.nearby).map((h) => [`${h.lat},${h.lng}`, h])
    ).values()];
    allNearby.slice(0, 40).forEach((h) => {
      layersRef.current.push(
        L.circleMarker([h.lat, h.lng], { radius: 8, color: '#ff3d5a', fillColor: '#ff3d5a', fillOpacity: 0.2, weight: 2 })
          .addTo(mapInst.current).bindPopup(`⚠️ ${(h.issue_type || 'hazard').replace('_', ' ')}`)
      );
    });

    if (allCoords.length) mapInst.current.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
  };

  const handleSelectRoute = (idx) => {
    setSelected(idx);
    layersRef.current.forEach((layer, li) => {
      if (li < routes.length && layer.setStyle) {
        layer.setStyle({ opacity: li === idx ? 1 : 0.25, weight: li === idx ? 7 : 3 });
        if (li === idx) layer.bringToFront();
      }
    });
  };

  const nightPenalty   = timeOfDay === 'night' ? 15 : timeOfDay === 'evening' ? 7 : 0;
  const profilePenalty = profile === 'woman' ? 8 : profile === 'elderly' ? 5 : 0;
  const adjRisk = (r) => Math.min(r + nightPenalty + profilePenalty, 99);
  const riskMeta = (r) => {
    if (r >= 80) return { label: 'Critical',    col: 'var(--red)'    };
    if (r >= 55) return { label: 'Moderate',    col: 'var(--orange)' };
    if (r >= 30) return { label: 'Lower risk',  col: 'var(--yellow)' };
    return             { label: 'Low risk',     col: 'var(--green)'  };
  };
  const tips = { woman: ['📍± Share live location with trusted contact', '💡 Stay on well-lit roads', '🚶 Walk confidently', '📍ž Emergency: 1091'], student: ['ðŸ‘¥ Travel in groups', 'ðŸšŒ Use public transport', '📍± Inform someone of route', 'â° Avoid late night travel alone'], elderly: ['ðŸšŒ Prefer main roads', 'ðŸ‘¥ Travel during peak hours', 'ðŸ¥ Note hospitals en-route', '📍± Keep family informed'] };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-var(--nav-h))] mt-[var(--nav-h)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-[400px] shrink-0 bg-bg-card2 border-r border-border overflow-y-auto p-6 flex flex-col gap-[18px]">
        <div>
          <div className="font-display text-[1.2rem] font-extrabold mb-1">ðŸ›¡ï¸ Safe Route AI</div>
          <div className="text-[0.82rem] text-text2">Real route alternatives with UrbanPulse hazard overlay</div>
        </div>

        <div>
          <div className="form-label">Who are you?</div>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'woman', icon: <User className="mx-auto mb-1 w-6 h-6"/>, label: 'Woman' }, { id: 'student', icon: <GraduationCap className="mx-auto mb-1 w-6 h-6"/>, label: 'Student' }, { id: 'elderly', icon: <Users className="mx-auto mb-1 w-6 h-6"/>, label: 'Elderly' }].map((p) => (
              <button key={p.id}
                className={`p-2 rounded-[10px] border text-[0.8rem] font-semibold cursor-pointer text-center transition-all flex flex-col items-center justify-center ${profile === p.id ? 'bg-[rgba(0,212,255,0.1)] border-cyan text-cyan' : 'bg-[rgba(255,255,255,0.02)] border-border text-text2 hover:border-cyan hover:text-text'}`}
                onClick={() => setProfile(p.id)}>
                {p.icon}{p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="form-label">Time of Travel</div>
          <div className="flex gap-1.5">
            {[{ id: 'day', label: 'Day', icon: <Sun className="w-4 h-4 mr-1.5"/> }, { id: 'evening', label: 'Evening', icon: <Sunset className="w-4 h-4 mr-1.5"/> }, { id: 'night', label: 'Night', icon: <Moon className="w-4 h-4 mr-1.5"/> }].map((t) => (
              <button key={t.id}
                className={`flex-1 p-2 rounded-lg border text-[0.78rem] font-semibold cursor-pointer transition-all flex items-center justify-center ${timeOfDay === t.id ? 'bg-[rgba(139,92,246,0.1)] border-purple text-purple' : 'bg-transparent border-border text-text2'}`}
                onClick={() => setTimeOfDay(t.id)}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="form-group mb-4">
            <label className="form-label">📍 Current Location</label>
            <input className="form-input" value={fromLoc} onChange={(e) => setFromLoc(e.target.value)} placeholder="e.g. Connaught Place, Delhi" />
          </div>
          <div className="form-group mb-0">
            <label className="form-label flex items-center gap-1.5"><Flag className="w-4 h-4"/> Destination</label>
            <input className="form-input" value={toLoc} onChange={(e) => setToLoc(e.target.value)} placeholder="e.g. India Gate, Delhi" />
          </div>
        </div>

        <button className="btn btn-primary w-full" onClick={analyzeRoutes} disabled={status === 'analyzing'}>
          📍 Find Safe Route
        </button>

        {status === 'analyzing' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-[3px] border-[rgba(0,212,255,0.1)] border-t-cyan rounded-full animate-spin mx-auto mb-4" />
            <div className="font-bold mb-1.5">{anaMsg}</div>
            <div className="text-[0.78rem] text-text2">Fetching real routes &amp; hazard data</div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-[rgba(255,61,90,0.08)] border border-[rgba(255,61,90,0.2)] rounded-xl p-4 text-[0.85rem] text-red">
            ⚠️ {error}
          </div>
        )}

        {status === 'done' && routes.length > 0 && (
          <div className="flex flex-col gap-5 pb-10">
            {routes.length === 1 && (
              <div className="bg-[rgba(255,255,255,0.04)] border border-border rounded-xl p-3 text-[0.8rem] text-text2">
                â„¹ï¸ Only one route was returned by the routing service.
              </div>
            )}

            {routes.map((route, idx) => {
              const ar = adjRisk(route.risk);
              const rm = riskMeta(ar);
              const isSelected = selected === idx;
              const c = route.meta.colour;
              return (
                <div key={idx}
                  className={`rounded-xl p-4 cursor-pointer transition-all relative ${isSelected ? 'scale-[1.02] border-2' : 'border hover:scale-[1.01]'}`}
                  style={{ borderColor: isSelected ? c : `${c}55`, backgroundColor: `${c}0d`, boxShadow: isSelected ? `0 4px 20px ${c}33` : 'none' }}
                  onClick={() => handleSelectRoute(idx)}>
                  {idx === 0 && (
                    <div className="absolute -top-2 right-3 bg-green text-black text-[0.62rem] font-extrabold py-0.5 px-2.5 rounded-[10px] flex items-center gap-1"><CheckCircle className="w-3 h-3"/> RECOMMENDED</div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-display text-[0.95rem] font-extrabold" style={{ color: c }}>{route.meta.label} — {route.meta.tag}</div>
                      <div className="text-[0.75rem] text-text2 mt-0.5">{route.distLabel} Â· {route.etaLabel} walk</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-[1.6rem] font-extrabold leading-none" style={{ color: rm.col }}>{ar}</div>
                      <div className="text-[0.65rem] text-text2">risk / 100</div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-[0.72rem] text-text2 mb-1">
                      <span>Risk Level</span><span style={{ color: rm.col }}>{rm.label}</span>
                    </div>
                    <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${ar}%`, backgroundColor: rm.col }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[0.75rem]">
                    <div className="bg-[rgba(255,255,255,0.04)] rounded-lg py-1.5"><div className="text-text2">Distance</div><div className="font-bold">{route.distLabel}</div></div>
                    <div className="bg-[rgba(255,255,255,0.04)] rounded-lg py-1.5"><div className="text-text2">ETA</div><div className="font-bold">{route.etaLabel}</div></div>
                    <div className="bg-[rgba(255,255,255,0.04)] rounded-lg py-1.5"><div className="text-text2">Hazards</div><div className="font-bold" style={{ color: route.hazardCount > 0 ? 'var(--orange)' : 'var(--green)' }}>{route.hazardCount}</div></div>
                  </div>
                  {route.hazardCount > 0 ? (
                    <div className="mt-2.5 p-2 rounded-lg text-[0.75rem]" style={{ backgroundColor: `${c}14`, color: c }}>
                      ⚠️ {route.hazardCount} reported hazard{route.hazardCount > 1 ? 's' : ''} within 150 m — lower reported risk than other options
                    </div>
                  ) : (
                    <div className="mt-2.5 p-2 bg-[rgba(16,212,142,0.08)] rounded-lg text-[0.75rem] text-green">
                      âœ… No UrbanPulse hazard reports near this route
                    </div>
                  )}
                </div>
              );
            })}

            <div className="text-[0.72rem] text-text3 border border-border rounded-xl p-3">
              â“˜ Risk scores are based on UrbanPulse reported incidents within 150 m of each route.
              Absence of reports does not guarantee safety. Exercise personal judgement.
              {nightPenalty > 0 && ` Night/evening penalty of +${nightPenalty} applied.`}
            </div>

            <div className="card p-4">
              <div className="font-bold mb-3 flex items-center gap-1.5"><Shield className="w-4 h-4 text-cyan"/> Safety Tips for You</div>
              {(tips[profile] || tips.student).map((t, i) => (
                <div key={i} className="text-[0.82rem] py-1.5 border-b border-border last:border-none flex items-start gap-2"><Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan"/> {t}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div id="safeMap" ref={mapRef} className="flex-1 bg-bg min-h-[50vh] md:min-h-full" />
    </div>
  );
};

export default SafeRoute;
