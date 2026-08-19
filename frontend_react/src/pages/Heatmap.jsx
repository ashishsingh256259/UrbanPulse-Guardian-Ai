import { useState, useEffect } from 'react';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map } from 'lucide-react';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customMarker = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function Heatmap() {
  const [reports, setReports] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Delhi Coordinates as center
  const center = [28.6139, 77.2090];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, predictRes] = await Promise.all([
        api.get('/api/reports?limit=200'),
        api.get('/api/predict/city-wide')
      ]);
      setReports(reportsRes.data);
      setPredictions(predictRes.data);
    } catch (error) {
      console.error('Error fetching heatmap data', error);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (score) => {
    if (score >= 80) return 'red';
    if (score >= 50) return 'gold';
    return 'green';
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="text-primary" /> Live Urban Risk Heatmap
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time view of civic issues and AI risk predictions</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> High Risk</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded-full"></div> Medium Risk</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Low Risk</div>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-slate-700 relative z-0">
        {loading ? (
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10">
            <span className="text-primary font-medium animate-pulse">Loading Live Map Data...</span>
          </div>
        ) : (
          <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {/* Render Reports */}
            {reports.map((report) => (
              <Marker 
                key={report.id} 
                position={[report.location.coordinates[1], report.location.coordinates[0]]}
                icon={customMarker(getMarkerColor(report.risk_score))}
              >
                <Popup className="custom-popup">
                  <div className="p-1">
                    <h3 className="font-bold text-sm capitalize mb-1 text-slate-900">{report.issue_type.replace('_', ' ')}</h3>
                    <div className="text-xs text-slate-600 mb-2">Reported by: {report.user_name}</div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-semibold text-slate-700">Risk: {report.risk_score}/100</span>
                      <span className="capitalize font-semibold">{report.status.replace('_', ' ')}</span>
                    </div>
                    {report.image_url && (
                      <img src={`http://localhost:8002${report.image_url}`} alt="issue" className="w-full h-24 object-cover rounded mt-2" />
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Render AI Predictions Zones */}
            {predictions?.flood_zones?.map((zone, idx) => {
              // Mock coordinates for demo zones
              const zoneCoords = zone.area === "Yamuna Basin" ? [28.62, 77.25] : [28.68, 77.30];
              return (
                <Circle 
                  key={`flood-${idx}`} 
                  center={zoneCoords} 
                  radius={zone.probability * 30} 
                  pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
                >
                  <Popup>
                    <div className="text-slate-900">
                      <strong>AI Flood Prediction</strong><br/>
                      Area: {zone.area}<br/>
                      Probability: {zone.probability}%
                    </div>
                  </Popup>
                </Circle>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
