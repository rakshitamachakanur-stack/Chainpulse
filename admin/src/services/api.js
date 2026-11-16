import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('cp_admin_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

API.interceptors.response.use(
  res => res,
  err => {
    const isLoginCall = (err.config?.url || '').includes('/auth/admin/login');
    if (err.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem('cp_admin_token');
      localStorage.removeItem('cp_admin');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const adminAuthAPI = {
  login: d => API.post('/auth/admin/login', d),
  me:    () => API.get('/auth/admin/me'),
};

export const adminAPI = {
  getStats:    () => API.get('/admin/stats'),
  getActivity: () => API.get('/admin/activity'),
  getUsers:    p  => API.get('/admin/users', { params: p }),
  createUser:  d  => API.post('/admin/users', d),
  updateUser:  (id, d) => API.put(`/admin/users/${id}`, d),
  toggleUser:  id => API.put(`/admin/users/${id}/toggle`),
  deleteUser:  id => API.delete(`/admin/users/${id}`),
  getAdmins:   () => API.get('/admin/admins'),
  createAdmin: d  => API.post('/admin/admins', d),
  getOrders:   p  => API.get('/admin/orders', { params: p }),
};

export default API;
