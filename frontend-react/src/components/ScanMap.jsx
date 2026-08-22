import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ScanMap = ({ gpsTrack, detections, onDetectionClick }) => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    if (!mapInstance && mapRef.current && !mapRef.current._leaflet_id) {
      // Default to Delhi if no GPS track
      let startLat = 28.6139;
      let startLng = 77.2090;
      
      if (gpsTrack && gpsTrack.length > 0) {
        startLat = gpsTrack[0].lat;
        startLng = gpsTrack[0].lng;
      }

      const map = L.map(mapRef.current).setView([startLat, startLng], 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO',
        maxZoom: 19
      }).addTo(map);

      setMapInstance(map);

      return () => {
        map.remove();
        setMapInstance(null);
      };
    }
  }, []);

  useEffect(() => {
    if (mapInstance && gpsTrack && gpsTrack.length > 0) {
      // Clear previous layers (simplified for prototype)
      mapInstance.eachLayer((layer) => {
        if (!!layer.toGeoJSON) mapInstance.removeLayer(layer);
      });

      // Draw GPS track
      const latlngs = gpsTrack.map(pt => [pt.lat, pt.lng]);
      const polyline = L.polyline(latlngs, { color: '#00d4ff', weight: 4 }).addTo(mapInstance);
      mapInstance.fitBounds(polyline.getBounds());

      // Add Start Marker
      L.circleMarker(latlngs[0], { radius: 6, color: '#10d48e', fillColor: '#10d48e', fillOpacity: 1 }).addTo(mapInstance).bindPopup("Start");
      
      // Add End Marker
      L.circleMarker(latlngs[latlngs.length - 1], { radius: 6, color: '#ff3d5a', fillColor: '#ff3d5a', fillOpacity: 1 }).addTo(mapInstance).bindPopup("End");

      // Draw Detections
      detections.forEach(det => {
        if (!det.gps) return;
        
        let color = '#fbbf24'; // default yellow
        let emoji = '⚠️';
        if (det.issueType.toLowerCase().includes('pothole')) { color = '#ff6b35'; emoji = '🕳️'; }
        if (det.issueType.toLowerCase().includes('garbage')) { color = '#fbbf24'; emoji = '🗑️'; }
        
        const iconHtml = `<div style="width:32px;height:32px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 10px ${color}44;cursor:pointer;">${emoji}</div>`;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [32,32], iconAnchor: [16,16] });
        
        const m = L.marker([det.gps.lat, det.gps.lng], { icon }).addTo(mapInstance);
        
        // Add click handler to marker
        m.on('click', () => {
          if (onDetectionClick) onDetectionClick(det);
        });
      });
    }
  }, [mapInstance, gpsTrack, detections, onDetectionClick]);

  return (
    <div id="scan-map" ref={mapRef} className="w-full h-[400px] bg-bg rounded-xl overflow-hidden border border-border"></div>
  );
};

export default ScanMap;
