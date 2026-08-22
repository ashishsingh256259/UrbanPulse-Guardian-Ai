import React, { useRef, useState, useEffect, useCallback } from 'react';

const RoadScannerCamera = ({ onScanComplete, onError }) => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const watchIdRef = useRef(null);
  const chunksRef = useRef([]);
  const gpsTrackRef = useRef([]);
  
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Ask for permissions and set up preview
  const requestPermissions = async () => {
    try {
      // 1. Camera
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false // No audio needed
      });
      
      setStream(videoStream);
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
      }

      // 2. Location (just check if available, actual tracking starts on 'record')
      if (!('geolocation' in navigator)) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Prompt for location permission
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      });

      setHasPermissions(true);
    } catch (err) {
      console.error('Permission error:', err);
      onError(err.message || 'Camera or Location permission denied.');
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [stream]);

  // Timer for UI
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = useCallback(() => {
    if (!stream) return;
    
    chunksRef.current = [];
    gpsTrackRef.current = [];
    setTimeElapsed(0);

    const startTime = Date.now();

    // Start GPS tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        // Calculate relative timestamp in ms
        const relativeTime = Date.now() - startTime;
        
        gpsTrackRef.current.push({
          time: relativeTime,
          lat: latitude,
          lng: longitude,
          accuracy
        });
      },
      (err) => console.error('GPS watch error:', err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    // Start Video Recording
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      // clear watch
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      onScanComplete(blob, gpsTrackRef.current);
    };

    mediaRecorder.start(1000); // collect chunks every second
    setIsRecording(true);
  }, [stream, onScanComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  if (!hasPermissions) {
    return (
      <div className="card p-8 text-center border-dashed border-2 border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.2)]">
        <div className="text-4xl mb-4">📷</div>
        <h2 className="text-xl font-bold mb-2">Camera Access Required</h2>
        <p className="text-sm text-text2 mb-6">
          We need access to your camera and location to record the road and tag infrastructure issues.
        </p>
        <button onClick={requestPermissions} className="btn-primary px-6 py-3 rounded-xl font-bold">
          Enable Camera & Location
        </button>
      </div>
    );
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto relative rounded-xl overflow-hidden bg-black aspect-[3/4]">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="w-full h-full object-cover"
      />
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${isRecording ? 'bg-[rgba(255,61,90,0.2)] text-red border border-[rgba(255,61,90,0.4)]' : 'bg-[rgba(255,255,255,0.1)] text-white backdrop-blur-md'}`}>
          {isRecording && <div className="w-2 h-2 rounded-full bg-red animate-pulse"></div>}
          {isRecording ? `REC ${formatTime(timeElapsed)}` : 'READY'}
        </div>
        
        {isRecording && (
          <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-[rgba(0,0,0,0.5)] text-cyan flex items-center gap-2 backdrop-blur-md">
            📍 GPS Active
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
        {!isRecording ? (
          <button 
            onClick={startRecording}
            className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.2)] border-2 border-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
          >
            <div className="w-12 h-12 rounded-full bg-red"></div>
          </button>
        ) : (
          <button 
            onClick={stopRecording}
            className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.2)] border-2 border-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
          >
            <div className="w-6 h-6 rounded-sm bg-red"></div>
          </button>
        )}
      </div>
    </div>
  );
};

export default RoadScannerCamera;
