import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Rewards = () => {
  const { user, apiCall } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [reports, lb] = await Promise.all([
        apiCall('/api/reports/my-reports').catch(() => []),
        apiCall('/api/reports/leaderboard').catch(() => [])
      ]);
      setMyReports(reports || []);
      setLeaderboard(lb || []);
    } catch (e) {
      console.log('Error loading rewards', e);
    } finally {
      setLoading(false);
    }
  };

  const getLevel = (points = 0) => {
    if (points >= 5000) return { name: 'Gold Guardian', icon: '🥇', next: null, nextAt: null };
    if (points >= 1000) return { name: 'Silver Guardian', icon: '🥈', next: 'Gold Guardian', nextAt: 5000 };
    return { name: 'Bronze Guardian', icon: '🥉', next: 'Silver Guardian', nextAt: 1000 };
  };

  const pts = user?.points || 0;
  const lvl = getLevel(pts);
  const prev = lvl.name === 'Bronze Guardian' ? 0 : lvl.name === 'Silver Guardian' ? 1000 : 5000;
  const pct = lvl.next ? Math.min(((pts - prev) / (lvl.nextAt - prev)) * 100, 100) : 100;

  const issueEmoji = (type) => {
    const m = { pothole: '🕳️', garbage: '🗑️', waterlogging: '💧', streetlight: '💡', road_crack: '🛣️' };
    return m[type] || '⚠️';
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const medals = ['🥇', '🥈', '🥉'];

  if (!user) return <div className="page-wrap container pt-24 text-center">Please login to view rewards.</div>;

  return (
    <div className="page-wrap container pt-24 pb-20">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-4xl font-display font-extrabold mb-2">🏆 Rewards</h1>
        <p className="text-text2">Earn points by reporting genuine issues. Climb the leaderboard.</p>
      </div>

      {/* User Banner */}
      <div className="bg-gradient-to-br from-[rgba(251,191,36,0.08)] to-[rgba(139,92,246,0.08)] border border-[rgba(251,191,36,0.15)] rounded-2xl p-6 mb-7 flex items-center gap-5 flex-wrap">
        <div className="text-5xl">{lvl.icon}</div>
        <div className="flex-1 min-w-[200px]">
          <div className="font-display text-xl font-extrabold">{user.name}</div>
          <div className="text-sm text-text2 mt-1">{lvl.icon} {lvl.name}</div>
          <div className="mt-3 max-w-[300px]">
            <div className="flex justify-between text-xs text-text2 mb-1.5">
              <span>{lvl.next ? `To ${lvl.next}` : '🏆 Max Level Reached!'}</span>
              <span>{lvl.next ? `${pts.toLocaleString()} / ${lvl.nextAt.toLocaleString()}` : ''}</span>
            </div>
            <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
              <div className="h-full bg-cyan transition-all duration-700" style={{ width: `${pct}%` }}></div>
            </div>
          </div>
        </div>
        <div className="text-center w-full md:w-auto mt-4 md:mt-0">
          <div className="font-display text-[2.8rem] font-extrabold text-yellow leading-none">{pts.toLocaleString()}</div>
          <div className="text-xs text-text2 mt-1">Total Points</div>
          <div className="text-xs text-text2 mt-1">{myReports.length} reports</div>
        </div>
      </div>

      {/* Tiers */}
      <div className="font-display text-base font-bold mb-4">Guardian Tiers</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        <div className={`bg-bg-card border-2 rounded-2xl p-6 text-center relative transition-all ${lvl.name === 'Bronze Guardian' ? 'border-yellow shadow-[0_0_20px_rgba(251,191,36,0.1)]' : 'border-border opacity-45'}`}>
          {lvl.name === 'Bronze Guardian' && <div className="absolute top-2.5 right-2.5 bg-yellow text-black text-[0.62rem] font-extrabold py-0.5 px-2 rounded-[10px]">CURRENT</div>}
          <span className="text-[2.8rem] block mb-2.5">🥉</span>
          <div className="font-display text-base font-extrabold mb-1">Bronze Guardian</div>
          <div className="text-xs text-text2 mb-3.5">0 – 999 Points</div>
          <div className="text-xs text-text2">+10 pts/report</div>
        </div>
        <div className={`bg-bg-card border-2 rounded-2xl p-6 text-center relative transition-all ${lvl.name === 'Silver Guardian' ? 'border-yellow shadow-[0_0_20px_rgba(251,191,36,0.1)]' : 'border-border opacity-45'}`}>
          {lvl.name === 'Silver Guardian' && <div className="absolute top-2.5 right-2.5 bg-yellow text-black text-[0.62rem] font-extrabold py-0.5 px-2 rounded-[10px]">CURRENT</div>}
          <span className="text-[2.8rem] block mb-2.5">🥈</span>
          <div className="font-display text-base font-extrabold mb-1">Silver Guardian</div>
          <div className="text-xs text-text2 mb-3.5">1,000 – 4,999 Points</div>
          <div className="text-xs text-text2">+15 pts/report</div>
        </div>
        <div className={`bg-bg-card border-2 rounded-2xl p-6 text-center relative transition-all ${lvl.name === 'Gold Guardian' ? 'border-yellow shadow-[0_0_20px_rgba(251,191,36,0.1)]' : 'border-border opacity-45'}`}>
          {lvl.name === 'Gold Guardian' && <div className="absolute top-2.5 right-2.5 bg-yellow text-black text-[0.62rem] font-extrabold py-0.5 px-2 rounded-[10px]">CURRENT</div>}
          <span className="text-[2.8rem] block mb-2.5">🥇</span>
          <div className="font-display text-base font-extrabold mb-1">Gold Guardian</div>
          <div className="text-xs text-text2 mb-3.5">5,000+ Points</div>
          <div className="text-xs text-text2">+25 pts/report</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Leaderboard */}
        <div>
          <div className="font-display text-base font-bold mb-4">🏅 City Leaderboard</div>
          <div className="flex flex-col gap-2">
            {loading ? (
              <div className="text-center py-10 text-text2 border border-border border-dashed rounded-xl">Loading leaderboard...</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-10 text-text2 border border-border border-dashed rounded-xl">
                <div className="text-3xl mb-2">🏆</div>
                <h3 className="font-bold text-text">No entries yet</h3>
                <p className="text-sm">Submit reports to appear here!</p>
              </div>
            ) : (
              leaderboard.map((u, i) => {
                const isMe = u.user_id === user.id || u.email === user.email;
                const uLvl = getLevel(u.points || 0);
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-[10px] border transition-all hover:translate-x-0.5 ${isMe ? 'bg-[rgba(0,212,255,0.04)] border-[rgba(0,212,255,0.15)]' : 'bg-[rgba(255,255,255,0.02)] border-border'}`}>
                    <div className={`w-7 text-center font-display font-extrabold text-[0.9rem] ${i < 3 ? 'text-yellow' : 'text-text2'}`}>{medals[i] || i + 1}</div>
                    <div className="w-[34px] h-[34px] rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center text-[1.1rem] shrink-0">{uLvl.icon}</div>
                    <div className="flex-1 text-[0.88rem] font-semibold">
                      {u.name} {isMe && <span className="text-cyan text-[0.72rem]">(You)</span>}
                      <div className="text-[0.7rem] text-text2">{uLvl.name} · {u.reports_count || 0} reports</div>
                    </div>
                    <div className="font-display font-extrabold text-base text-yellow">{(u.points || 0).toLocaleString()}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Activity & How to earn */}
        <div>
          <div className="card mb-6">
            <div className="card-title">⚡ My Recent Activity</div>
            <div className="flex flex-col gap-2">
              {loading ? (
                <div className="text-center py-4 text-text2 text-sm">Loading...</div>
              ) : myReports.length === 0 ? (
                <div className="text-center py-5 text-text2 text-[0.85rem]">No activity yet — submit your first report!</div>
              ) : (
                myReports.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-[10px] bg-[rgba(255,255,255,0.02)] border border-border">
                    <span className="text-[1.3rem]">{issueEmoji(r.issue_type)}</span>
                    <div className="flex-1">
                      <div className="text-[0.85rem] font-semibold">{(r.issue_type || '').replace('_', ' ').toUpperCase()}</div>
                      <div className="text-[0.72rem] text-text2">{timeAgo(r.created_at)} · {r.status}</div>
                    </div>
                    <div className="font-extrabold text-yellow text-[0.9rem]">+{r.points_awarded || 10}</div>
                  </div>
                ))
              )}
            </div>
            <Link to="/report" className="btn btn-primary w-full mt-4 text-center block">📸 Report an Issue</Link>
          </div>

          <div className="card">
            <div className="card-title">💰 How to Earn Points</div>
            <div className="flex flex-col">
              <div className="flex justify-between py-2 border-b border-border text-[0.82rem]"><span>📸 Valid report submitted</span><strong className="text-yellow">+10</strong></div>
              <div className="flex justify-between py-2 border-b border-border text-[0.82rem]"><span>✅ Your report resolved</span><strong className="text-yellow">+5</strong></div>
              <div className="flex justify-between py-2 border-b border-border text-[0.82rem]"><span>🚨 Critical issue report</span><strong className="text-yellow">+20</strong></div>
              <div className="flex justify-between py-2 border-b border-border text-[0.82rem]"><span>🎯 First report of day</span><strong className="text-yellow">+5</strong></div>
              <div className="flex justify-between py-2 text-[0.82rem]"><span>🔥 7-day streak</span><strong className="text-yellow">+30</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewards;
