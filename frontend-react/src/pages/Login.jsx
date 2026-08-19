import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, Navigate } from 'react-router-dom';

const Login = () => {
  const { user, apiCall, login } = useAuth();
  const navigate = useNavigate();
  
  const [role, setRole] = useState('citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errGlobal, setErrGlobal] = useState('');
  const [errEmail, setErrEmail] = useState('');
  const [errPass, setErrPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'municipal' ? '/municipal' : '/dashboard'} />;
  }

  const handleLogin = async () => {
    setErrGlobal(''); setErrEmail(''); setErrPass('');
    
    if (!email) { setErrEmail('Email is required'); return; }
    if (!password) { setErrPass('Password is required'); return; }

    setIsLoading(true);

    try {
      const data = await apiCall('/auth/login', 'POST', { email, password, role });
      login(data.access_token, data.user);
      setTimeout(() => {
        navigate(data.user.role === 'municipal' ? '/municipal' : '/dashboard');
      }, 800);
    } catch (e) {
      setErrGlobal(e.message || 'Invalid credentials');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-[420px]">
        
        <div className="text-center mb-8">
          <div className="text-[3.2rem] mb-2 leading-none">🏙️</div>
          <h1 className="font-display text-[2rem] font-extrabold tracking-tight">UrbanPulse <span className="text-cyan">Guardian</span></h1>
          <p className="text-text2 text-[0.95rem]">Sign in to your account</p>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-8 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <h2 className="font-display text-[1.4rem] font-extrabold mb-1">Welcome back 👋</h2>
          <p className="text-text2 text-[0.85rem] mb-6">Enter your credentials to continue</p>

          <div className="flex gap-2 mb-6 bg-[rgba(255,255,255,0.03)] rounded-[10px] p-1">
            <button 
              className={`flex-1 py-2 px-1 rounded-lg border-none text-[0.82rem] font-semibold cursor-pointer transition-all ${role === 'citizen' ? 'bg-cyan text-black' : 'bg-transparent text-text2'}`}
              onClick={() => setRole('citizen')}
            >
              👤 Citizen
            </button>
            <button 
              className={`flex-1 py-2 px-1 rounded-lg border-none text-[0.82rem] font-semibold cursor-pointer transition-all ${role === 'municipal' ? 'bg-cyan text-black' : 'bg-transparent text-text2'}`}
              onClick={() => setRole('municipal')}
            >
              🏛️ Municipality
            </button>
          </div>

          <div className="mb-4">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} placeholder={role === 'municipal' ? 'municipal@urbanpulse.gov' : 'you@example.com'} />
            {errEmail && <div className="text-[0.78rem] text-red mt-1.5 font-medium">{errEmail}</div>}
          </div>
          
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} placeholder="••••••••" />
            {errPass && <div className="text-[0.78rem] text-red mt-1.5 font-medium">{errPass}</div>}
          </div>

          {role === 'municipal' && (
            <div className="bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[10px] p-3 mb-4 text-[0.8rem] text-text2 leading-relaxed">
              🏛️ <strong className="text-cyan">Municipality Login</strong><br/>
              Use your official municipal credentials provided by the system admin.
            </div>
          )}

          {errGlobal && <div className="text-[0.85rem] text-red mb-3 font-medium">{errGlobal}</div>}

          <button className="btn btn-primary w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : 'Sign In'}
          </button>

          <div className="text-center mt-6 text-[0.85rem] text-text2 pt-5 border-t border-[rgba(255,255,255,0.05)]">
            Don't have an account? <Link to="/register" className="text-cyan font-semibold hover:underline">Create one free →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
