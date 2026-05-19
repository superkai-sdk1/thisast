import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  withCredentials: false,
});

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('app-store');
    if (stored) {
      try {
        const state = JSON.parse(stored) as { state?: { accessToken?: string } };
        const token = state?.state?.accessToken;
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {}
    }
  }
  return config;
});

// On 401 — clear auth and redirect to login
apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('app-store');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
