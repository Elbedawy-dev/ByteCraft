import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export const homeKeys = {
  all: ['home'],
  featuredProjects: () => ['home', 'featured-projects'],
  portfolioProjects: (category = 'all') => ['home', 'portfolio-projects', category || 'all'],
  publicStats: () => ['home', 'public-stats'],
  latestReviews: (limit = 3) => ['home', 'latest-reviews', limit],
};

/**
 * Adapts the Backend public project payload (`thumbnail.url`, `reviewsSummary.average`,
 * `preview.url`) to the prop shape expected by the shared `ProjectCard` component.
 */
export function normalizeProjectForCard(project) {
  if (!project || typeof project !== 'object') return project;

  const thumbnailUrl =
    project.thumbnailUrl ||
    (typeof project.thumbnail === 'string' ? project.thumbnail : project.thumbnail?.url) ||
    project.gallery?.[0]?.url ||
    '';

  const average =
    project.reviewsSummary?.average ??
    project.reviewsSummary?.averageRating ??
    0;
  const count =
    project.reviewsSummary?.count ??
    project.reviewsSummary?.totalReviews ??
    0;

  return {
    ...project,
    thumbnailUrl,
    demoUrl: project.demoUrl || project.preview?.url || '',
    reviewsSummary: {
      ...(project.reviewsSummary || {}),
      average,
      count,
      averageRating: average,
      totalReviews: count,
    },
  };
}

/**
 * Loads up to 3 featured published projects.
 * Falls back to the 3 newest published projects if none are marked featured.
 */
export async function fetchFeaturedProjects({ signal } = {}) {
  const featuredResponse = await api.get('/projects', {
    params: { featured: true, limit: 3 },
    signal,
  });

  const featuredProjects = Array.isArray(featuredResponse?.data?.projects)
    ? featuredResponse.data.projects
    : [];

  if (featuredProjects.length > 0) {
    return {
      projects: featuredProjects.map(normalizeProjectForCard),
      isFallback: false,
    };
  }

  const newestResponse = await api.get('/projects', {
    params: { sort: 'newest', limit: 3 },
    signal,
  });

  const newestProjects = Array.isArray(newestResponse?.data?.projects)
    ? newestResponse.data.projects
    : [];

  return {
    projects: newestProjects.map(normalizeProjectForCard),
    isFallback: true,
  };
}

/**
 * Loads up to 3 portfolio projects filtered by category key (or featured/newest when 'all').
 */
export async function fetchPortfolioProjects({ category = 'all', signal } = {}) {
  if (!category || category === 'all') {
    return fetchFeaturedProjects({ signal });
  }

  const response = await api.get('/projects', {
    params: { category, sort: 'newest', limit: 3 },
    signal,
  });

  const list = Array.isArray(response?.data?.projects) ? response.data.projects : [];
  return {
    projects: list.map(normalizeProjectForCard),
    isFallback: false,
  };
}

/**
 * Loads real public stats from GET /api/stats/public.
 */
export async function fetchPublicStats({ signal } = {}) {
  const response = await api.get('/stats/public', { signal });
  return response?.data || null;
}

/**
 * Loads real latest reviews from GET /api/reviews/latest.
 */
export async function fetchLatestReviews({ limit = 3, signal } = {}) {
  const response = await api.get('/reviews/latest', {
    params: { limit },
    signal,
  });
  return Array.isArray(response?.data?.reviews) ? response.data.reviews : [];
}

export function useFeaturedProjects(options = {}) {
  return useQuery({
    queryKey: homeKeys.featuredProjects(),
    queryFn: ({ signal }) => fetchFeaturedProjects({ signal }),
    ...options,
  });
}

export function usePortfolioProjects(category = 'all', options = {}) {
  return useQuery({
    queryKey: homeKeys.portfolioProjects(category),
    queryFn: ({ signal }) => fetchPortfolioProjects({ category, signal }),
    ...options,
  });
}

export function usePublicStats(options = {}) {
  return useQuery({
    queryKey: homeKeys.publicStats(),
    queryFn: ({ signal }) => fetchPublicStats({ signal }),
    retry: 2,
    ...options,
  });
}

export function useLatestReviews(limit = 3, options = {}) {
  return useQuery({
    queryKey: homeKeys.latestReviews(limit),
    queryFn: ({ signal }) => fetchLatestReviews({ limit, signal }),
    retry: 2,
    ...options,
  });
}
