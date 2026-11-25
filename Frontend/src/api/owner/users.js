import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const ownerUsersKeys = {
  all: ['owner', 'users'],
  customers: (params) => ['owner', 'users', 'customers', params],
  admins: () => ['owner', 'users', 'admins'],
};

export async function fetchOwnerCustomers(params = {}, { signal } = {}) {
  const { data, meta } = await api.get('/owner/users', { params, signal });
  return {
    users: data?.users || [],
    meta: meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function updateOwnerUserStatus({ id, status }) {
  const { data } = await api.patch(`/owner/users/${encodeURIComponent(id)}`, { status });
  return data?.user ?? null;
}

export async function fetchOwnerAdmins({ signal } = {}) {
  const { data } = await api.get('/owner/admins', { signal });
  return data?.admins || [];
}

export async function createOwnerAdmin({ name, email, locale = 'ar' }) {
  const { data } = await api.post('/owner/admins', { name, email, locale });
  return data?.admin ?? null;
}

export async function deleteOwnerAdmin(id) {
  const { data } = await api.delete(`/owner/admins/${encodeURIComponent(id)}`);
  return data;
}

export function useOwnerCustomers(params = {}, options = {}) {
  return useQuery({
    queryKey: ownerUsersKeys.customers(params),
    queryFn: ({ signal }) => fetchOwnerCustomers(params, { signal }),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useUpdateOwnerUserStatus(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: updateOwnerUserStatus,
    onSuccess: (user, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ownerUsersKeys.all });
      onSuccess?.(user, variables, context);
    },
    ...rest,
  });
}

export function useOwnerAdmins(options = {}) {
  return useQuery({
    queryKey: ownerUsersKeys.admins(),
    queryFn: ({ signal }) => fetchOwnerAdmins({ signal }),
    ...options,
  });
}

export function useCreateOwnerAdmin(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: createOwnerAdmin,
    onSuccess: (admin, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ownerUsersKeys.admins() });
      onSuccess?.(admin, variables, context);
    },
    ...rest,
  });
}

export function useDeleteOwnerAdmin(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: deleteOwnerAdmin,
    onSuccess: (res, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ownerUsersKeys.admins() });
      onSuccess?.(res, variables, context);
    },
    ...rest,
  });
}
