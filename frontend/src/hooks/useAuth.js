import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('justice_token');
    const saved = localStorage.getItem('justice_user');
    if (token && saved) {
      setUser(JSON.parse(saved));
      api.get('/auth/me').then(r => {
        setUser(r.data.user);
        localStorage.setItem('justice_user', JSON.stringify(r.data.user));
      }).catch(() => {
        localStorage.removeItem('justice_token');
        localStorage.removeItem('justice_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('justice_token', data.token);
    localStorage.setItem('justice_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, role) => {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    localStorage.setItem('justice_token', data.token);
    localStorage.setItem('justice_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('justice_token');
    localStorage.removeItem('justice_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
