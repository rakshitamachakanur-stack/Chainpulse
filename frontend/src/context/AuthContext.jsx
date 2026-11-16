import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cp_token');
    const stored = localStorage.getItem('cp_user');
    if (token && stored) {
      setUser(JSON.parse(stored));
      authAPI.me()
        .then(r => { setUser(r.data.data); localStorage.setItem('cp_user', JSON.stringify(r.data.data)); })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, password) => {
    const r = await authAPI.login({ email, password });
    localStorage.setItem('cp_token', r.data.token);
    localStorage.setItem('cp_user', JSON.stringify(r.data.data));
    setUser(r.data.data);
    return r.data.data;
  };

  const logout = () => {
    localStorage.removeItem('cp_token');
    localStorage.removeItem('cp_user');
    setUser(null);
  };

  const updateUser = d => { setUser(d); localStorage.setItem('cp_user', JSON.stringify(d)); };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
