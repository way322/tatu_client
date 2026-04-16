import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sd-production-1883.up.railway.app/api',
});

// Добавляем токен в заголовки, если он есть
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;