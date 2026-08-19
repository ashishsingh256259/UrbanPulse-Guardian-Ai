import { Outlet, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white">
      <nav className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl tracking-tight">UrbanPulse<span className="text-primary">.ai</span></span>
            </Link>
            <div className="flex space-x-4">
              <Link to="/login" className="text-slate-300 hover:text-white px-3 py-2 font-medium">Log In</Link>
              <Link to="/register" className="btn-primary px-4 py-2">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      <footer className="bg-slate-950 py-8 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} UrbanPulse Guardian AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
