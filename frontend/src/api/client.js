import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?session=expired');
      }
    }
    return Promise.reject(error);
  },
);

export function extractErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === 'string') return data;
  if (Array.isArray(data.message)) return data.message.join(', ');
  return data.message || data.error || fallback;
}

export default apiClient;
