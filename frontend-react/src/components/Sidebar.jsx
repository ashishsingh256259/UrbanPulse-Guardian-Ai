import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user, isMunicipal } = useAuth();
  const location = useLocation();
  const activePage = location.pathname.substring(1) || 'home';

  if (!user || !isMunicipal) return null;

  return (
    <div className="bg-bg-card2 border-r border-border py-6 sticky top-[var(--nav-h)] h-[calc(100vh-var(--nav-h))] overflow-y-auto hidden md:block">
      <div className="px-4 mb-6">
        <div className="px-3 mb-5">
          <div className="text-[0.7rem] text-text2">Logged in as</div>
          <div className="font-bold text-[0.9rem] mt-0.5">{user?.name || 'Officer'}</div>
          <div className="text-[0.72rem] text-cyan mt-0.5">Municipal Command</div>
        </div>
        
        <div className="text-[0.68rem] font-bold text-text3 tracking-widest uppercase mb-2 px-2">Command Control</div>
        <Link to="/municipal" className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[0.85rem] font-medium transition-all mb-0.5 ${activePage === 'municipal' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:bg-[rgba(255,255,255,0.04)] hover:text-text'}`}>
          88 Municipality Dashboard
        </Link>
        <Link to="/copilot" className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[0.85rem] font-medium transition-all mb-0.5 ${activePage === 'copilot' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:bg-[rgba(255,255,255,0.04)] hover:text-text'}`}>
          ✨ AI City Copilot
        </Link>
        <Link to="/heatmap" className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[0.85rem] font-medium transition-all mb-0.5 ${activePage === 'heatmap' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:bg-[rgba(255,255,255,0.04)] hover:text-text'}`}>
          🗺️ Urban Heatmap Grid
        </Link>
        <Link to="/emergency" className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[0.85rem] font-medium transition-all mb-0.5 ${activePage === 'emergency' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:bg-[rgba(255,255,255,0.04)] hover:text-text'}`}>
          🚨 Emergency Response Hub
        </Link>
        <Link to="/road-scanner" className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[0.85rem] font-medium transition-all mb-0.5 ${activePage === 'road-scanner' ? 'bg-[rgba(0,212,255,0.08)] text-cyan' : 'text-text2 hover:bg-[rgba(255,255,255,0.04)] hover:text-text'}`}>
          📷 AI Road Scanner
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
