import axios from 'axios';
export const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const api = axios.create({ baseURL: BASE + '/api' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = 'Bearer ' + t;
  return c;
});
api.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401 && localStorage.getItem('token')) { localStorage.clear(); location.href = '/login'; }
  return Promise.reject(e);
});
export const errMsg = (e) => e.response?.data?.error || 'Something went wrong';
export default api;
