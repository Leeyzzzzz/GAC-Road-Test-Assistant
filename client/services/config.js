function normalizeBaseUrl(url) {
  return (url || '').trim().replace(/\/+$/, '');
}

// process.env.VITE_* is statically replaced by Vite define (via vite.config.js loadEnv).
// Works on all platforms (H5 and mp alike).
const apiBaseUrl = normalizeBaseUrl(process.env.VITE_API_BASE_URL || '');
const apiTimeout = Number(process.env.VITE_API_TIMEOUT || 10000);

export const API_BASE_URL = apiBaseUrl;
export const API_TIMEOUT = Number.isFinite(apiTimeout) && apiTimeout > 0 ? apiTimeout : 10000;

export function buildApiUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error('API path must start with "/"');
  }
  return API_BASE_URL ? API_BASE_URL + path : path;
}

export function ensureApiBaseUrl() {
  // #ifndef H5
  if (!API_BASE_URL) {
    throw new Error('未配置 VITE_API_BASE_URL，请在 client/.env 中设置当前电脑可访问的后端地址');
  }
  // #endif
}
