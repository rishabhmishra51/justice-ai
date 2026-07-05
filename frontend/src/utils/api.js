import axios from 'axios';

const fallbackBaseURL = window.location.hostname === 'localhost'
  ? 'http://localhost:5001/api'
  : '/api';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || fallbackBaseURL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('justice_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('justice_token');
      localStorage.removeItem('justice_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
