import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, Navigate } from 'react-router-dom';

const Register = () => {
  const { user, apiCall, login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fname: '', lname: '', email: '', phone: '', city: '', password: ''
  });
  const [errGlobal, setErrGlobal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'municipal' ? '/municipal' : '/dashboard'} />;
  }

  const handleRegister = async () => {
    setErrGlobal('');
    const { fname, lname, email, phone, city, password } = formData;

    if (!fname || !lname || !email || !password) {
      setErrGlobal('Please fill all required fields'); return;
    }
    if (password.length < 8) {
      setErrGlobal('Password must be at least 8 characters'); return;
    }

    setIsLoading(true);

    try {
      const data = await apiCall('/auth/register', 'POST', { 
        first_name: fname, last_name: lname, email, phone, city, password 
      });
      login(data.access_token, data.user);
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (e) {
      setErrGlobal(e.message || 'Registration failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-[480px]">
        
        <div className="text-center mb-8">
          <div className="text-[3.2rem] mb-2 leading-none">🏙️</div>
          <h1 className="font-display text-[2rem] font-extrabold tracking-tight">UrbanPulse <span className="text-cyan">Guardian</span></h1>
          <p className="text-text2 text-[0.95rem]">Create your citizen account</p>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-8 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <h2 className="font-display text-[1.4rem] font-extrabold mb-1">Join as Guardian 🚀</h2>
          <p className="text-text2 text-[0.85rem] mb-6">Free forever. Start earning points today.</p>

          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">First Name</label>
              <input className="form-input" type="text" placeholder="Anmol" value={formData.fname} onChange={e => setFormData({...formData, fname: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input className="form-input" type="text" placeholder="Mishra" value={formData.lname} onChange={e => setFormData({...formData, lname: e.target.value})} />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          
          <div className="mb-4">
            <label className="form-label">Phone Number</label>
            <input className="form-input" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          
          <div className="mb-4">
            <label className="form-label">City</label>
            <select className="form-input bg-bg-card appearance-none cursor-pointer" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}>
              <option value="">Select your city</option>
              <option>Delhi</option><option>Mumbai</option><option>Bangalore</option>
              <option>Chennai</option><option>Hyderabad</option><option>Pune</option>
              <option>Noida</option><option>Gurgaon</option><option>Other</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min 8 characters" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          {errGlobal && <div className="text-[0.85rem] text-red mb-3 font-medium">{errGlobal}</div>}

          <button className="btn btn-primary w-full" onClick={handleRegister} disabled={isLoading}>
            {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : 'Create Account'}
          </button>
          
          <p className="text-[0.72rem] text-text2 text-center mt-2.5">
            By signing up you agree to our Terms of Service
          </p>
          
          <div className="text-center mt-6 text-[0.85rem] text-text2 pt-5 border-t border-[rgba(255,255,255,0.05)]">
            Already have an account? <Link to="/login" className="text-cyan font-semibold hover:underline">Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
