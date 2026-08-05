import axios from 'axios';
import { OSS_BASE_URL } from './config';

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

/**
 * Convert image path to full URL
 * - OSS URLs (https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/...) are returned as-is
 * - Legacy /uploads paths are converted to OSS domain in production
 * @param path - The image path from database (e.g., https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/avatar/xxx.jpg or /uploads/xxx.jpg)
 * @returns Full URL for the image
 */
/**
 * 浏览器直传 OSS：获取签名 URL 后直接 PUT 上传
 * 不走 Vercel 函数中转，避免跨洲超时
 */

/** 图片压缩：最大宽度 1024px，转 JPEG 质量 0.85 */
async function compressImage(file: File, maxWidth: number = 1024): Promise<{ blob: Blob; name: string }> {
  // 跳过 GIF（保持动画）和非图片
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return { blob: file, name: file.name };
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      canvas.toBlob(blob => {
        if (blob) resolve({ blob, name: newName });
        else reject(new Error('图片压缩失败'));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片加载失败')); };
    img.src = url;
  });
}

export async function uploadFileDirect(file: File, type: string = "default"): Promise<string> {
  // 压缩图片
  const { blob, name } = await compressImage(file, 1024);
  const uploadFile = new File([blob], name, { type: 'image/jpeg' });

  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${BASE_URL}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ filename: uploadFile.name, type, mimeType: uploadFile.type || undefined }),
  });
  const data = await res.json();
  if (!data.uploadUrl) throw new Error((data.error || '获取上传链接失败') + ' (1)');

  // 尝试方案A：fetch 直传 OSS（CORS 可能被旁路由拦截）
  try {
    const uploadRes = await fetch(data.uploadUrl, {
      method: 'PUT', body: uploadFile,
      headers: { 'Content-Type': data.contentType },
    });
    if (uploadRes.ok) return data.publicUrl;
  } catch (e) {
    console.warn('直传 OSS 失败，切换到 Vercel 中转:', e);
  }

  // 方案B：通过 Vercel 函数中转
  const formData = new FormData();
  formData.append('file', uploadFile);
  const token2 = localStorage.getItem('admin_token');
  const vercelRes = await fetch(`${BASE_URL}/upload?type=${type}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token2}` },
    body: formData,
  });
  const vercelData = await vercelRes.json();
  if (!vercelData.url) throw new Error(vercelData.error || 'OSS 上传失败 (2)');
  return vercelData.url;
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path || path === 'undefined' || path === 'null') return '';

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
      const relativePath = path.replace('/uploads', '');
      return `${OSS_BASE_URL}/default${relativePath}`;
    }
    // Development: use relative path, Vite will proxy it
    return path;
  }

  // Assume it's an OSS path without domain (e.g., avatar/xxx.jpg)
  if (API_BASE_URL && !API_BASE_URL.includes('localhost') && !API_BASE_URL.includes('127.0.0.1')) {
    return `${OSS_BASE_URL}/${path}`;
  }

  return path;
}

/**
 * 生成缩略图 URL（阿里云 OSS 图片处理，按需缩放+降质）。
 * 仅对 OSS 域名下的图片生效；其他来源返回原图，不影响功能。
 * 用于卡片/列表等小尺寸展示，大幅减少加载体积。
 */
export function getImageThumb(path: string | null | undefined, width: number): string {
  const url = getImageUrl(path);
  if (!url || !url.includes('aliyuncs.com')) return url;
  return `${url}?x-oss-process=image/resize,w_${width},quality_80`;
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
