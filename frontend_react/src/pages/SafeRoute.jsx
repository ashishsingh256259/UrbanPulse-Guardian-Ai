import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, ShieldCheck } from 'lucide-react';

const customMarker = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function SafeRoute() {
  const [source, setSource] = useState('Connaught Place, Delhi');
  const [destination, setDestination] = useState('India Gate, Delhi');
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRoute = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate routing API delay
    setTimeout(() => {
      setRouteData({
        points: [
          [28.6315, 77.2167], // CP
          [28.6250, 77.2200],
          [28.6180, 77.2250],
          [28.6129, 77.2295]  // India Gate
        ],
        distance: "2.4 km",
        time: "8 mins",
        hazardsAvoided: 3,
        safetyScore: 92
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-96 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-success" /> AI Safe Route
          </h1>
          <p className="text-sm text-slate-400 mt-1">Plan your journey avoiding potholes, waterlogging, and high-risk areas.</p>
        </div>

        <div className="card">
          <form onSubmit={handleRoute} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Starting Point</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  className="input-field pl-10" 
                  value={source} 
                  onChange={(e) => setSource(e.target.value)} 
                  required 
                />
              </div>
            </div>
            
            <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-slate-700 p-1 rounded-full border-4 border-card">
                <Navigation size={16} className="text-slate-300" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
                <input 
                  type="text" 
                  className="input-field pl-10" 
                  value={destination} 
                  onChange={(e) => setDestination(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full py-3 mt-4 btn-primary ${loading ? 'opacity-70' : ''}`}>
              {loading ? 'Calculating Safe Route...' : 'Find Safe Route'}
            </button>
          </form>
        </div>

        {routeData && (
          <div className="card bg-gradient-to-br from-success/10 to-card border-success/30">
            <h3 className="font-bold text-success flex items-center gap-2 mb-4">
              <ShieldCheck size={20} /> Safest Route Found
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Est. Time</p>
                <p className="font-bold text-lg">{routeData.time}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Distance</p>
                <p className="font-bold text-lg">{routeData.distance}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Hazards Avoided</p>
                <p className="font-bold text-lg text-primary">{routeData.hazardsAvoided}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Safety Score</p>
                <p className="font-bold text-lg text-success">{routeData.safetyScore}/100</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 rounded-xl border border-slate-700 overflow-hidden relative z-0 min-h-[400px]">
        <MapContainer center={[28.6139, 77.2090]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {routeData && (
            <>
              <Polyline positions={routeData.points} color="#10b981" weight={5} opacity={0.8} />
              <Marker position={routeData.points[0]} icon={customMarker('blue')}>
                <Popup><span className="text-slate-900 font-bold">Start: {source}</span></Popup>
              </Marker>
              <Marker position={routeData.points[routeData.points.length - 1]} icon={customMarker('green')}>
                <Popup><span className="text-slate-900 font-bold">End: {destination}</span></Popup>
              </Marker>
            </>
          )}

          {/* Render some mock hazard markers that were avoided */}
          {routeData && (
            <>
              <Marker position={[28.6200, 77.2180]} icon={customMarker('red')}>
                <Popup><span className="text-slate-900 font-bold">Avoided: Pothole (High Risk)</span></Popup>
              </Marker>
              <Marker position={[28.6150, 77.2280]} icon={customMarker('orange')}>
                <Popup><span className="text-slate-900 font-bold">Avoided: Waterlogging</span></Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
