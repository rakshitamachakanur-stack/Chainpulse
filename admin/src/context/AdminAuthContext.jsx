import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminAuthAPI } from '../services/api';
const Ctx = createContext();
export const useAdminAuth = () => useContext(Ctx);
export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('cp_admin_token');
    const stored = localStorage.getItem('cp_admin');
    if (token && stored) {
      setAdmin(JSON.parse(stored));
      adminAuthAPI.me().then(r => { setAdmin(r.data.data); localStorage.setItem('cp_admin', JSON.stringify(r.data.data)); }).catch(logout).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);
  const login = async (email, password) => {
    const r = await adminAuthAPI.login({ email, password });
    localStorage.setItem('cp_admin_token', r.data.token);
    localStorage.setItem('cp_admin', JSON.stringify(r.data.data));
    setAdmin(r.data.data); return r.data.data;
  };
  const logout = () => { localStorage.removeItem('cp_admin_token'); localStorage.removeItem('cp_admin'); setAdmin(null); };
  return <Ctx.Provider value={{ admin, loading, login, logout }}>{children}</Ctx.Provider>;
};
