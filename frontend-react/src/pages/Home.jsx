import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting || e.target.dataset.animated) return;
        e.target.dataset.animated = true;
        const target = parseInt(e.target.dataset.count, 10);
        let cur = 0;
        const step = target / 60;
        const t = setInterval(() => {
          cur = Math.min(cur + step, target);
          e.target.textContent = Math.floor(cur).toLocaleString();
          if (cur >= target) clearInterval(t);
        }, 20);
      });
    }, { threshold: 0.5 });

    const counters = document.querySelectorAll('[data-count]');
    counters.forEach(c => observer.observe(c));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center text-center pt-[100px] px-6 pb-[60px] relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.03) 1px,transparent 1px)', backgroundSize: '60px 60px' }}></div>
          <div className="absolute rounded-full blur-[80px] opacity-12 w-[500px] h-[500px] bg-cyan top-[-100px] left-1/2 -translate-x-1/2"></div>
          <div className="absolute rounded-full blur-[80px] opacity-12 w-[300px] h-[300px] bg-purple bottom-0 right-[10%]"></div>
        </div>
        <div className="relative z-10 max-w-[780px]">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-[20px] bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] text-cyan text-[0.78rem] font-semibold tracking-wider uppercase mb-7">
            <span className="w-2 h-2 rounded-full bg-green animate-[blink_1.5s_ease-in-out_infinite]"></span> AI-Powered Urban Intelligence
          </div>
          <h1 className="font-display text-[clamp(2.8rem,6vw,5rem)] font-extrabold leading-[1.05] tracking-tight mb-6">
            Your City.<br/><span className="bg-gradient-to-br from-cyan to-purple bg-clip-text text-transparent">Smarter.</span> Safer.<br/>Faster.
          </h1>
          <p className="text-text2 text-[1.1rem] leading-[1.7] max-w-[560px] mx-auto mb-10">
            Report urban issues in seconds. Our AI detects, scores risk, and alerts authorities — before small problems become big crises.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <Link to="/register" className="btn btn-primary btn-lg">
              📸 Report an Issue
            </Link>
            <Link to="/heatmap" className="btn btn-ghost btn-lg">
              🗺️ View City Map
            </Link>
          </div>
          <div className="flex gap-10 justify-center mt-15 flex-wrap" ref={statsRef}>
            <div className="text-center"><div className="font-display text-[2rem] font-extrabold text-text" data-count="12847">0</div><div className="text-[0.78rem] text-text2 mt-0.5">Issues Resolved</div></div>
            <div className="text-center"><div className="font-display text-[2rem] font-extrabold text-text" data-count="94">0</div><div className="text-[0.78rem] text-text2 mt-0.5">AI Accuracy %</div></div>
            <div className="text-center"><div className="font-display text-[2rem] font-extrabold text-text" data-count="328">0</div><div className="text-[0.78rem] text-text2 mt-0.5">Active Citizens</div></div>
            <div className="text-center"><div className="font-display text-[2rem] font-extrabold text-text" data-count="48">0</div><div className="text-[0.78rem] text-text2 mt-0.5">Hrs Avg Resolution</div></div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-bg-card2 border-y border-border">
        <div className="container">
          <div className="inline-block py-1 px-3.5 rounded-[20px] bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.25)] text-purple text-[0.72rem] font-bold tracking-widest uppercase mb-4">How It Works</div>
          <h2 className="font-display text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-tight mb-3">From Photo to Fix in 4 Steps</h2>
          <p className="text-text2 text-base max-w-[500px]">Our AI pipeline handles everything — you just snap and submit.</p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 mt-12">
            <div className="bg-bg-card border border-border rounded-2xl p-7 relative transition-all hover:-translate-y-1 hover:border-[rgba(0,212,255,0.12)]">
              <div className="absolute top-4 right-5 font-display text-[2.5rem] font-extrabold text-[rgba(0,212,255,0.1)]">01</div>
              <div className="text-[2rem] mb-4">📸</div>
              <h3 className="font-display text-base font-bold mb-2">Snap & Submit</h3>
              <p className="text-[0.85rem] text-text2 leading-relaxed">Take a photo of the issue. GPS auto-tags location. Submit in one tap.</p>
            </div>
            <div className="bg-bg-card border border-border rounded-2xl p-7 relative transition-all hover:-translate-y-1 hover:border-[rgba(0,212,255,0.12)]">
              <div className="absolute top-4 right-5 font-display text-[2.5rem] font-extrabold text-[rgba(0,212,255,0.1)]">02</div>
              <div className="text-[2rem] mb-4">🤖</div>
              <h3 className="font-display text-base font-bold mb-2">AI Detection</h3>
              <p className="text-[0.85rem] text-text2 leading-relaxed">YOLOv8 identifies issue type and severity with up to 96% accuracy.</p>
            </div>
            <div className="bg-bg-card border border-border rounded-2xl p-7 relative transition-all hover:-translate-y-1 hover:border-[rgba(0,212,255,0.12)]">
              <div className="absolute top-4 right-5 font-display text-[2.5rem] font-extrabold text-[rgba(0,212,255,0.1)]">03</div>
              <div className="text-[2rem] mb-4">📊</div>
              <h3 className="font-display text-base font-bold mb-2">Risk Scoring</h3>
              <p className="text-[0.85rem] text-text2 leading-relaxed">Random Forest calculates priority based on location, population, and facilities.</p>
            </div>
            <div className="bg-bg-card border border-border rounded-2xl p-7 relative transition-all hover:-translate-y-1 hover:border-[rgba(0,212,255,0.12)]">
              <div className="absolute top-4 right-5 font-display text-[2.5rem] font-extrabold text-[rgba(0,212,255,0.1)]">04</div>
              <div className="text-[2rem] mb-4">🏛️</div>
              <h3 className="font-display text-base font-bold mb-2">Authority Alerted</h3>
              <p className="text-[0.85rem] text-text2 leading-relaxed">Municipality gets real-time priority queue. Teams dispatched. Issue resolved.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="inline-block py-1 px-3.5 rounded-[20px] bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.25)] text-purple text-[0.72rem] font-bold tracking-widest uppercase mb-4">Platform Features</div>
          <h2 className="font-display text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-tight mb-3">Everything Your City Needs</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 mt-12">
            <div className="bg-bg-card border border-border rounded-2xl p-7 transition-all hover:-translate-y-[3px]">
              <div className="w-11 h-11 rounded-xl bg-[rgba(0,212,255,0.1)] text-cyan flex items-center justify-center text-[1.2rem] mb-4">🗺️</div>
              <h3 className="font-display text-base font-bold mb-2">Live City Heatmap</h3>
              <p className="text-[0.85rem] text-text2 leading-relaxed">Real-time map with layered overlays for road damage, flooding, garbage, and streetlight failures.</p>
            </div>
            <div className="bg-bg-card border border-border rounded-2xl p-7 transition-all hover:-translate-y-[3px]">
              <div className="w-11 h-11 rounded-xl bg-[rgba(255,61,90,0.1)] text-red flex items-center justify-center text-[1.2rem] mb-4">🌊</div>
              <h3 className="font-display text-base font-bold mb-2">Flood Prediction</h3>
              <p className="text-[0.85rem] text-text2 leading-relaxed">XGBoost model predicts flood probability 48 hours in advance using weather and drainage data.</p>
            </div>
            <div className="bg-bg-card border border-border rounded-2xl p-7 transition-all hover:-translate-y-[3px]">
              <div className="w-11 h-11 rounded-xl bg-[rgba(139,92,246,0.1)] text-purple flex items-center justify-center text-[1.2rem] mb-4">🏛️</div>
              <h3 className="font-display text-base font-bold mb-2">Municipal Dashboard</h3>
              <p className="text-[0.85rem] text-text2 leading-relaxed">AI-ranked priority queue, workforce allocation, and real-time resolution tracking.</p>
            </div>
            <div className="bg-bg-card border border-border rounded-2xl p-7 transition-all hover:-translate-y-[3px]">
              <div className="w-11 h-11 rounded-xl bg-[rgba(251,191,36,0.1)] text-yellow flex items-center justify-center text-[1.2rem] mb-4">🏆</div>
              <h3 className="font-display text-base font-bold mb-2">Citizen Rewards</h3>
              <p className="text-[0.85rem] text-text2 leading-relaxed">Earn points for every valid report. Climb from Bronze to Gold Guardian on the leaderboard.</p>
            </div>
            <div className="bg-bg-card border border-border rounded-2xl p-7 transition-all hover:-translate-y-[3px]">
              <div className="w-11 h-11 rounded-xl bg-[rgba(16,212,142,0.1)] text-green flex items-center justify-center text-[1.2rem] mb-4">✅</div>
              <h3 className="font-display text-base font-bold mb-2">Resolution Tracking</h3>
              <p className="text-[0.85rem] text-text2 leading-relaxed">Track your report from submission to resolution. Get notified when the issue is fixed.</p>
            </div>
            <div className="bg-bg-card border border-border rounded-2xl p-7 transition-all hover:-translate-y-[3px]">
              <div className="w-11 h-11 rounded-xl bg-[rgba(255,107,53,0.1)] text-orange flex items-center justify-center text-[1.2rem] mb-4">📱</div>
              <h3 className="font-display text-base font-bold mb-2">Mobile Friendly</h3>
              <p className="text-[0.85rem] text-text2 leading-relaxed">Fully responsive. Works on any device. Report issues directly from your phone camera.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="bg-gradient-to-br from-[rgba(0,212,255,0.05)] to-[rgba(139,92,246,0.05)] border border-border rounded-3xl p-16 text-center my-10">
            <h2 className="font-display text-[clamp(1.8rem,3vw,2.8rem)] font-extrabold mb-4">Ready to Make Your City Better?</h2>
            <p className="text-text2 text-base mb-9">Join thousands of citizens reporting issues and earning rewards.</p>
            <div className="flex gap-3.5 justify-center flex-wrap">
              <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
              <Link to="/login" className="btn btn-ghost btn-lg">Login</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border pt-10 pb-6">
        <div className="container">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="font-display font-bold flex items-center gap-2">🏙️ UrbanPulse <span className="text-cyan">Guardian AI</span></div>
            <div className="text-[0.8rem] text-text2">© 2024 UrbanPulse Guardian AI. Built for smarter cities.</div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
