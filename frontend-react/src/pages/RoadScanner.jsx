import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoadScannerCamera from '../components/RoadScannerCamera';
import ScanMap from '../components/ScanMap';

const RoadScanner = () => {
  const { user } = useAuth();
  
  const [scanState, setScanState] = useState('ready'); // ready, recording, processing, analyzing, results
  const [videoBlob, setVideoBlob] = useState(null);
  const [gpsTrack, setGpsTrack] = useState([]);
  const [extractedFrames, setExtractedFrames] = useState([]);
  const [rawDetections, setRawDetections] = useState([]);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const { apiCall } = useAuth();

  const handleScanComplete = (blob, track) => {
    setVideoBlob(blob);
    setGpsTrack(track);
    setScanState('processing');
  };

  useEffect(() => {
    if (scanState === 'processing' && videoBlob) {
      extractFrames(videoBlob, gpsTrack);
    } else if (scanState === 'analyzing' && extractedFrames.length > 0) {
      analyzeFrames(extractedFrames);
    }
  }, [scanState, videoBlob, gpsTrack, extractedFrames]);

  const analyzeFrames = async (frames) => {
    const results = [];
    setErrorMsg(''); // clear previous errors
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      setAnalyzeProgress(Math.round(((i + 1) / frames.length) * 100));
      
      try {
        const formData = new FormData();
        formData.append('photo', frame.blob, `frame_${i}.jpg`);
        
        // Use existing authentication hook but with fetch to support formData easily
        const token = localStorage.getItem('token');
        const res = await fetch('/api/reports/analyze-scanner-frame', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.issueDetected) {
            results.push({
              ...data,
              time: frame.time,
              gps: frame.gps,
              blob: frame.blob // Keep evidence frame
            });
          }
        } else if (res.status === 429) {
           setErrorMsg('Rate limit exceeded. Please wait a minute before scanning again.');
           break; // Stop analyzing frames if rate limited
        }
      } catch (err) {
        console.error('Error analyzing frame:', err);
      }
      
      // Delay to respect rate limits
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Phase 8: Duplicate Merging
    const mergedResults = [];
    results.forEach(newDet => {
      if (!newDet.gps) {
        mergedResults.push(newDet); // Can't merge without GPS
        return;
      }
      
      const existingIdx = mergedResults.findIndex(ex => {
        if (ex.issueType !== newDet.issueType || !ex.gps) return false;
        
        // Haversine distance in meters
        const R = 6371e3;
        const lat1 = ex.gps.lat * Math.PI/180;
        const lat2 = newDet.gps.lat * Math.PI/180;
        const dLat = (newDet.gps.lat - ex.gps.lat) * Math.PI/180;
        const dLon = (newDet.gps.lng - ex.gps.lng) * Math.PI/180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance < 20; // 20 meters threshold
      });
      
      if (existingIdx >= 0) {
        // Merge: keep the one with higher confidence
        if (newDet.confidence > mergedResults[existingIdx].confidence) {
          mergedResults[existingIdx] = newDet;
        }
      } else {
        mergedResults.push(newDet);
      }
    });
    
    setRawDetections(mergedResults);
    setScanState('results');
  };

  const findClosestGps = (timeMs, track) => {
    if (!track || track.length === 0) return null;
    return track.reduce((prev, curr) => 
      Math.abs(curr.time - timeMs) < Math.abs(prev.time - timeMs) ? curr : prev
    );
  };

  const extractFrames = async (blob, track) => {
    try {
      const url = URL.createObjectURL(blob);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve();
      });

      const duration = video.duration;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      const frames = [];
      const interval = 2.0; // Extract every 2 seconds
      
      for (let t = 0; t < duration; t += interval) {
        video.currentTime = t;
        await new Promise((resolve) => {
          video.onseeked = () => resolve();
        });
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
        
        const timeMs = t * 1000;
        const closestGps = findClosestGps(timeMs, track);
        
        frames.push({
          time: t,
          blob: frameBlob,
          gps: closestGps
        });
      }
      
      URL.revokeObjectURL(url);
      setExtractedFrames(frames);
      setScanState('analyzing'); // Move to next phase
      console.log(`Extracted ${frames.length} frames.`);
    } catch (err) {
      handleError('Failed to extract frames: ' + err.message);
      setScanState('ready');
    }
  };

  const handleError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  return (
    <div className="min-h-[calc(100vh-var(--nav-h))] mt-[var(--nav-h)] p-6 md:p-12 relative">
      {/* Toast Error Message */}
      {errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-fade-in">
          <span>⚠️</span>
          <span className="font-bold text-sm">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-white hover:text-[rgba(255,255,255,0.7)]">✕</button>
        </div>
      )}

      <div className="max-w-xl mx-auto text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">AI Road Scanner <span className="text-xs bg-cyan text-bg px-2 py-1 rounded-full uppercase tracking-wider align-middle ml-2">Prototype</span></h1>
        <p className="text-text2">Mount your phone on your dashboard to automatically detect and report road issues.</p>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[400px]">
        {scanState === 'ready' ? (
          <RoadScannerCamera 
            onScanComplete={handleScanComplete}
            onError={handleError}
          />
        ) : scanState === 'processing' ? (
          <div className="card p-8 text-center border-dashed border-2 border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.2)] w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Processing Scan...</h2>
            <p className="text-sm text-text2 mb-6">Extracting frames and syncing GPS data.</p>
            <div className="w-8 h-8 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : scanState === 'analyzing' ? (
          <div className="card p-8 text-center border-dashed border-2 border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.2)] w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Analyzing Frames...</h2>
            <p className="text-sm text-text2 mb-6">Sending {extractedFrames.length} frames to Gemini AI.</p>
            <div className="w-full bg-[rgba(255,255,255,0.1)] rounded-full h-3 mb-2 overflow-hidden">
              <div className="bg-cyan h-3 rounded-full transition-all duration-300" style={{ width: `${analyzeProgress}%` }}></div>
            </div>
            <p className="text-xs text-cyan font-bold">{analyzeProgress}% Complete</p>
          </div>
        ) : scanState === 'results' ? (
          <div className="text-left w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Scan Complete</h2>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Map Column */}
              <div className="flex-1">
                <ScanMap 
                  gpsTrack={gpsTrack} 
                  detections={rawDetections}
                  onDetectionClick={(det) => console.log('Clicked', det)}
                />
              </div>
              
              {/* List Column */}
              <div className="w-full md:w-1/3 flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
                <h3 className="font-bold text-lg">Detected Issues ({rawDetections.length})</h3>
                {rawDetections.length === 0 ? (
                  <p className="text-text2">No issues detected on this route.</p>
                ) : (
                  rawDetections.map((det, idx) => (
                    <div key={idx} className="card p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-[0.9rem]">{det.issueType}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${det.confidence > 80 ? 'bg-[rgba(16,212,142,0.2)] text-green' : 'bg-[rgba(251,191,36,0.2)] text-yellow'}`}>{det.confidence}%</span>
                      </div>
                      <p className="text-xs text-text2 mb-3 line-clamp-2">{det.description}</p>
                      <button 
                        className="btn-primary w-full py-2 text-xs rounded-lg"
                        onClick={async (e) => {
                          e.target.disabled = true;
                          e.target.innerText = 'Submitting...';
                          try {
                            const formData = new FormData();
                            formData.append('photo', det.blob, 'scanner_evidence.jpg');
                            formData.append('lat', det.gps.lat);
                            formData.append('lng', det.gps.lng);
                            formData.append('issue_type', det.issueType);
                            formData.append('description', 'Reported via AI Road Scanner: ' + det.description);
                            formData.append('source', 'road_scanner');
                            
                            const token = localStorage.getItem('token');
                            const res = await fetch('/api/reports', {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}` },
                              body: formData
                            });
                            
                            if (res.ok) {
                              e.target.innerText = 'Submitted!';
                              e.target.classList.replace('btn-primary', 'bg-[rgba(16,212,142,0.2)]');
                              e.target.classList.add('text-green');
                            } else {
                              throw new Error('Failed to submit');
                            }
                          } catch (err) {
                            e.target.disabled = false;
                            e.target.innerText = 'Create Report';
                            handleError('Error submitting report.');
                          }
                        }}
                      >
                        Create Report
                      </button>
                    </div>
                  ))
                )}
                <button className="btn-secondary w-full py-3 mt-4" onClick={() => {
                  setScanState('ready');
                  setRawDetections([]);
                  setGpsTrack([]);
                  setExtractedFrames([]);
                  setVideoBlob(null);
                }}>
                  Start New Scan
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RoadScanner;
