import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';

export const ownerProjectsKeys = {
  all: ['owner', 'projects'],
  lists: () => [...ownerProjectsKeys.all, 'list'],
  list: (params = {}) => [...ownerProjectsKeys.lists(), params],
  details: () => [...ownerProjectsKeys.all, 'detail'],
  detail: (id) => [...ownerProjectsKeys.details(), id],
};

function cleanOwnerProjectParams(params = {}) {
  const cleaned = {};
  if (typeof params.status === 'string' && params.status.trim()) {
    cleaned.status = params.status.trim();
  }
  if (typeof params.category === 'string' && params.category.trim()) {
    cleaned.category = params.category.trim();
  }
  if (typeof params.search === 'string' && params.search.trim()) {
    cleaned.search = params.search.trim();
  }
  const page = Number(params.page);
  cleaned.page = Number.isInteger(page) && page >= 1 ? page : 1;
  const limit = Number(params.limit);
  cleaned.limit = Number.isInteger(limit) && limit >= 1 && limit <= 50 ? limit : 10;
  return cleaned;
}

function invalidateProjectRelated(queryClient, id) {
  queryClient.invalidateQueries({ queryKey: ownerProjectsKeys.all });
  if (id) {
    queryClient.invalidateQueries({ queryKey: ownerProjectsKeys.detail(id) });
  }
  queryClient.invalidateQueries({ queryKey: ['projects'] });
  queryClient.invalidateQueries({ queryKey: ['project'] });
  queryClient.invalidateQueries({ queryKey: ['home'] });
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey.some(
        (part) => typeof part === 'string' && part.toLowerCase().includes('dashboard')
      ),
  });
}

export async function getOwnerProjects(params = {}, { signal } = {}) {
  const queryParams = cleanOwnerProjectParams(params);
  const { data, meta } = await api.get('/owner/projects', {
    params: queryParams,
    signal,
  });

  return {
    projects: Array.isArray(data?.projects) ? data.projects : [],
    meta: meta || {
      page: queryParams.page,
      limit: queryParams.limit,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function getOwnerProjectById(id, { signal } = {}) {
  const { data } = await api.get(`/owner/projects/${id}`, { signal });
  return data?.project || null;
}

export async function createOwnerProject(payload) {
  const { data } = await api.post('/owner/projects', payload);
  return data?.project || null;
}

export async function updateOwnerProject({ id, ...payload }) {
  const { data } = await api.patch(`/owner/projects/${id}`, payload);
  return data?.project || null;
}

export async function updateOwnerProjectStatus({ id, status }) {
  const { data } = await api.patch(`/owner/projects/${id}/status`, { status });
  return data?.project || null;
}

export async function deleteOwnerProject(id) {
  const { data } = await api.delete(`/owner/projects/${id}`);
  return data;
}

export function useOwnerProjects(params = {}, options = {}) {
  const cleaned = cleanOwnerProjectParams(params);
  return useQuery({
    queryKey: ownerProjectsKeys.list(cleaned),
    queryFn: ({ signal }) => getOwnerProjects(cleaned, { signal }),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useOwnerProject(id, options = {}) {
  return useQuery({
    queryKey: ownerProjectsKeys.detail(id),
    queryFn: ({ signal }) => getOwnerProjectById(id, { signal }),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateOwnerProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOwnerProject,
    onSuccess: () => invalidateProjectRelated(queryClient),
  });
}

export function useUpdateOwnerProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOwnerProject,
    onSuccess: (_data, vars) => invalidateProjectRelated(queryClient, vars?.id),
  });
}

export function useUpdateOwnerProjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOwnerProjectStatus,
    onSuccess: (_data, vars) => invalidateProjectRelated(queryClient, vars?.id),
  });
}

export function useDeleteOwnerProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOwnerProject,
    onSuccess: (_data, id) => invalidateProjectRelated(queryClient, id),
  });
}
