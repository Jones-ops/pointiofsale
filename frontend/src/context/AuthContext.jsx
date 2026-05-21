import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [setupComplete, setSetupComplete] = useState(true);
  const [loading, setLoading] = useState(true);

  const checkSetup = useCallback(async () => {
    try {
      const { data } = await api.get('/settings/status');
      setSetupComplete(data.setup_complete);
    } catch {
      setSetupComplete(true);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      api.get('/auth/me')
        .then((r) => { setUser(r.data); localStorage.setItem('user', JSON.stringify(r.data)); })
        .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); })
        .finally(() => { setLoading(false); });
      checkSetup();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    await checkSetup();
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSetupComplete(true);
  };

  const refreshSetup = () => checkSetup();

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setupComplete, refreshSetup }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
