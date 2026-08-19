import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Copilot from './pages/Copilot';
import Emergency from './pages/Emergency';
import Municipal from './pages/Municipal';
import Dashboard from './pages/Dashboard';
import Heatmap from './pages/Heatmap';
import Rewards from './pages/Rewards';
import Report from './pages/Report';
import SafeRoute from './pages/SafeRoute';

function App() {
  const { loading } = useAuth();

  if (loading) return null;

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/municipal" element={<Municipal />} />
        <Route path="/copilot" element={<Copilot />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/heatmap" element={<Heatmap />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/report" element={<Report />} />
        <Route path="/saferoute" element={<SafeRoute />} />
        {/* Fallback for now */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
