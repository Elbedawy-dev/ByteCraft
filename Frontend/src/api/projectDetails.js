import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from './client';
import { getSession, setSession } from '../lib/storage';

const viewedPreviewSlugsInMemory = new Set();

export const projectDetailsKeys = {
  all: ['projectDetails'],
  detail: (slug) => ['projectDetails', 'detail', (slug || '').toLowerCase()],
  reviews: (slug, params) => ['projectDetails', 'reviews', (slug || '').toLowerCase(), params],
  related: (categoryKey, excludeSlug) => [
    'projectDetails',
    'related',
    (categoryKey || '').toLowerCase(),
    (excludeSlug || '').toLowerCase(),
  ],
};

export async function fetchProjectBySlug(slug, { signal } = {}) {
  const cleanSlug = String(slug || '').trim();
  const { data } = await api.get(`/projects/${encodeURIComponent(cleanSlug)}`, { signal });
  return data?.project || null;
}

export async function fetchProjectReviews(slug, { page = 1, limit = 5, signal } = {}) {
  const cleanSlug = String(slug || '').trim().toLowerCase();
  const { data, meta } = await api.get(`/projects/${encodeURIComponent(cleanSlug)}/reviews`, {
    params: { page, limit },
    signal,
  });
  return {
    reviews: data?.reviews || [],
    meta: meta || { page, limit, total: 0, totalPages: 1 },
  };
}

export async function fetchRelatedProjects({ categoryKey, limit = 4, signal } = {}) {
  if (!categoryKey) return [];
  const { data } = await api.get('/projects', {
    params: { category: categoryKey, limit },
    signal,
  });
  return data?.projects || [];
}

/**
 * Records a live preview view once per browser session per project slug.
 * Fire-and-forget: never blocks opening the live preview modal or external tab.
 */
export function recordPreviewViewOnce(slug) {
  const cleanSlug = String(slug || '').trim().toLowerCase();
  if (!cleanSlug) return;

  const sessionKey = `bc_preview_viewed_${cleanSlug}`;
  if (viewedPreviewSlugsInMemory.has(cleanSlug) || getSession(sessionKey) === '1') {
    return;
  }

  viewedPreviewSlugsInMemory.add(cleanSlug);
  setSession(sessionKey, '1');

  api.post(`/projects/${encodeURIComponent(cleanSlug)}/preview-view`).catch(() => {
    // Deliberately swallow rate-limit or transient errors on fire-and-forget view counter
  });
}

export function useProjectDetails(slug, options = {}) {
  return useQuery({
    queryKey: projectDetailsKeys.detail(slug),
    queryFn: ({ signal }) => fetchProjectBySlug(slug, { signal }),
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useProjectReviews(slug, { page = 1, limit = 5 } = {}, options = {}) {
  return useQuery({
    queryKey: projectDetailsKeys.reviews(slug, { page, limit }),
    queryFn: ({ signal }) => fetchProjectReviews(slug, { page, limit, signal }),
    enabled: Boolean(slug) && (options.enabled ?? true),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useRelatedProjects(categoryKey, currentSlug, options = {}) {
  return useQuery({
    queryKey: projectDetailsKeys.related(categoryKey, currentSlug),
    queryFn: async ({ signal }) => {
      const items = await fetchRelatedProjects({ categoryKey, limit: 4, signal });
      const currentLower = String(currentSlug || '').toLowerCase();
      return items
        .filter((item) => String(item.slug || '').toLowerCase() !== currentLower)
        .slice(0, 3);
    },
    enabled: Boolean(categoryKey) && (options.enabled ?? true),
    ...options,
  });
}
