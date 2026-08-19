import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Report = () => {
  const { user, login } = useAuth(); // using login to update user state if needed
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [photoFile, setPhotoFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [gpsData, setGpsData] = useState(null);
  const [locName, setLocName] = useState('Fetching location...');
  const [locCoords, setLocCoords] = useState('—');
  
  const [aiData, setAiData] = useState(null);    // { issue_detected, type, conf, sev, risk, explanation, recommendation }
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [procMsg, setProcMsg] = useState('Analyzing image...');
  
  const [formData, setFormData] = useState({
    issueType: '',
    landmark: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      getLocation();
    }
  }, [user]);

  const getLocation = () => {
    setLocName('Getting location...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setGpsData({ lat, lng });
        setLocCoords(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const d = await r.json();
          setLocName(d.display_name?.split(',').slice(0,3).join(', ') || 'Location found');
        } catch {
          setLocName('Location captured');
        }
      }, () => {
        setLocName('Location access denied — enable GPS');
      });
    }
  };

  const handlePhoto = (file) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewSrc(e.target.result);
      setStep(2);
      runAI(file);  // pass the actual File object, not base64
    };
    reader.readAsDataURL(file);
  };

  const resetPhoto = () => {
    setPhotoFile(null);
    setPreviewSrc(null);
    setAiData(null);
    setAiError(null);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const runAI = async (file) => {
    setIsProcessing(true);
    setAiError(null);
    const msgs = ['Analyzing image...', 'Identifying infrastructure issues...', 'Calculating risk score...'];
    let i = 0;
    setProcMsg(msgs[0]);
    const t = setInterval(() => {
      i++;
      if (i < msgs.length) setProcMsg(msgs[i]);
    }, 900);

    try {
      const token = localStorage.getItem('upg_token');
      const fd = new FormData();
      fd.append('photo', file);
      
      const res = await fetch('https://urbanpulse-guardian-ai.onrender.com/api/reports/analyze-preview', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      
      clearInterval(t);
      
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Server error ${res.status}`);
      }
      
      const data = await res.json();
      const conf = parseFloat(data.confidence) || 0;
      
      // Map backend type to display name
      const typeMap = {
        pothole: 'Pothole', garbage: 'Garbage Dump', waterlogging: 'Waterlogging',
        streetlight: 'Streetlight Failure', road_crack: 'Road Crack', sewer: 'Sewer Issue', other: 'Other Issue'
      };

      const aiResult = {
        issue_detected: data.issue_detected,
        type: typeMap[data.issue_type] || data.issue_type || null,
        conf,
        sev: data.severity,
        explanation: data.explanation || '',
        recommendation: data.recommendation || ''
      };

      // Auto-fill issue type if detected with high confidence
      if (data.issue_detected && conf >= 80 && data.issue_type) {
        const mapping = { pothole: 'pothole', garbage: 'garbage', waterlogging: 'waterlogging', streetlight: 'streetlight', road_crack: 'road_crack', sewer: 'sewer', other: 'other' };
        if (mapping[data.issue_type]) {
          setFormData(prev => ({ ...prev, issueType: mapping[data.issue_type] }));
        }
      }

      setAiData(aiResult);
      setStep(3);
    } catch (e) {
      clearInterval(t);
      setAiError(e.message || 'AI analysis unavailable. Please try again.');
      // Still advance to step 3 so user can submit manually
      setAiData({ issue_detected: false, type: null, conf: 0, sev: null, explanation: '', recommendation: '' });
      setStep(3);
    } finally {
      setIsProcessing(false);
    }
  };


  const submitReport = async () => {
    if (!photoFile || !gpsData) return;
    setIsSubmitting(true);
    
    const token = localStorage.getItem('upg_token');
    const fd = new FormData();
    fd.append('photo', photoFile);
    fd.append('lat', gpsData.lat);
    fd.append('lng', gpsData.lng);
    fd.append('address', locName);
    fd.append('issue_type', formData.issueType || (aiData?.type||'').toLowerCase().replace(' ','_'));
    fd.append('landmark', formData.landmark);
    fd.append('description', formData.description);

    try {
      const res = await fetch('https://urbanpulse-guardian-ai.onrender.com/api/reports/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: fd
      });
      
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      if (user) {
        const updatedUser = { ...user, points: (user.points || 0) + (data.points_awarded || 10) };
        localStorage.setItem('upg_user', JSON.stringify(updatedUser));
        login(token, updatedUser); // trigger context update
      }
      
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (e) {
      alert('Submit Failed: ' + e.message);
      setIsSubmitting(false);
    }
  };

  const riskColor = (score) => {
    if (score >= 80) return 'var(--red)';
    if (score >= 60) return 'var(--orange)';
    if (score >= 40) return 'var(--yellow)';
    return 'var(--green)';
  };

  const riskLabel = (score) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Warning';
    return 'Safe';
  };

  if (!user) return <div className="page-wrap container pt-24 text-center">Please login to report an issue.</div>;

  return (
    <>
      {isProcessing && (
        <div className="fixed inset-0 bg-[rgba(7,9,15,0.92)] z-[9999] flex flex-col items-center justify-center gap-4">
          <div className="w-[52px] h-[52px] border-4 border-[rgba(0,212,255,0.1)] border-t-cyan rounded-full animate-spin"></div>
          <div className="font-display text-xl font-bold">🤖 AI Analyzing...</div>
          <div className="text-sm text-text2">{procMsg}</div>
        </div>
      )}

      <div className="page-wrap container pt-24 pb-20 max-w-[900px] mx-auto">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-display font-extrabold mb-2">📸 Report an Issue</h1>
          <p className="text-text2">Upload a photo and our AI will instantly detect, classify and prioritize it.</p>
        </div>

        <div className="flex gap-2 mb-7">
          <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${step >= 1 ? (step > 1 ? 'bg-green' : 'bg-cyan') : 'bg-[rgba(255,255,255,0.05)]'}`}></div>
          <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${step >= 2 ? (step > 2 ? 'bg-green' : 'bg-cyan') : 'bg-[rgba(255,255,255,0.05)]'}`}></div>
          <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${step >= 3 ? (step > 3 ? 'bg-green' : 'bg-cyan') : 'bg-[rgba(255,255,255,0.05)]'}`}></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left */}
          <div>
            <div className="card">
              <div className="card-title">📷 Upload Photo</div>
              <div 
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all relative overflow-hidden ${isDragging ? 'border-cyan bg-[rgba(0,212,255,0.03)]' : 'border-border hover:border-cyan hover:bg-[rgba(0,212,255,0.03)]'}`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault(); setIsDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f?.type.startsWith('image/')) handlePhoto(f);
                }}
              >
                <input type="file" ref={fileInputRef} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" accept="image/*" capture="environment" onChange={e => e.target.files[0] && handlePhoto(e.target.files[0])} />
                
                {!previewSrc ? (
                  <div>
                    <div className="text-4xl mb-3">📷</div>
                    <div className="font-semibold mb-1.5">Drop photo here or click to browse</div>
                    <div className="text-[0.78rem] text-text2">JPG, PNG, WEBP · Max 10MB</div>
                  </div>
                ) : (
                  <img src={previewSrc} alt="preview" className="w-full rounded-xl max-h-[260px] object-cover border border-border" />
                )}
              </div>
              {previewSrc && (
                <div className="mt-2.5">
                  <button className="btn btn-ghost w-full" onClick={resetPhoto}>↩ Change Photo</button>
                </div>
              )}
            </div>

            {aiData && (
              <div className={`border rounded-2xl p-5 mt-4 ${aiData.issue_detected ? 'bg-[rgba(0,212,255,0.04)] border-[rgba(0,212,255,0.12)]' : 'bg-[rgba(255,61,90,0.04)] border-[rgba(255,61,90,0.15)]'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${aiData.issue_detected ? 'bg-green animate-pulse' : 'bg-yellow'}`}></div>
                  <span className="text-[0.82rem] font-bold text-cyan">AI Analysis Complete</span>
                  {aiError && <span className="text-[0.72rem] text-yellow ml-auto">⚠️ {aiError}</span>}
                </div>

                {!aiData.issue_detected ? (
                  <div className="text-center py-3">
                    <div className="text-3xl mb-2">🔍</div>
                    <div className="font-bold text-[1rem] mb-1">No Infrastructure Issue Detected</div>
                    <div className="text-[0.8rem] text-text2 mb-2">
                      {aiData.explanation || 'The uploaded image does not appear to show a supported urban infrastructure problem.'}
                    </div>
                    {aiData.conf > 0 && (
                      <div className="text-[0.75rem] text-text3">AI Confidence: {aiData.conf.toFixed(1)}%</div>
                    )}
                    <div className="mt-3 text-[0.78rem] text-yellow">
                      💡 You can still submit manually by selecting an issue type below.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-bg-card2 border border-border rounded-xl p-3.5">
                        <div className="text-[0.72rem] text-text2 mb-1.5 uppercase tracking-wider">Issue Detected</div>
                        <div className="font-display text-[1.1rem] font-extrabold">{aiData.type}</div>
                      </div>
                      <div className="bg-bg-card2 border border-border rounded-xl p-3.5">
                        <div className="text-[0.72rem] text-text2 mb-1.5 uppercase tracking-wider">Confidence</div>
                        <div className={`font-display text-[1.1rem] font-extrabold ${aiData.conf >= 80 ? 'text-green' : aiData.conf >= 60 ? 'text-yellow' : 'text-orange'}`}>
                          {aiData.conf.toFixed(1)}%
                          <span className="text-[0.65rem] font-normal ml-1 text-text2">
                            {aiData.conf >= 80 ? '(High)' : aiData.conf >= 60 ? '(Moderate)' : '(Low)'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-bg-card2 border border-border rounded-xl p-3.5">
                        <div className="text-[0.72rem] text-text2 mb-1.5 uppercase tracking-wider">Severity</div>
                        <div className={`font-display text-[1.1rem] font-extrabold capitalize ${aiData.sev === 'critical' ? 'text-red' : aiData.sev === 'high' ? 'text-orange' : 'text-yellow'}`}>{aiData.sev}</div>
                      </div>
                      <div className="bg-bg-card2 border border-border rounded-xl p-3.5">
                        <div className="text-[0.72rem] text-text2 mb-1.5 uppercase tracking-wider">Status</div>
                        <div className="font-display text-[0.9rem] font-bold text-green">
                          {aiData.conf >= 80 ? '✅ Confirmed' : '⚠️ Possible issue'}
                        </div>
                      </div>
                    </div>
                    {aiData.explanation && (
                      <div className="bg-[rgba(255,255,255,0.03)] border border-border rounded-xl p-3 mt-2">
                        <div className="text-[0.72rem] text-text2 uppercase tracking-wider mb-1">Evidence</div>
                        <div className="text-[0.8rem]">{aiData.explanation}</div>
                      </div>
                    )}
                    {aiData.recommendation && (
                      <div className="text-[0.78rem] text-text2 mt-2">💡 {aiData.recommendation}</div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right */}
          <div>
            <div className="card">
              <div className="card-title">📍 Issue Details</div>

              <div className="bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.1)] rounded-xl p-3.5 flex items-center gap-3 mb-4.5">
                <span className="text-[1.3rem]">📍</span>
                <div className="flex-1">
                  <div className="text-[0.85rem] font-semibold">{locName}</div>
                  <div className="text-[0.72rem] text-text2 mt-0.5">{locCoords}</div>
                </div>
                <button className="p-2 bg-[rgba(255,255,255,0.05)] rounded-lg hover:bg-[rgba(255,255,255,0.1)]" onClick={getLocation}>↻</button>
              </div>

              <div className="mb-4">
                <label className="form-label">Issue Type</label>
                <select className="form-input bg-bg-card appearance-none cursor-pointer" value={formData.issueType} onChange={e => setFormData({...formData, issueType: e.target.value})}>
                  <option value="">— AI will auto-detect —</option>
                  <option value="pothole">🕳️ Pothole</option>
                  <option value="garbage">🗑️ Garbage Dump</option>
                  <option value="waterlogging">💧 Waterlogging</option>
                  <option value="streetlight">💡 Streetlight Failure</option>
                  <option value="road_crack">🛣️ Road Crack</option>
                  <option value="sewer">🚧 Sewer Issue</option>
                  <option value="other">⚠️ Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label">Nearby Landmark</label>
                <input className="form-input" value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} placeholder="e.g. Near City Hospital Gate 2" />
              </div>

              <div className="mb-4">
                <label className="form-label">Description (optional)</label>
                <textarea className="form-input min-h-[100px] resize-y" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Any additional details about the issue..."></textarea>
              </div>

              <button className="btn btn-primary w-full" onClick={submitReport} disabled={!photoFile || !gpsData || isSubmitting || isProcessing}>
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Submitting...
                  </span>
                ) : (
                  <span>📤 Submit Report (+10 points)</span>
                )}
              </button>
              <div className="text-[0.72rem] text-text2 text-center mt-2">Location & photo are required</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Report;
