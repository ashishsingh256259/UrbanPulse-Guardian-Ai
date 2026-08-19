import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', city: 'Delhi', password: '', confirm_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        password: formData.password
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 card">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-extrabold text-white">Join UrbanPulse</h2>
          <p className="mt-2 text-sm text-slate-400">Become a Citizen Guardian</p>
        </div>
        
        {error && (
          <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
              <input type="text" name="first_name" required className="input-field" value={formData.first_name} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
              <input type="text" name="last_name" required className="input-field" value={formData.last_name} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email address</label>
            <input type="email" name="email" required className="input-field" value={formData.email} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
              <input type="tel" name="phone" className="input-field" value={formData.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
              <select name="city" className="input-field" value={formData.city} onChange={handleChange}>
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bangalore">Bangalore</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input type="password" name="password" required className="input-field" value={formData.password} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
              <input type="password" name="confirm_password" required className="input-field" value={formData.confirm_password} onChange={handleChange} />
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading} className={`w-full btn-primary flex justify-center py-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-teal-400">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
