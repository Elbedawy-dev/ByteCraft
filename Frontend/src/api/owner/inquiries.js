import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const ownerInquiriesKeys = {
  all: ['owner', 'inquiries'],
  lists: () => [...ownerInquiriesKeys.all, 'list'],
  list: (params) => [...ownerInquiriesKeys.lists(), params],
  details: () => [...ownerInquiriesKeys.all, 'detail'],
  detail: (id) => [...ownerInquiriesKeys.details(), id],
};

function invalidateDashboardQueries(queryClient) {
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey.some(
        (part) => typeof part === 'string' && part.toLowerCase().includes('dashboard')
      ),
  });
}

export async function getOwnerInquiries(params = {}, { signal } = {}) {
  const { data, meta } = await api.get('/owner/inquiries', {
    params,
    signal,
  });
  return {
    inquiries: data?.inquiries || [],
    meta: meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function getOwnerInquiryById(id, { signal } = {}) {
  const { data } = await api.get(`/owner/inquiries/${id}`, { signal });
  return data?.inquiry || null;
}

export async function updateOwnerInquiry({ id, status, ownerNotes }) {
  const body = {};
  if (status !== undefined) body.status = status;
  if (ownerNotes !== undefined) body.ownerNotes = ownerNotes;
  const { data } = await api.patch(`/owner/inquiries/${id}`, body);
  return data?.inquiry || null;
}

export async function deleteOwnerInquiry(id) {
  const { data } = await api.delete(`/owner/inquiries/${id}`);
  return data;
}

export function useOwnerInquiries(params = {}, options = {}) {
  return useQuery({
    queryKey: ownerInquiriesKeys.list(params),
    queryFn: ({ signal }) => getOwnerInquiries(params, { signal }),
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

export function useOwnerInquiry(id, options = {}) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ownerInquiriesKeys.detail(id),
    queryFn: async ({ signal }) => {
      const inquiry = await getOwnerInquiryById(id, { signal });
      // GET /owner/inquiries/:id automatically transitions status 'new' -> 'read'
      // Refresh list and dashboard counters so unread highlight & counters stay in sync
      queryClient.invalidateQueries({ queryKey: ownerInquiriesKeys.lists() });
      invalidateDashboardQueries(queryClient);
      return inquiry;
    },
    enabled: Boolean(id),
    staleTime: 0,
    ...options,
  });
}

export function useUpdateOwnerInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOwnerInquiry,
    onSuccess: (updatedInquiry, { id }) => {
      if (updatedInquiry) {
        queryClient.setQueryData(ownerInquiriesKeys.detail(id), (prev) =>
          prev
            ? {
                ...prev,
                ...updatedInquiry,
                project: prev.project || updatedInquiry.project,
                servicePlan: prev.servicePlan || updatedInquiry.servicePlan,
              }
            : updatedInquiry
        );
      }
      queryClient.invalidateQueries({ queryKey: ownerInquiriesKeys.all });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useDeleteOwnerInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOwnerInquiry,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ownerInquiriesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ownerInquiriesKeys.all });
      invalidateDashboardQueries(queryClient);
    },
  });
}
