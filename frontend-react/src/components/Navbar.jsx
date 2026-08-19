import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, isMunicipal, logout } = useAuth();
  const location = useLocation();
  const activePage = location.pathname.substring(1) || 'home';

  return (
    <nav className="fixed top-0 left-0 w-full h-[var(--nav-h)] bg-[rgba(7,9,15,0.92)] backdrop-blur-md border-b border-border z-50 transition-all duration-300 flex items-center px-6" id="main-nav">
      <Link className="flex items-center gap-3 font-display font-extrabold text-xl tracking-tight text-text hover:text-cyan transition-colors" to={user && isMunicipal ? '/municipal' : '/'}>
        <div className="text-2xl">🏙️</div>
        <span>UrbanPulse <span className="text-cyan">Guardian</span></span>
      </Link>
      
      <div className="flex-1 flex justify-center gap-2 max-md:hidden">
        {user && !isMunicipal && (
          <>
            <Link to="/dashboard" className={`px-4 py-2 rounded-xl text-[0.85rem] font-bold transition-all ${activePage === 'dashboard' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:text-text hover:bg-[rgba(255,255,255,0.04)]'}`}>Dashboard</Link>
            <Link to="/report" className={`px-4 py-2 rounded-xl text-[0.85rem] font-bold transition-all ${activePage === 'report' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:text-text hover:bg-[rgba(255,255,255,0.04)]'}`}>Report Issue</Link>
            <Link to="/copilot" className={`px-4 py-2 rounded-xl text-[0.85rem] font-bold transition-all ${activePage === 'copilot' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:text-text hover:bg-[rgba(255,255,255,0.04)]'}`}>✨ AI Copilot</Link>
            <Link to="/heatmap" className={`px-4 py-2 rounded-xl text-[0.85rem] font-bold transition-all ${activePage === 'heatmap' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:text-text hover:bg-[rgba(255,255,255,0.04)]'}`}>City Heatmap</Link>
            <Link to="/saferoute" className={`px-4 py-2 rounded-xl text-[0.85rem] font-bold transition-all ${activePage === 'saferoute' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:text-text hover:bg-[rgba(255,255,255,0.04)]'}`}>🛡️ Safe Route</Link>
            <Link to="/emergency" className={`px-4 py-2 rounded-xl text-[0.85rem] font-bold transition-all ${activePage === 'emergency' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:text-text hover:bg-[rgba(255,255,255,0.04)]'}`}>🚨 SOS Dispatch</Link>
            <Link to="/rewards" className={`px-4 py-2 rounded-xl text-[0.85rem] font-bold transition-all ${activePage === 'rewards' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:text-text hover:bg-[rgba(255,255,255,0.04)]'}`}>Rewards</Link>
          </>
        )}
        {user && isMunicipal && (
          <>
            <Link to="/municipal" className={`px-4 py-2 rounded-xl text-[0.85rem] font-bold transition-all ${activePage === 'municipal' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:text-text hover:bg-[rgba(255,255,255,0.04)]'}`}>Dashboard</Link>
            <Link to="/copilot" className={`px-4 py-2 rounded-xl text-[0.85rem] font-bold transition-all ${activePage === 'copilot' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:text-text hover:bg-[rgba(255,255,255,0.04)]'}`}>✨ AI Copilot</Link>
            <Link to="/heatmap" className={`px-4 py-2 rounded-xl text-[0.85rem] font-bold transition-all ${activePage === 'heatmap' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:text-text hover:bg-[rgba(255,255,255,0.04)]'}`}>City Heatmap</Link>
            <Link to="/emergency" className={`px-4 py-2 rounded-xl text-[0.85rem] font-bold transition-all ${activePage === 'emergency' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:text-text hover:bg-[rgba(255,255,255,0.04)]'}`}>🚨 Emergency Hub</Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-[0.82rem] text-text2">👋 {user?.name?.split(' ')[0] || 'User'}</span>
            <button className="px-4 py-2 rounded-xl border border-border text-sm font-bold bg-transparent text-text hover:bg-[rgba(255,255,255,0.05)] transition-all" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="px-4 py-2 rounded-xl border border-border text-sm font-bold bg-transparent text-text hover:bg-[rgba(255,255,255,0.05)] transition-all">Login</Link>
            <Link to="/register" className="btn-primary px-4 py-2 text-sm font-bold rounded-xl">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
