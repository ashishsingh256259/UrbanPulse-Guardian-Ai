import { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, CheckCircle, Clock, AlertTriangle, Search, Filter, Camera } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function MunicipalDashboard() {
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, critical: 0, resolution_rate: 0 });
  const [chartData, setChartData] = useState({ categories: [], statuses: [] });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveFile, setResolveFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartRes, reportsRes] = await Promise.all([
        api.get('/api/reports/stats/city'),
        api.get('/api/reports/stats/chart-data'),
        api.get('/api/reports')
      ]);
      
      setStats(statsRes.data);
      
      // Transform chart data for recharts
      const cData = chartRes.data.categories.labels.map((label, idx) => ({
        name: label,
        value: chartRes.data.categories.data[idx]
      }));
      const sData = chartRes.data.statuses.labels.map((label, idx) => ({
        name: label,
        value: chartRes.data.statuses.data[idx]
      }));
      
      setChartData({ categories: cData, statuses: sData });
      setReports(reportsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/api/reports/${id}/status`, { status });
      fetchDashboardData();
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport({ ...selectedReport, status });
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolveFile) return alert('Please upload a resolution proof image');
    
    setActionLoading(true);
    const data = new FormData();
    data.append('resolved_photo', resolveFile);
    data.append('status', 'resolved');

    try {
      await api.post(`/api/reports/${selectedReport.id}/resolve`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchDashboardData();
      setSelectedReport(null);
      setResolveFile(null);
    } catch (error) {
      alert('Failed to resolve report');
    } finally {
      setActionLoading(false);
    }
  };

  const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) return <div className="p-8 text-center">Loading Command Center...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="text-red-500" /> Municipal Command Center
          </h1>
          <p className="text-slate-400 mt-1">Real-time overview of city infrastructure status and pending resolutions.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-slate-800 to-slate-900 border-l-4 border-l-blue-500">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Total Reports</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="card bg-gradient-to-br from-slate-800 to-slate-900 border-l-4 border-l-warning">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Pending Actions</p>
          <p className="text-3xl font-bold text-warning">{stats.pending}</p>
        </div>
        <div className="card bg-gradient-to-br from-slate-800 to-slate-900 border-l-4 border-l-danger">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Critical Priority</p>
          <p className="text-3xl font-bold text-danger">{stats.critical}</p>
        </div>
        <div className="card bg-gradient-to-br from-slate-800 to-slate-900 border-l-4 border-l-success">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Resolution Rate</p>
          <p className="text-3xl font-bold text-success">{stats.resolution_rate}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold mb-6">Issues by Category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.categories}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => val.replace('_',' ')} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip cursor={{fill: '#334155'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
                <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-lg font-bold mb-6">Resolution Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.statuses} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.statuses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-xl font-bold">Recent Reports</h2>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search ID or Issue..." className="input-field pl-10 py-1 text-sm h-9" />
            </div>
            <button className="btn-secondary h-9 py-0 px-3 flex items-center gap-2 text-sm">
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wider bg-slate-900/50">
                <th className="p-4 pl-6">ID / Date</th>
                <th className="p-4">Issue Type</th>
                <th className="p-4">Risk Score</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="font-mono text-xs text-slate-300">{report.id.substring(report.id.length - 6).toUpperCase()}</div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(report.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4 font-medium capitalize flex items-center gap-2">
                    {report.issue_type.replace('_', ' ')}
                    {report.ai_confidence > 80 && <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary uppercase font-bold">AI Verified</span>}
                  </td>
                  <td className="p-4">
                    <span className={`font-bold px-2 py-1 rounded-full text-xs border ${report.risk_score >= 80 ? 'text-danger border-danger/30 bg-danger/10' : report.risk_score >= 50 ? 'text-warning border-warning/30 bg-warning/10' : 'text-success border-success/30 bg-success/10'}`}>
                      {report.risk_score}/100
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 max-w-[200px] truncate">
                    {report.location.address || `${report.location.coordinates[1].toFixed(4)}, ${report.location.coordinates[0].toFixed(4)}`}
                  </td>
                  <td className="p-4 capitalize">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${report.status === 'resolved' ? 'text-success bg-success/10' : report.status === 'in_progress' ? 'text-warning bg-warning/10' : 'text-slate-300 bg-slate-700'}`}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <button 
                      onClick={() => setSelectedReport(report)}
                      className="text-primary hover:text-white bg-primary/10 hover:bg-primary px-3 py-1.5 rounded transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Report #{selectedReport.id.substring(selectedReport.id.length - 8).toUpperCase()}
              </h2>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white p-2">&times; Close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Col */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Evidence</h3>
                  <img src={`http://localhost:8002${selectedReport.image_url}`} alt="Evidence" className="w-full rounded-lg border border-slate-700" />
                </div>
                
                {selectedReport.status === 'resolved' && selectedReport.resolved_image_url && (
                  <div>
                    <h3 className="text-sm font-semibold text-success uppercase tracking-wider mb-3 flex items-center gap-2"><CheckCircle size={16}/> Resolution Proof</h3>
                    <img src={`http://localhost:8002${selectedReport.resolved_image_url}`} alt="Resolution" className="w-full rounded-lg border border-success/30" />
                  </div>
                )}
                
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">AI Analysis</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Detected:</span> <span className="font-medium capitalize">{selectedReport.ai_detected.replace('_',' ')}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Confidence:</span> <span className="font-medium">{selectedReport.ai_confidence}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Risk Score:</span> <span className={`font-bold ${selectedReport.risk_score >= 80 ? 'text-danger' : 'text-warning'}`}>{selectedReport.risk_score}/100</span></div>
                  </div>
                </div>
              </div>

              {/* Right Col */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Description</p>
                      <p className="font-medium">{selectedReport.description || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="font-medium">{selectedReport.location.address || `${selectedReport.location.coordinates[1]}, ${selectedReport.location.coordinates[0]}`}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Reported By</p>
                      <p className="font-medium">{selectedReport.user_name}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Actions</h3>
                  
                  {selectedReport.status !== 'resolved' ? (
                    <div className="space-y-6">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleUpdateStatus(selectedReport.id, 'in_progress')}
                          className={`flex-1 py-2 rounded-lg font-medium border ${selectedReport.status === 'in_progress' ? 'bg-warning/20 border-warning text-warning' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                        >
                          Mark In-Progress
                        </button>
                      </div>
                      
                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <h4 className="font-medium mb-3 text-sm">Resolve Issue</h4>
                        <form onSubmit={handleResolve} className="space-y-3">
                          <input 
                            type="file" 
                            accept="image/*" 
                            required 
                            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            onChange={(e) => setResolveFile(e.target.files[0])}
                          />
                          <button type="submit" disabled={actionLoading} className="w-full btn-success bg-success hover:bg-emerald-600 text-white py-2 rounded-lg font-bold">
                            {actionLoading ? 'Uploading...' : 'Upload Proof & Resolve'}
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center text-success">
                      <CheckCircle className="mx-auto h-8 w-8 mb-2" />
                      <p className="font-bold">This issue has been resolved.</p>
                      <p className="text-sm mt-1 text-success/80">Resolved on: {new Date(selectedReport.resolved_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
