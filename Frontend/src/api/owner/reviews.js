import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerReviewsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteOwnerReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOwnerReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerReviewsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
