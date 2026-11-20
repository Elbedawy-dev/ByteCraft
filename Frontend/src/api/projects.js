import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from './client';

export const projectKeys = {
  all: ['projects'],
  lists: () => [...projectKeys.all, 'list'],
  list: (params) => [...projectKeys.lists(), params],
};

export const categoryKeys = {
  all: ['categories'],
  list: () => [...categoryKeys.all, 'list'],
};

/**
 * Normalizes a public project record from GET /api/projects so downstream UI
 * components (including shared ProjectCard) reliably access thumbnailUrl,
 * demoUrl, and reviewsSummary keys without mutating backend fields.
 */
export function normalizeProject(project) {
  if (!project || typeof project !== 'object') return project;

  const thumbnailUrl =
    project.thumbnailUrl ||
    (typeof project.thumbnail === 'string' ? project.thumbnail : project.thumbnail?.url) ||
    project.gallery?.[0]?.url ||
    '';

  const rawReviews = project.reviewsSummary || {};
  const average = rawReviews.average ?? rawReviews.averageRating ?? 0;
  const count = rawReviews.count ?? rawReviews.totalReviews ?? 0;

  const demoUrl = project.demoUrl || project.preview?.url || '';

  return {
    ...project,
    thumbnailUrl,
    demoUrl,
    reviewsSummary: {
      ...rawReviews,
      average,
      averageRating: average,
      count,
      totalReviews: count,
    },
  };
}

function cleanProjectListParams(params = {}) {
  const cleaned = {};

  if (typeof params.search === 'string' && params.search.trim()) {
    cleaned.search = params.search.trim();
  }
  if (typeof params.category === 'string' && params.category.trim()) {
    cleaned.category = params.category.trim();
  }
  if (Array.isArray(params.tech)) {
    const joined = params.tech.map((t) => String(t).trim()).filter(Boolean).join(',');
    if (joined) cleaned.tech = joined;
  } else if (typeof params.tech === 'string' && params.tech.trim()) {
    cleaned.tech = params.tech.trim();
  }
  if (params.minPrice !== undefined && params.minPrice !== null && params.minPrice !== '') {
    const min = Number(params.minPrice);
    if (Number.isInteger(min) && min >= 0) cleaned.minPrice = min;
  }
  if (params.maxPrice !== undefined && params.maxPrice !== null && params.maxPrice !== '') {
    const max = Number(params.maxPrice);
    if (Number.isInteger(max) && max >= 0) cleaned.maxPrice = max;
  }
  if (params.featured === true || params.featured === 'true') {
    cleaned.featured = 'true';
  }
  if (params.sort && params.sort !== 'newest') {
    cleaned.sort = params.sort;
  } else {
    cleaned.sort = 'newest';
  }

  const pageNum = Number(params.page);
  cleaned.page = Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1;

  const limitNum = Number(params.limit);
  cleaned.limit = Number.isInteger(limitNum) && limitNum >= 1 && limitNum <= 50 ? limitNum : 12;

  return cleaned;
}

export async function fetchProjects(params = {}, { signal } = {}) {
  const queryParams = cleanProjectListParams(params);
  const { data, meta } = await api.get('/projects', {
    params: queryParams,
    signal,
  });

  const projects = Array.isArray(data?.projects)
    ? data.projects.map(normalizeProject)
    : [];

  return {
    projects,
    meta: meta || {
      page: queryParams.page,
      limit: queryParams.limit,
      total: projects.length,
      totalPages: Math.max(1, Math.ceil(projects.length / queryParams.limit)),
    },
  };
}

export function useProjects(params = {}, options = {}) {
  const queryParams = cleanProjectListParams(params);
  return useQuery({
    queryKey: projectKeys.list(queryParams),
    queryFn: ({ signal }) => fetchProjects(queryParams, { signal }),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export async function fetchCategories({ signal } = {}) {
  const { data } = await api.get('/categories', { signal });
  return Array.isArray(data?.categories) ? data.categories : [];
}

export function useCategories(options = {}) {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: ({ signal }) => fetchCategories({ signal }),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}
