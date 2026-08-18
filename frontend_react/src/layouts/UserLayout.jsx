import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LayoutDashboard, Map, MapPin, Award, AlertTriangle, LogOut, ShieldAlert } from 'lucide-react';

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Report Issue', path: '/report', icon: <AlertTriangle size={20} /> },
    { name: 'Live Heatmap', path: '/heatmap', icon: <Map size={20} /> },
    { name: 'Safe Route', path: '/saferoute', icon: <MapPin size={20} /> },
    { name: 'Rewards', path: '/rewards', icon: <Award size={20} /> },
  ];

  if (user?.role === 'municipal') {
      navItems.push({ name: 'Municipal Dashboard', path: '/municipal', icon: <ShieldAlert size={20} /> });
  }

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col fixed h-full">
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">UrbanPulse<span className="text-primary">.ai</span></span>
          </Link>
        </div>
        
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.level}</p>
            </div>
          </div>
          <div className="mt-4 bg-slate-900 rounded-lg p-3 flex justify-between items-center text-sm">
            <span className="text-slate-400">Points</span>
            <span className="font-bold text-primary">{user?.points}</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
