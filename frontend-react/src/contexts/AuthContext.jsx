import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API = 'https://urbanpulse-guardian-ai.onrender.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('upg_token');
    const storedUser = localStorage.getItem('upg_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user");
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem('upg_token', newToken);
    localStorage.setItem('upg_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('upg_token');
    localStorage.removeItem('upg_user');
    setToken(null);
    setUser(null);
  };

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    
    const res = await fetch(API + endpoint, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'API Error');
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, apiCall, isMunicipal: user?.role === 'municipal' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
