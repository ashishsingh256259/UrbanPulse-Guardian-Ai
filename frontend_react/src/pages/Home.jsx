import { Link } from 'react-router-dom';
import { Activity, MapPin, AlertCircle, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Activity className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            City Intelligence <span className="text-primary">Powered by AI</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Empowering citizens and municipal authorities with real-time AI analysis of urban infrastructure. Report issues, track resolutions, and build safer cities together.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-4">Join as Citizen</Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-4">Municipal Access</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Our AI-powered platform makes urban reporting simple, accurate, and actionable.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Capture Issue</h3>
              <p className="text-slate-400">Take a photo of any civic issue. Our AI instantly analyzes it to identify the problem and severity.</p>
            </div>
            <div className="card text-center hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Auto-Location</h3>
              <p className="text-slate-400">The app automatically tags the precise GPS coordinates and alerts the responsible municipal ward.</p>
            </div>
            <div className="card text-center hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Track Progress</h3>
              <p className="text-slate-400">Monitor the resolution status in real-time and earn Guardian Points for keeping your city safe.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
