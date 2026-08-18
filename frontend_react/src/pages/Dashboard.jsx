import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const res = await api.get('/api/reports/my-reports');
      setReports(res.data);
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'resolved') return 'text-success bg-success/10 border-success/20';
    if (status === 'in_progress') return 'text-warning bg-warning/10 border-warning/20';
    return 'text-primary bg-primary/10 border-primary/20';
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'text-danger';
    if (score >= 50) return 'text-warning';
    return 'text-success';
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Activity className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="text-slate-400 mt-1">Here is the status of your reported issues.</p>
        </div>
        <Link to="/report" className="btn-primary flex items-center space-x-2">
          <AlertTriangle size={18} />
          <span>Report New Issue</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Activity className="text-primary w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Reports</p>
            <p className="text-2xl font-bold">{user?.reports_count}</p>
          </div>
        </div>
        <div className="card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="text-success w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Resolved Issues</p>
            <p className="text-2xl font-bold">{user?.resolved_count}</p>
          </div>
        </div>
        <div className="card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
            <Clock className="text-warning w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Pending Actions</p>
            <p className="text-2xl font-bold">{user?.reports_count - user?.resolved_count}</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Your Recent Reports</h2>
      
      {reports.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No reports yet</h3>
          <p className="text-slate-400 mb-6">You haven't reported any civic issues yet.</p>
          <Link to="/report" className="btn-primary">Make Your First Report</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="card p-0 overflow-hidden flex flex-col hover:border-primary/30 transition-colors">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={`http://localhost:8002${report.image_url}`} 
                  alt={report.issue_type} 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image' }}
                />
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(report.status)} backdrop-blur-md`}>
                  {report.status.replace('_', ' ')}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg capitalize">{report.issue_type.replace('_', ' ')}</h3>
                  <span className={`font-bold ${getRiskColor(report.risk_score)}`}>{report.risk_score}/100 Risk</span>
                </div>
                <p className="text-sm text-slate-400 mb-4 flex-1 line-clamp-2">{report.description || 'No description provided'}</p>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-auto pt-4 border-t border-slate-700/50">
                  <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  <span className="text-primary font-medium">+{report.points_awarded} Points</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
