import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('amigmi_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  error => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      localStorage.removeItem('amigmi_token');
    }
    return Promise.reject(error);
  }
);

export function hasToken(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem('amigmi_token');
}

export default api;
