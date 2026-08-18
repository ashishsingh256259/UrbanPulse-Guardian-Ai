import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Camera, MapPin, AlertCircle, Upload, Loader2, Info } from 'lucide-react';

export default function ReportIssue() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [address, setAddress] = useState('');
  const [formData, setFormData] = useState({ issue_type: '', landmark: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const { checkAuth } = useAuth(); // Refresh user data after points award

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selected);
    }
  };

  const getLocation = () => {
    setLocLoading(true);
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        try {
          // Reverse geocoding (mock or real)
          setAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
        } catch (e) {
          console.error("Geocoding failed");
        }
        setLocLoading(false);
      },
      () => {
        setError('Unable to retrieve your location');
        setLocLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!file) return setError('Please capture or upload an image');
    if (!location.lat || !location.lng) return setError('Please provide location coordinates');

    setLoading(true);
    const data = new FormData();
    data.append('photo', file);
    data.append('lat', location.lat);
    data.append('lng', location.lng);
    data.append('address', address);
    data.append('issue_type', formData.issue_type);
    data.append('landmark', formData.landmark);
    data.append('description', formData.description);

    try {
      const res = await api.post('/api/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(res.data);
      await checkAuth(); // Refresh user points
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="card text-center space-y-6">
          <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold">Report Submitted!</h2>
          <p className="text-slate-300">Thank you for helping keep the city safe.</p>
          
          <div className="bg-slate-800 p-6 rounded-lg text-left max-w-md mx-auto space-y-3">
            <h3 className="font-bold text-primary mb-4 border-b border-slate-700 pb-2">AI Analysis Results</h3>
            <div className="flex justify-between">
              <span className="text-slate-400">Detected Issue:</span>
              <span className="font-bold capitalize">{success.ai_detected.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Severity:</span>
              <span className="font-bold capitalize">{success.severity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Risk Score:</span>
              <span className={`font-bold ${success.risk_score > 75 ? 'text-danger' : 'text-warning'}`}>{success.risk_score}/100</span>
            </div>
            <div className="flex justify-between pt-4 mt-2 border-t border-slate-700">
              <span className="text-slate-400">Points Awarded:</span>
              <span className="font-bold text-primary">+{success.points_awarded} Points</span>
            </div>
          </div>
          
          <div className="pt-6">
            <button onClick={() => window.location.href='/dashboard'} className="btn-primary">Return to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <AlertCircle className="text-primary" /> Report a Civic Issue
        </h1>
        <p className="text-slate-400 mt-2">Help us identify and resolve urban infrastructure problems in real-time.</p>
      </div>

      <div className="card">
        {error && <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">1. Capture Evidence *</label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:bg-slate-800/50 transition-colors relative overflow-hidden">
              {preview ? (
                <div className="absolute inset-0 z-0">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-60" />
                </div>
              ) : (
                <Camera className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              )}
              
              <div className="relative z-10">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" capture="environment" />
                <label htmlFor="file-upload" className="btn-primary cursor-pointer inline-flex items-center gap-2">
                  <Upload size={18} /> {preview ? 'Change Photo' : 'Upload or Take Photo'}
                </label>
                {!preview && <p className="text-xs text-slate-500 mt-4">Max file size: 10MB</p>}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">2. Incident Location *</label>
            <div className="flex gap-4">
              <button type="button" onClick={getLocation} disabled={locLoading} className="btn-secondary flex-shrink-0 flex items-center gap-2">
                {locLoading ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                Get Current Location
              </button>
              <input type="text" readOnly value={address} placeholder="Coordinates will appear here" className="input-field bg-slate-900 cursor-not-allowed" />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">3. Additional Details (Optional)</label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select 
                  className="input-field"
                  value={formData.issue_type}
                  onChange={(e) => setFormData({...formData, issue_type: e.target.value})}
                >
                  <option value="">Let AI detect issue type...</option>
                  <option value="pothole">Pothole</option>
                  <option value="garbage">Garbage Dump</option>
                  <option value="waterlogging">Waterlogging</option>
                  <option value="streetlight">Broken Streetlight</option>
                  <option value="road_crack">Road Crack</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Nearby Landmark"
                  value={formData.landmark}
                  onChange={(e) => setFormData({...formData, landmark: e.target.value})}
                />
              </div>
            </div>

            <textarea 
              rows="3" 
              className="input-field" 
              placeholder="Describe the issue in more detail..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex items-start gap-3">
            <Info className="text-primary mt-1 flex-shrink-0" size={20} />
            <p className="text-sm text-slate-300">
              Upon submission, our AI will analyze the image to determine the exact issue type and severity. 
              You will be awarded Guardian Points based on the verified risk score of the report.
            </p>
          </div>

          <button type="submit" disabled={loading} className={`w-full py-4 text-lg btn-primary flex justify-center items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {loading ? <><Loader2 className="animate-spin" size={20} /> Processing via AI...</> : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
