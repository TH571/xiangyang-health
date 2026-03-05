import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Append /api to the base URL since all backend routes start with /api
const BASE_URL = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';

// Request timeout configuration
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Retry configuration for failed requests
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
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

// Response interceptor: unified error handling with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
      return Promise.reject(error);
    }

    // Retry logic for network errors or timeouts
    if (
      (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) &&
      !originalRequest._retry &&
      (originalRequest._retryCount || 0) < MAX_RETRIES
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      console.warn(
        `API request failed (${originalRequest._retryCount}/${MAX_RETRIES}), retrying...`,
        error.message
      );

      // Wait before retrying
      await sleep(RETRY_DELAY * originalRequest._retryCount);

      return api(originalRequest);
    }

    // Log error for debugging
    if (error.code === 'ECONNABORTED') {
      console.error('API request timeout:', error.config?.url);
    } else if (error.code === 'ERR_NETWORK') {
      console.error('API network error:', error.config?.url);
    }

    return Promise.reject(error);
  }
);

// Helper for FormData uploads (don't set Content-Type header)
// Note: Longer timeout for file uploads (30 seconds)
export const uploadApi = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
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
 * - OSS URLs (https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/...) are returned as-is
 * - Legacy /uploads paths are converted to OSS domain in production
 * @param path - The image path from database (e.g., https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/avatar/xxx.jpg or /uploads/xxx.jpg)
 * @returns Full URL for the image
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '';

  // If it's already a full URL (http/https), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // OSS domain URLs are returned directly
    if (path.includes('aliyuncs.com')) {
      return path;
    }
    // Replace 127.0.0.1 with the correct API base URL
    if (path.includes('127.0.0.1') || path.includes('localhost')) {
      // Extract the path part and rebuild with correct base URL
      const urlObj = new URL(path);
      const relativePath = urlObj.pathname;
      return `${API_BASE_URL}${relativePath}`;
    }
    return path;
  }

  // Legacy /uploads paths - convert to OSS domain in production
  if (path.startsWith('/uploads')) {
    // In production, use OSS domain
    if (API_BASE_URL && !API_BASE_URL.includes('localhost') && !API_BASE_URL.includes('127.0.0.1')) {
      // Replace /uploads with OSS domain
      const ossDomain = 'https://xyjk-data.oss-cn-hangzhou.aliyuncs.com';
      const relativePath = path.replace('/uploads', '');
      return `${ossDomain}/default${relativePath}`;
    }
    // Development: use relative path, Vite will proxy it
    return path;
  }

  // Assume it's an OSS path without domain (e.g., avatar/xxx.jpg)
  if (API_BASE_URL && !API_BASE_URL.includes('localhost') && !API_BASE_URL.includes('127.0.0.1')) {
    return `https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/${path}`;
  }

  return path;
}

/**
 * Parse API error and return user-friendly message
 */
export function getApiErrorMessage(error: any): string {
  if (error.code === 'ECONNABORTED') {
    return '请求超时，请检查网络连接或稍后重试';
  }
  if (error.code === 'ERR_NETWORK') {
    return '网络连接失败，请检查网络或稍后重试';
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.status === 404) {
    return '请求的资源不存在';
  }
  if (error.response?.status === 500) {
    return '服务器错误，请稍后重试';
  }
  return '加载失败，请稍后重试';
}

/**
 * Safe API fetch with fallback data
 * Returns fallback data if API fails
 */
export async function safeApiFetch<T>(
  apiCall: () => Promise<{ data: T }>,
  fallback: T,
  onError?: (error: any) => void
): Promise<T> {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    return fallback;
  }
}
