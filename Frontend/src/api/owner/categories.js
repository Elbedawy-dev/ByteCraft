import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';

export const ownerCategoriesKeys = {
  all: ['owner', 'categories'],
  lists: () => [...ownerCategoriesKeys.all, 'list'],
  detail: (id) => [...ownerCategoriesKeys.all, 'detail', id],
};

function invalidateCategoryRelated(queryClient) {
  queryClient.invalidateQueries({ queryKey: ownerCategoriesKeys.all });
  queryClient.invalidateQueries({ queryKey: ['categories'] });
  queryClient.invalidateQueries({ queryKey: ['meta'] });
  queryClient.invalidateQueries({ queryKey: ['owner', 'projects'] });
  queryClient.invalidateQueries({ queryKey: ['projects'] });
}

export async function getOwnerCategories({ signal } = {}) {
  const { data } = await api.get('/owner/categories', { signal });
  return Array.isArray(data?.categories) ? data.categories : [];
}

export async function getOwnerCategoryById(id, { signal } = {}) {
  const { data } = await api.get(`/owner/categories/${id}`, { signal });
  return data?.category || null;
}

export async function createOwnerCategory(payload) {
  const { data } = await api.post('/owner/categories', payload);
  return data?.category || null;
}

export async function updateOwnerCategory({ id, ...payload }) {
  const { data } = await api.patch(`/owner/categories/${id}`, payload);
  return data?.category || null;
}

export async function deleteOwnerCategory(id) {
  const { data } = await api.delete(`/owner/categories/${id}`);
  return data;
}

export function useOwnerCategories(options = {}) {
  return useQuery({
    queryKey: ownerCategoriesKeys.lists(),
    queryFn: ({ signal }) => getOwnerCategories({ signal }),
    ...options,
  });
}

export function useCreateOwnerCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOwnerCategory,
    onSuccess: () => invalidateCategoryRelated(queryClient),
  });
}

export function useUpdateOwnerCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOwnerCategory,
    onSuccess: () => invalidateCategoryRelated(queryClient),
  });
}

export function useDeleteOwnerCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOwnerCategory,
    onSuccess: () => invalidateCategoryRelated(queryClient),
  });
}
