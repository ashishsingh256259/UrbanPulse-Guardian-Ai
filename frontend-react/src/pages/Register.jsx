import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
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

  const handleGoogleLogin = () => {
    setErrGlobal('');
    signInWithPopup(auth, googleProvider)
      .then(async (result) => {
        setIsLoading(true);
        const fbUser = result.user;
        try {
          const data = await apiCall('/auth/google', 'POST', {
            email: fbUser.email,
            name: fbUser.displayName,
            uid: fbUser.uid
          });
          login(data.access_token, data.user);
          setTimeout(() => {
            navigate(data.user.role === 'municipal' ? '/municipal' : '/dashboard');
          }, 800);
        } catch (error) {
          console.error(error);
          setErrGlobal(error.message || 'Google registration failed on server');
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error(error);
        if (error.code !== 'auth/popup-closed-by-user') {
          setErrGlobal(error.message || 'Google registration failed');
        }
        setIsLoading(false);
      });
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
          
          <div className="mt-4 mb-2 flex items-center justify-center">
            <div className="h-px bg-[rgba(255,255,255,0.1)] flex-1"></div>
            <span className="px-3 text-[0.8rem] text-text2 uppercase tracking-wider font-semibold">or</span>
            <div className="h-px bg-[rgba(255,255,255,0.1)] flex-1"></div>
          </div>

          <button 
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-[rgba(255,255,255,0.02)] text-[0.95rem] font-semibold text-white hover:bg-[rgba(255,255,255,0.06)] transition-all disabled:opacity-50"
            onClick={handleGoogleLogin} 
            disabled={isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
          
          <div className="text-center mt-6 text-[0.85rem] text-text2 pt-5 border-t border-[rgba(255,255,255,0.05)]">
            Already have an account? <Link to="/login" className="text-cyan font-semibold hover:underline">Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
