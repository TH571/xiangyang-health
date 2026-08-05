import { useState, useEffect, useCallback } from 'react';

const CACHE_PREFIX = 'xiangyang_cache_';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟过期

interface CacheData<T> {
  data: T;
  timestamp: number;
}

/**
 * SessionStorage 缓存 Hook
 * - Cache-First 策略：有缓存则不请求，缓存过期才请求
 * - 缓存时间：30分钟
 */
export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    expiry?: number;
    enabled?: boolean;
  } = {}
) {
  const { expiry = CACHE_EXPIRY, enabled = true } = options;
  const cacheKey = `${CACHE_PREFIX}${key}`;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 从 sessionStorage 读取缓存
  const readCache = useCallback((): T | null => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data: cachedData, timestamp }: CacheData<T> = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < expiry) {
          return cachedData;
        }
        // 过期则删除
        sessionStorage.removeItem(cacheKey);
      }
    } catch (e) {
      console.error('Cache read error:', e);
    }
    return null;
  }, [cacheKey, expiry]);

  // 写入缓存
  const writeCache = useCallback(( newData: T) => {
    try {
      const cacheData: CacheData<T> = {
        data: newData,
        timestamp: Date.now()
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Cache write error:', e);
    }
  }, [cacheKey]);

  // 清除缓存
  const clearCache = useCallback(() => {
    sessionStorage.removeItem(cacheKey);
  }, [cacheKey]);

  // 刷新数据
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const freshData = await fetchFn();
      setData(freshData);
      writeCache(freshData);
      return freshData;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn, writeCache]);

  // 检查全局刷新标记
  const shouldRevalidate = () => {
    try {
      return sessionStorage.getItem(`${CACHE_PREFIX}_revalidate`) === 'true';
    } catch { return false; }
  };

  // 清除全局刷新标记
  const clearRevalidateFlag = () => {
    try { sessionStorage.removeItem(`${CACHE_PREFIX}_revalidate`); } catch { /* ignore */ }
  };

  // 初始加载 - Cache-First 策略，但有全局刷新标记时强制请求
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      // 检查是否有全局刷新标记
      const forceRefresh = shouldRevalidate();

      // 先读取缓存（有刷新标记时跳过缓存）
      const cached = !forceRefresh ? readCache() : null;

      // 有缓存：直接使用，不发请求
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      // 无缓存或强制刷新：发起请求
      try {
        const freshData = await fetchFn();
        setData(freshData);
        writeCache(freshData);
      } catch (err) {
        setError(err as Error);
        console.error('Data fetch error:', err);
      } finally {
        clearRevalidateFlag();
        setLoading(false);
      }
    };

    loadData();
  }, [enabled, fetchFn, readCache, writeCache]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache
  };
}

/**
 * 清除所有缓存（用于数据更新后）
 * 同时设置全局刷新标记，下次页面加载时会强制请求最新数据
 */
export function clearAllCache() {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  });
  // 设置全局刷新标记，防止页面切换时读到旧缓存
  try { sessionStorage.setItem(`${CACHE_PREFIX}_revalidate`, 'true'); } catch { /* ignore */ }
}

/**
 * 清除特定 key 的缓存
 */
export function clearCacheByKey(key: string) {
  sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
}
