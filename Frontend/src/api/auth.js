import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './client';
import { hasSessionHint, setSessionHint } from '../lib/storage';

export const authKeys = {
  all: ['auth'],
  me: ['auth', 'me'],
};

function isProtectedAppPath() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  const isOwner = path.startsWith('/owner') && path !== '/owner/login';
  const isAccount = path === '/account' || path.startsWith('/account/');
  return isOwner || isAccount;
}

/**
 * Fetches current authenticated user via GET /api/auth/me.
 * Avoids firing unauthenticated probes on public routes when no session hint exists,
 * preventing spurious 401 browser console errors while always probing protected routes.
 */
export async function fetchAuthMe({ signal, force = false } = {}) {
  if (!force && !hasSessionHint() && !isProtectedAppPath()) {
    return null;
  }

  try {
    const { data } = await api.get('/auth/me', {
      signal,
      skipAuthRedirect: true,
    });
    const user = data?.user ?? null;
    setSessionHint(Boolean(user));
    return user;
  } catch (error) {
    if (error instanceof ApiError && (error.isUnauthorized || error.isForbidden)) {
      setSessionHint(false);
      return null;
    }
    throw error;
  }
}

export async function loginWithPassword({ email, password }) {
  const { data } = await api.post(
    '/auth/login',
    { email, password },
    { skipAuthRedirect: true }
  );
  const user = data?.user ?? null;
  setSessionHint(Boolean(user));
  return user;
}

export async function registerCustomer({ name, email, password, phone = '', locale = 'ar' }) {
  const { data } = await api.post(
    '/auth/register',
    { name, email, password, phone, locale },
    { skipAuthRedirect: true }
  );
  const user = data?.user ?? null;
  setSessionHint(Boolean(user));
  return user;
}

export async function logoutSession() {
  setSessionHint(false);
  const { data } = await api.post('/auth/logout', {}, { skipAuthRedirect: true });
  return data;
}

// Deduplicate concurrent/StrictMode verification calls per single-use token
const verifyEmailTokenCache = new Map();

export async function verifyEmailToken(token) {
  const cleanToken = String(token || '').trim();
  if (!cleanToken) {
    throw new ApiError({
      status: 400,
      code: 'INVALID_TOKEN',
      message: 'Verification token is required',
    });
  }

  if (verifyEmailTokenCache.has(cleanToken)) {
    return verifyEmailTokenCache.get(cleanToken);
  }

  const requestPromise = api
    .post('/auth/verify-email', { token: cleanToken }, { skipAuthRedirect: true })
    .then(({ data }) => data?.user ?? null)
    .catch((err) => {
      // Allow retry only on network/5xx errors; single-use INVALID_TOKEN should not re-fire automatically
      if (!(err instanceof ApiError) || err.status === 0 || err.status >= 500) {
        verifyEmailTokenCache.delete(cleanToken);
      }
      throw err;
    });

  verifyEmailTokenCache.set(cleanToken, requestPromise);
  return requestPromise;
}

export async function resendVerificationEmail({ email } = {}) {
  const payload = email ? { email: email.trim() } : {};
  const { data } = await api.post('/auth/resend-verification', payload, {
    skipAuthRedirect: true,
  });
  return data;
}

export async function requestPasswordReset({ email }) {
  const { data } = await api.post(
    '/auth/forgot-password',
    { email: email.trim() },
    { skipAuthRedirect: true }
  );
  return data;
}

export async function resetPasswordWithToken({ token, password }) {
  const { data } = await api.post(
    '/auth/reset-password',
    { token: token.trim(), password },
    { skipAuthRedirect: true }
  );
  return data;
}

export function useAuthMe(options = {}) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => fetchAuthMe({ signal }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 1;
    },
    ...options,
  });
}

export function useLoginMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: loginWithPassword,
    onSuccess: (user, variables, context) => {
      queryClient.setQueryData(authKeys.me, user);
      onSuccess?.(user, variables, context);
    },
    ...rest,
  });
}

export function useRegisterMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: registerCustomer,
    onSuccess: (user, variables, context) => {
      queryClient.setQueryData(authKeys.me, user);
      onSuccess?.(user, variables, context);
    },
    ...rest,
  });
}

export function useLogoutMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onSettled, ...rest } = options;
  return useMutation({
    mutationFn: () => logoutSession(),
    onSettled: (data, error, variables, context) => {
      // Navigate away from protected routes in the same batch before clearing auth cache
      variables?.onBeforeClear?.();
      setSessionHint(false);
      queryClient.setQueryData(authKeys.me, null);
      queryClient.removeQueries({ queryKey: ['account'] });
      queryClient.removeQueries({ queryKey: ['owner'] });
      onSettled?.(data, error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}

export function useVerifyEmail(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: verifyEmailToken,
    onSuccess: (verifiedUser, variables, context) => {
      const current = queryClient.getQueryData(authKeys.me);
      if (current && verifiedUser && String(current.id) === String(verifiedUser.id)) {
        queryClient.setQueryData(authKeys.me, verifiedUser);
      }
      onSuccess?.(verifiedUser, variables, context);
    },
    ...rest,
  });
}

export function useResendVerification(options = {}) {
  return useMutation({
    mutationFn: resendVerificationEmail,
    ...options,
  });
}

export function useForgotPassword(options = {}) {
  return useMutation({
    mutationFn: requestPasswordReset,
    ...options,
  });
}

export function useResetPassword(options = {}) {
  return useMutation({
    mutationFn: resetPasswordWithToken,
    ...options,
  });
}
