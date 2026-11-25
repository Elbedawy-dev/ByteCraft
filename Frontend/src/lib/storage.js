export const STORAGE_KEYS = {
  LANG: 'bc_lang',
  THEME: 'bc_theme_v3',
  ORDER_TOKEN_PREFIX: 'bc_order_token_',
  SESSION_HINT: 'bc_session_hint',
};

export function getLocal(key, fallback = null) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function setLocal(key, value) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

export function removeLocal(key) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function hasSessionHint() {
  return (
    getLocal(STORAGE_KEYS.SESSION_HINT, null) === '1' ||
    getLocal('bc_owner_session', null) === '1'
  );
}

export function setSessionHint(active) {
  if (active) {
    setLocal(STORAGE_KEYS.SESSION_HINT, '1');
  } else {
    removeLocal(STORAGE_KEYS.SESSION_HINT);
    removeLocal('bc_owner_session');
  }
}

export function getSession(key, fallback = null) {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return fallback;
    const value = window.sessionStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function setSession(key, value) {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return false;
    window.sessionStorage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

export function removeSession(key) {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return false;
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function orderTokenKey(orderNumber) {
  return `${STORAGE_KEYS.ORDER_TOKEN_PREFIX}${orderNumber}`;
}

export function getOrderToken(orderNumber) {
  if (!orderNumber) return null;
  return getSession(orderTokenKey(orderNumber), null);
}

export function setOrderToken(orderNumber, token) {
  if (!orderNumber || !token) return false;
  return setSession(orderTokenKey(orderNumber), token);
}

export function removeOrderToken(orderNumber) {
  if (!orderNumber) return false;
  return removeSession(orderTokenKey(orderNumber));
}
