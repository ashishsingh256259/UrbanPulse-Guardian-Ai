import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, apiCall } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await apiCall('/api/reports/my-reports');
        setReports(data || []);
        setStats({
          total: data?.length || 0,
          resolved: data?.filter(r => r.status === 'resolved').length || 0,
          pending: data?.filter(r => r.status === 'pending').length || 0
        });
      } catch (e) {
        console.error(e);
      }
    };
    if (user) fetchReports();
  }, [user, apiCall]);

  const getLevel = (points) => {
    if (points >= 15000) return { name: 'Platinum Guardian', icon: '💎', next: null, nextAt: null };
    if (points >= 5000)  return { name: 'Gold Guardian',     icon: '🥇', next: 'Platinum', nextAt: 15000 };
    if (points >= 1000)  return { name: 'Silver Guardian',   icon: '🥈', next: 'Gold',     nextAt: 5000 };
    return                      { name: 'Bronze Guardian',   icon: '🥉', next: 'Silver',   nextAt: 1000 };
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const riskColor = (score) => {
    if (score >= 80) return 'var(--red)';
    if (score >= 60) return 'var(--orange)';
    if (score >= 40) return 'var(--yellow)';
    return 'var(--green)';
  };

  const issueEmoji = (type) => {
    const map = { pothole:'🕳️', garbage:'🗑️', waterlogging:'💧', streetlight:'💡', road_crack:'🛣️', sewer:'🚧', other:'⚠️' };
    return map[type] || '⚠️';
  };

  const lvl = getLevel(user?.points || 0);
  const prevPoints = lvl.name === 'Bronze Guardian' ? 0 : lvl.name === 'Silver Guardian' ? 1000 : 5000;
  const pct = lvl.nextAt ? Math.min((((user?.points || 0) - prevPoints) / (lvl.nextAt - prevPoints)) * 100, 100) : 100;

  return (
    <div className="page-wrap">
      <div className="container">
        
        <div className="bg-gradient-to-br from-[rgba(0,212,255,0.08)] to-[rgba(139,92,246,0.08)] border border-[rgba(0,212,255,0.15)] rounded-[var(--r)] p-7 mb-6 flex items-center gap-6 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan to-purple flex items-center justify-center text-3xl shrink-0">👤</div>
          <div className="flex-1">
            <div className="text-[0.8rem] text-text2 mb-1">Welcome back,</div>
            <div className="font-display text-2xl font-extrabold">{user?.name || 'Citizen'}</div>
            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[20px] bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] text-yellow text-[0.78rem] font-bold">
                {lvl.icon} {lvl.name}
              </div>
              {user?.city && <span className="text-[0.78rem] text-text2">📍 {user.city}</span>}
            </div>
            <div className="mt-3 max-w-[320px]">
              <div className="flex justify-between text-[0.75rem] text-text2 mb-1.5">
                <span>{lvl.next ? `Progress to ${lvl.next}` : 'Max Level'}</span>
                <span>{(user?.points || 0).toLocaleString()} pts</span>
              </div>
              <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                <div className="h-full bg-cyan transition-all duration-1000" style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-display text-[2.5rem] font-extrabold text-yellow leading-none">{(user?.points || 0).toLocaleString()}</div>
            <div className="text-[0.75rem] text-text2 mt-1">Total Points</div>
            <Link to="/report" className="btn-primary px-3 py-1.5 text-xs mt-3 inline-block">+ Report Issue</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { c: 'border-t-cyan', val: stats.total, lbl: 'My Reports', filterKey: 'all' },
            { c: 'border-t-green', val: stats.resolved, lbl: 'Resolved', filterKey: 'resolved' },
            { c: 'border-t-yellow', val: stats.pending, lbl: 'Pending', filterKey: 'pending' },
            { c: 'border-t-purple', val: user?.points || 0, lbl: 'Points Earned', path: '/rewards' },
          ].map((s, i) => (
            <div key={i} 
                 className={`bg-bg-card border border-border border-t-2 ${s.c} rounded-[var(--r)] p-5 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors`}
                 onClick={() => {
                   if (s.path) navigate(s.path);
                   else if (s.filterKey) setFilter(s.filterKey);
                 }}>
              <div className="font-display text-3xl font-extrabold leading-none mb-1">{s.val}</div>
              <div className="text-[0.78rem] text-text2">{s.lbl}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="font-display text-[1.05rem] font-bold">📋 {filter === 'all' ? 'My Reports' : filter === 'resolved' ? 'Resolved Reports' : 'Pending Reports'}</div>
              <Link to="/report" className="btn-primary px-3 py-1.5 text-xs">+ New Report</Link>
            </div>
            
            <div className="flex flex-col gap-2.5">
              {(filter === 'all' ? reports : reports.filter(r => r.status === filter)).length === 0 ? (
                <div className="text-center py-10 bg-bg-card border border-border rounded-[var(--r)]">
                  <div className="text-4xl mb-3">📸</div>
                  <h3 className="font-bold text-lg">No reports yet</h3>
                  <p className="text-text2 text-sm mt-1 mb-4">Submit your first issue to get started and earn points!</p>
                  <Link to="/report" className="btn-primary">Report an Issue</Link>
                </div>
              ) : (
                (filter === 'all' ? reports : reports.filter(r => r.status === filter)).slice(0, 10).map((r, i) => (
                  <div key={i} className="bg-bg-card border border-border rounded-[var(--r)] p-4 flex items-center gap-3.5 hover:border-[rgba(0,212,255,0.12)] hover:translate-x-0.5 transition-all">
                    <div className="text-2xl shrink-0">{issueEmoji(r.issue_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[0.9rem] truncate">{(r.issue_type || '').replace('_', ' ').toUpperCase()} {r.landmark ? `— ${r.landmark}` : ''}</div>
                      <div className="text-[0.75rem] text-text2 mt-1">{timeAgo(r.created_at)} · {r.location?.address || 'Location recorded'}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`badge ${r.status === 'resolved' ? 'badge-resolved' : 'badge-pending'}`}>{r.status === 'resolved' ? '✅ Resolved' : '⏳ Pending'}</span>
                      <div className="font-display text-[1.3rem] font-extrabold mt-2 leading-none" style={{ color: riskColor(r.risk_score || 0) }}>{Math.round(r.risk_score || 0)}</div>
                      <div className="text-[0.68rem] text-text2">risk score</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="bg-bg-card border border-border rounded-[var(--r)] p-6">
              <div className="font-bold mb-5">🏆 Your Progress</div>
              <div className="text-center py-5">
                <div className="text-5xl mb-2">{lvl.icon}</div>
                <div className="font-display text-[1.1rem] font-extrabold mb-1">{lvl.name}</div>
                <div className="text-[0.78rem] text-text2">{lvl.next ? `${(lvl.nextAt - (user?.points || 0)).toLocaleString()} pts to ${lvl.next}` : '🏆 Max Level!'}</div>
              </div>
              
              <div className="h-px bg-border my-4 w-full"></div>
              
              <div className="flex flex-col gap-2.5">
                {[
                  { lbl: '📸 Valid report', pts: '+10 pts' },
                  { lbl: '✅ Issue resolved', pts: '+5 pts' },
                  { lbl: '🚨 Critical issue', pts: '+20 pts' },
                  { lbl: '🔥 7-day streak', pts: '+30 pts' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-[0.82rem] py-2 border-b border-border last:border-0">
                    <span>{item.lbl}</span>
                    <strong className="text-yellow">{item.pts}</strong>
                  </div>
                ))}
              </div>
              <Link to="/rewards" className="btn-ghost w-full py-3 mt-4 text-center block rounded-xl font-bold text-sm">View Leaderboard →</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
