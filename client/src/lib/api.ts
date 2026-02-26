import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Append /api to the base URL since all backend routes start with /api
const BASE_URL = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: automatically add Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: unified error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Helper for FormData uploads (don't set Content-Type header)
export const uploadApi = axios.create({
  baseURL: BASE_URL,
});

uploadApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

uploadApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Convert image path to full URL
 * - In development: uses /uploads path (proxied by Vite)
 * - In production: uses full backend URL
 * @param path - The image path from database (e.g., /uploads/xxx.jpg)
 * @returns Full URL for the image
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '';

  // If it's already a full URL (http/https), return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // In development (no API_BASE_URL or localhost), use relative path for Vite proxy
  // In production, use full backend URL
  if (path.startsWith('/uploads')) {
    // Check if we're in production (API_BASE_URL is set and not localhost)
    if (API_BASE_URL && !API_BASE_URL.includes('localhost') && !API_BASE_URL.includes('127.0.0.1')) {
      return `${API_BASE_URL}${path}`;
    }
    // Development: use relative path, Vite will proxy it
    return path;
  }

  return path;
}
