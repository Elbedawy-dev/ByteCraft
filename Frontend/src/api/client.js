import i18n from '../i18n';
import { getSafeRedirectPath, loginPath, ROUTES } from '../config/routes';
import { setSessionHint } from '../lib/storage';

const RAW_API_ORIGIN = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

let unauthorizedListener = null;

export function registerUnauthorizedHandler(listener) {
  unauthorizedListener = typeof listener === 'function' ? listener : null;
  return () => {
    if (unauthorizedListener === listener) {
      unauthorizedListener = null;
    }
  };
}

export function handleGlobalUnauthorized() {
  setSessionHint(false);
  if (unauthorizedListener) {
    try {
      unauthorizedListener();
    } catch {
      // Ignore cleanup errors during redirect
    }
  }

  if (typeof window === 'undefined') return;
  const currentPath = window.location.pathname;
  if (currentPath === ROUTES.LOGIN || currentPath === ROUTES.OWNER_LOGIN) return;

  const target = getSafeRedirectPath(`${currentPath}${window.location.search}`, null);
  window.location.assign(loginPath(target));
}

export class ApiError extends Error {
  constructor({ status = 0, code = 'UNKNOWN_ERROR', message = '', details = [] } = {}) {
    super(message || code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = Array.isArray(details) ? details : [];
    this.isRateLimited = status === 429 || code === 'TOO_MANY_REQUESTS';
    this.isUnauthorized = status === 401 || code === 'UNAUTHORIZED';
    this.isForbidden = status === 403 || code === 'FORBIDDEN';
    this.isLocked = status === 423 || code === 'ACCOUNT_LOCKED';
  }
}

function normalizePath(path) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (clean.startsWith('/api/') || clean === '/api') {
    return clean;
  }
  return `/api${clean}`;
}

export function buildApiUrl(path, params) {
  const apiPath = normalizePath(path);
  let url;

  if (RAW_API_ORIGIN) {
    // Support both VITE_API_URL=https://api.example.com and VITE_API_URL=https://api.example.com/api
    if (RAW_API_ORIGIN.endsWith('/api') && apiPath.startsWith('/api')) {
      url = `${RAW_API_ORIGIN}${apiPath.slice(4)}`;
    } else {
      url = `${RAW_API_ORIGIN}${apiPath}`;
    }
  } else {
    url = apiPath;
  }

  if (params && typeof params === 'object') {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        if (value.length > 0) searchParams.set(key, value.join(','));
      } else {
        searchParams.set(key, String(value));
      }
    }
    const query = searchParams.toString();
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query;
    }
  }

  return url;
}

const AUTH_EXEMPT_401_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/owner/login',
]);

/**
 * Unified API request helper.
 * - Sends cookies (`credentials: 'include'`)
 * - Supports JSON and FormData payloads
 * - Unwraps `{ success, data, meta }` into `{ data, meta }`
 * - Throws `ApiError` on failure
 * - Clears session and redirects to `/login?redirect=<current path>` on 401
 */
export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    params,
    headers: customHeaders = {},
    signal,
    skipAuthRedirect = false,
  } = options;

  const apiPath = normalizePath(path);
  const url = buildApiUrl(apiPath, params);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers = {
    Accept: 'application/json',
    ...customHeaders,
  };

  let requestBody;
  if (body !== undefined && body !== null) {
    if (isFormData) {
      requestBody = body;
    } else if (typeof body === 'string') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      requestBody = body;
    } else {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: requestBody,
      credentials: 'include',
      signal,
    });
  } catch (networkErr) {
    if (networkErr?.name === 'AbortError') {
      throw networkErr;
    }
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: i18n.t('common:errors.network'),
    });
  }

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok || (payload && payload.success === false)) {
    const errObj = payload?.error || {};
    const status = response.status;
    const code =
      errObj.code ||
      (status === 429
        ? 'TOO_MANY_REQUESTS'
        : status === 423
          ? 'ACCOUNT_LOCKED'
          : status === 401
            ? 'UNAUTHORIZED'
            : status === 403
              ? 'FORBIDDEN'
              : status === 404
                ? 'NOT_FOUND'
                : 'INTERNAL_ERROR');

    const message =
      status === 429
        ? i18n.t('common:errors.rateLimited')
        : errObj.message || i18n.t(`common:errors.codes.${code}`, { defaultValue: i18n.t('common:errors.generic') });

    const apiError = new ApiError({
      status,
      code,
      message,
      details: errObj.details || [],
    });

    if (status === 401 && !skipAuthRedirect && !AUTH_EXEMPT_401_PATHS.has(apiPath)) {
      handleGlobalUnauthorized();
    }

    throw apiError;
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return {
      data: payload.data,
      meta: payload.meta ?? null,
    };
  }

  return { data: payload, meta: null };
}

export const api = {
  get: (path, options = {}) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => apiRequest(path, { ...options, method: 'POST', body }),
  patch: (path, body, options = {}) => apiRequest(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options = {}) => apiRequest(path, { ...options, method: 'PUT', body }),
  delete: (path, options = {}) => apiRequest(path, { ...options, method: 'DELETE' }),
};

/**
 * Maps `ApiError.details` (`[{ field, message }]`) directly onto react-hook-form `setError`.
 * Returns `true` if at least one field error was applied.
 */
export function applyApiErrorsToForm(error, setError, { fieldMap = {} } = {}) {
  if (!error || !Array.isArray(error.details) || error.details.length === 0 || typeof setError !== 'function') {
    return false;
  }

  let mapped = false;
  for (const detail of error.details) {
    if (!detail?.field) continue;
    const targetField = fieldMap[detail.field] || detail.field;
    setError(targetField, {
      type: 'server',
      message: detail.message || i18n.t('common:errors.validationFailed'),
    });
    mapped = true;
  }
  return mapped;
}

/**
 * Returns a localized, user-friendly message for any ApiError or JS Error.
 */
export function getApiErrorMessage(error, translate = i18n.t.bind(i18n)) {
  if (!error) return translate('common:errors.generic');
  if (error instanceof ApiError) {
    if (error.isRateLimited) return translate('common:errors.rateLimited');
    if (error.code === 'NETWORK_ERROR') return translate('common:errors.network');
    const codeKey = `common:errors.codes.${error.code}`;
    const translated = translate(codeKey, { defaultValue: '' });
    if (translated) return translated;
    return error.message || translate('common:errors.generic');
  }
  return error.message || translate('common:errors.generic');
}

export default api;
