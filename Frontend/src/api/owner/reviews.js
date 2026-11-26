import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { homeKeys } from '../home';
import { projectDetailsKeys } from '../projectDetails';
import { ownerDashboardKeys } from './dashboard';

export const ownerReviewsKeys = {
  all: ['owner', 'reviews'],
  lists: () => [...ownerReviewsKeys.all, 'list'],
  list: (params) => [...ownerReviewsKeys.lists(), params],
};

export async function getOwnerReviews(params = {}, { signal } = {}) {
  const { data, meta } = await api.get('/owner/reviews', {
    params,
    signal,
  });
  return {
    reviews: data?.reviews || [],
    meta: meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function moderateOwnerReview({ id, isPublished, ownerResponse }) {
  const body = {};
  if (typeof isPublished === 'boolean') body.isPublished = isPublished;
  if (ownerResponse !== undefined) body.ownerResponse = ownerResponse;
  const { data } = await api.patch(`/owner/reviews/${id}`, body);
  return data?.review || null;
}

export async function deleteOwnerReview(id) {
  const { data } = await api.delete(`/owner/reviews/${id}`);
  return data;
}

export function useOwnerReviews(params = {}, options = {}) {
  return useQuery({
    queryKey: ownerReviewsKeys.list(params),
    queryFn: ({ signal }) => getOwnerReviews(params, { signal }),
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

export function useModerateOwnerReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moderateOwnerReview,
    onSuccess: (_data, variables) => {
      if (typeof variables?.isPublished === 'boolean') {
        const delta = variables.isPublished ? -1 : 1;
        queryClient.setQueryData(ownerDashboardKeys.overview(), (prev) => {
          if (!prev?.totals || typeof prev.totals.pendingReviews !== 'number') return prev;
          return {
            ...prev,
            totals: {
              ...prev.totals,
              pendingReviews: Math.max(0, prev.totals.pendingReviews + delta),
            },
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ownerReviewsKeys.all });
      queryClient.invalidateQueries({ queryKey: ownerDashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: projectDetailsKeys.all });
      queryClient.invalidateQueries({ queryKey: homeKeys.all });
    },
  });
}

export function useDeleteOwnerReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOwnerReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerReviewsKeys.all });
      queryClient.invalidateQueries({ queryKey: ownerDashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: projectDetailsKeys.all });
      queryClient.invalidateQueries({ queryKey: homeKeys.all });
    },
  });
}
