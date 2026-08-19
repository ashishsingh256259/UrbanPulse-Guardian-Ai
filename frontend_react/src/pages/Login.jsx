import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isMunicipal = email.includes('@urbanpulse.gov');
      const res = await login(email, password, isMunicipal ? 'municipal' : 'citizen');
      if (res.user.role === 'municipal') {
        navigate('/municipal');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 card">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-extrabold text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to continue to UrbanPulse
          </p>
        </div>
        
        {error && (
          <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email address</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="citizen@example.com OR municipal@urbanpulse.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full btn-primary flex justify-center py-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-teal-400">
            Register as Citizen
          </Link>
        </p>
      </div>
    </div>
  );
}
