import axios from 'axios';

// Use env var if set, otherwise fall back to explicit localhost:5000
// This bypasses any CRA proxy issues entirely
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('cp_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

API.interceptors.response.use(
  res => res,
  err => {
    const isLoginCall = (err.config?.url || '').includes('/auth/login');
    if (err.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem('cp_token');
      localStorage.removeItem('cp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:          d => API.post('/auth/login', d),
  me:             () => API.get('/auth/me'),
  updatePassword: d  => API.put('/auth/password', d),
};
export const userAPI = {
  getAll:        () => API.get('/users'),
  updateProfile:  d  => API.put('/users/profile', d),
};
export const supplierAPI = {
  getAll:         p => API.get('/suppliers', { params: p }),
  getOne:         id => API.get(`/suppliers/${id}`),
  getScorecards:  () => API.get('/suppliers/scorecards'),
  create:         d => API.post('/suppliers', d),
  update:         (id, d) => API.put(`/suppliers/${id}`, d),
  remove:         id => API.delete(`/suppliers/${id}`),
};
export const productAPI = {
  getAll:  p => API.get('/products', { params: p }),
  getOne:  id => API.get(`/products/${id}`),
  create:  d => API.post('/products', d),
  update:  (id, d) => API.put(`/products/${id}`, d),
  remove:  id => API.delete(`/products/${id}`),
};
export const requisitionAPI = {
  getAll:      p => API.get('/requisitions', { params: p }),
  getOne:      id => API.get(`/requisitions/${id}`),
  create:      d => API.post('/requisitions', d),
  update:      (id, d) => API.put(`/requisitions/${id}`, d),
  submit:      id => API.put(`/requisitions/${id}/submit`),
  approve:     (id, d) => API.put(`/requisitions/${id}/approve`, d),
  convertToPO: (id, d) => API.post(`/requisitions/${id}/convert`, d),
  remove:      id => API.delete(`/requisitions/${id}`),
};
export const orderAPI = {
  getAll:       p => API.get('/orders', { params: p }),
  getOne:       id => API.get(`/orders/${id}`),
  create:       d => API.post('/orders', d),
  update:       (id, d) => API.put(`/orders/${id}`, d),
  updateStatus: (id, d) => API.put(`/orders/${id}/status`, d),
  remove:       id => API.delete(`/orders/${id}`),
};
export const inventoryAPI = {
  getAll:      p => API.get('/inventory', { params: p }),
  getOne:      id => API.get(`/inventory/${id}`),
  getLow:      () => API.get('/inventory/low-stock'),
  getForecast: () => API.get('/inventory/forecasting'),
  autoDraft:   d => API.post('/inventory/forecasting/auto-draft', d),
  create:      d => API.post('/inventory', d),
  update:      (id, d) => API.put(`/inventory/${id}`, d),
  adjust:      (id, d) => API.put(`/inventory/${id}/adjust`, d),
};
export const receiptAPI = {
  getAll:  p => API.get('/receipts', { params: p }),
  getOne:  id => API.get(`/receipts/${id}`),
  create:  d => API.post('/receipts', d),
  verify:  id => API.put(`/receipts/${id}/verify`),
};
export const shipmentAPI = {
  getAll:         p => API.get('/shipments', { params: p }),
  getOne:         id => API.get(`/shipments/${id}`),
  track:          tn => API.get(`/shipments/track/${tn}`),
  create:         d => API.post('/shipments', d),
  update:         (id, d) => API.put(`/shipments/${id}`, d),
  updateLocation: (id, d) => API.put(`/shipments/${id}/location`, d),
  simulateTick:   () => API.post('/shipments/simulate/tick'),
  remove:         id => API.delete(`/shipments/${id}`),
};
export const vehicleAPI = {
  getAll:  p => API.get('/vehicles', { params: p }),
  getOne:  id => API.get(`/vehicles/${id}`),
  create:  d => API.post('/vehicles', d),
  update:  (id, d) => API.put(`/vehicles/${id}`, d),
  remove:  id => API.delete(`/vehicles/${id}`),
};
export const deliveryAPI = {
  getAll:  p => API.get('/deliveries', { params: p }),
  getOne:  id => API.get(`/deliveries/${id}`),
  create:  d => API.post('/deliveries', d),
  update:  (id, d) => API.put(`/deliveries/${id}`, d),
};
export const notificationAPI = {
  getAll:      () => API.get('/notifications'),
  markRead:    id => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
};
export const analyticsAPI = {
  dashboard:    () => API.get('/analytics/dashboard'),
  askAssistant: d => API.post('/analytics/ai-assistant', d),
};

export default API;
