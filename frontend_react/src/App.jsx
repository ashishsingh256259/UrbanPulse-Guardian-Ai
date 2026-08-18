import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import Heatmap from './pages/Heatmap';
import Rewards from './pages/Rewards';
import SafeRoute from './pages/SafeRoute';
import MunicipalDashboard from './pages/MunicipalDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Citizen Routes */}
        <Route element={<ProtectedRoute allowedRoles={['citizen', 'municipal']}><UserLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/heatmap" element={<Heatmap />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/saferoute" element={<SafeRoute />} />
        </Route>

        {/* Municipal Routes */}
        <Route element={<ProtectedRoute allowedRoles={['municipal']}><AdminLayout /></ProtectedRoute>}>
          <Route path="/municipal" element={<MunicipalDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
