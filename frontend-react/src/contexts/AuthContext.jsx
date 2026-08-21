import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('upg_token');
      const storedUser = localStorage.getItem('upg_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user");
          localStorage.removeItem('upg_token');
          localStorage.removeItem('upg_user');
        }
      }
      setLoading(false);
    };
    initAuth();
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
    const headers = {};
    const currentToken = localStorage.getItem('upg_token');
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
    const opts = { method, headers };
    if (body) {
      if (body instanceof FormData) {
        opts.body = body;
      } else {
        headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }
    
    const API = import.meta.env.VITE_API_URL || '';
    let res, data;
    try {
      res = await fetch(API + endpoint, opts);
      data = await res.json();
    } catch (e) {
      throw new Error('Unable to connect to the server. Please try again.');
    }
    
    if (res.status === 401 || res.status === 403) {
      logout();
      window.location.href = '/login?expired=true';
      throw new Error('Your session has expired. Please sign in again.');
    }
    
    if (!res.ok) throw new Error(data.message || data.detail || 'API Error');
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, apiCall, isMunicipal: user?.role === 'municipal' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
