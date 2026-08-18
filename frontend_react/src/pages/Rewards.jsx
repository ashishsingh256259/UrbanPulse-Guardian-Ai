import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, Star, Target } from 'lucide-react';

export default function Rewards() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/api/reports/leaderboard');
      setLeaders(res.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (index) => {
    switch(index) {
      case 0: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 1: return 'text-slate-300 bg-slate-300/10 border-slate-300/20';
      case 2: return 'text-amber-600 bg-amber-600/10 border-amber-600/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="text-primary" /> Guardian Rewards
        </h1>
        <p className="text-slate-400 mt-2">Earn points for reporting issues and keeping your city safe. Compete on the leaderboard!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-card to-slate-900">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Star className="text-primary w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold">{user?.points}</h2>
          <p className="text-slate-400">Total Points</p>
        </div>
        
        <div className="card flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-card to-slate-900">
          <div className="w-24 h-24 rounded-full bg-warning/20 flex items-center justify-center mb-4">
            <Medal className="text-warning w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-warning">{user?.level}</h2>
          <p className="text-slate-400">Current Rank</p>
        </div>

        <div className="card flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-card to-slate-900">
          <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-4">
            <Target className="text-success w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-success">{user?.reports_count}</h2>
          <p className="text-slate-400">Valid Reports</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-xl font-bold">City Leaderboard (Top 20)</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading leaderboard...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-sm text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Rank</th>
                  <th className="p-4">Guardian</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Reports</th>
                  <th className="p-4 text-right pr-6">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {leaders.map((leader, idx) => (
                  <tr key={leader.user_id} className={`hover:bg-slate-800/30 transition-colors ${leader.user_id === user?.id ? 'bg-primary/5' : ''}`}>
                    <td className="p-4 pl-6">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border ${getRankStyle(idx)}`}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="p-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                        {leader.name.charAt(0)}
                      </div>
                      {leader.name} {leader.user_id === user?.id && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded ml-2">You</span>}
                    </td>
                    <td className="p-4 text-slate-400">{leader.city || 'Delhi'}</td>
                    <td className="p-4 text-slate-400">{leader.reports_count}</td>
                    <td className="p-4 text-right pr-6 font-bold text-primary">{leader.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
