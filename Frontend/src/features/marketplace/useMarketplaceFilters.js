import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { egpToPiasters } from '@/lib/money';

export const SORT_OPTIONS = ['newest', 'popular', 'price_asc', 'price_desc'];
export const DEFAULT_SORT = 'newest';
export const PROJECTS_PER_PAGE = 12;

function sanitizePositiveIntString(raw) {
  if (raw === null || raw === undefined) return '';
  const digits = String(raw).replace(/[^\d]/g, '');
  if (!digits) return '';
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return '';
  return String(parsed);
}

function parseTechList(raw) {
  if (!raw) return [];
  const seen = new Set();
  const result = [];
  for (const part of String(raw).split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
  }
  return result;
}

export function useMarketplaceFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const search = (searchParams.get('search') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const tech = parseTechList(searchParams.get('tech'));
    const rawSort = (searchParams.get('sort') || DEFAULT_SORT).trim();
    const sort = SORT_OPTIONS.includes(rawSort) ? rawSort : DEFAULT_SORT;
    const minPrice = sanitizePositiveIntString(searchParams.get('minPrice'));
    const maxPrice = sanitizePositiveIntString(searchParams.get('maxPrice'));
    const featured = searchParams.get('featured') === 'true';
    const rawPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

    return {
      search,
      category,
      tech,
      sort,
      minPrice,
      maxPrice,
      featured,
      page,
    };
  }, [searchParams]);

  const isPriceRangeInvalid = useMemo(() => {
    if (filters.minPrice === '' || filters.maxPrice === '') return false;
    return Number(filters.minPrice) > Number(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);

  const apiParams = useMemo(() => {
    const params = {
      sort: filters.sort,
      page: filters.page,
      limit: PROJECTS_PER_PAGE,
    };

    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.tech.length > 0) params.tech = filters.tech.join(',');
    if (filters.featured) params.featured = true;

    if (!isPriceRangeInvalid) {
      if (filters.minPrice !== '') {
        params.minPrice = egpToPiasters(Number(filters.minPrice));
      }
      if (filters.maxPrice !== '') {
        params.maxPrice = egpToPiasters(Number(filters.maxPrice));
      }
    }

    return params;
  }, [filters, isPriceRangeInvalid]);

  const commitParams = useCallback(
    (mutator, { resetPage = true, replace = false } = {}) => {
      const next = new URLSearchParams(searchParams);
      mutator(next);
      if (resetPage) {
        next.delete('page');
      }

      if (next.toString() === searchParams.toString()) {
        return;
      }
      setSearchParams(next, { replace });
    },
    [searchParams, setSearchParams]
  );

  const setSearch = useCallback(
    (value, options = {}) => {
      const trimmed = String(value || '').trim();
      commitParams((next) => {
        if (trimmed) next.set('search', trimmed);
        else next.delete('search');
      }, options);
    },
    [commitParams]
  );

  const setCategory = useCallback(
    (categoryKey) => {
      const trimmed = String(categoryKey || '').trim();
      commitParams((next) => {
        if (trimmed && trimmed !== 'all') next.set('category', trimmed);
        else next.delete('category');
      });
    },
    [commitParams]
  );

  const setTechList = useCallback(
    (techArray) => {
      const normalized = parseTechList(Array.isArray(techArray) ? techArray.join(',') : techArray);
      commitParams((next) => {
        if (normalized.length > 0) next.set('tech', normalized.join(','));
        else next.delete('tech');
      });
    },
    [commitParams]
  );

  const toggleTech = useCallback(
    (techName) => {
      const clean = String(techName || '').trim();
      if (!clean) return;
      const lower = clean.toLowerCase();
      const exists = filters.tech.some((item) => item.toLowerCase() === lower);
      const updated = exists
        ? filters.tech.filter((item) => item.toLowerCase() !== lower)
        : [...filters.tech, clean];
      setTechList(updated);
    },
    [filters.tech, setTechList]
  );

  const removeTech = useCallback(
    (techName) => {
      const lower = String(techName || '').trim().toLowerCase();
      setTechList(filters.tech.filter((item) => item.toLowerCase() !== lower));
    },
    [filters.tech, setTechList]
  );

  const setSort = useCallback(
    (sortValue) => {
      const valid = SORT_OPTIONS.includes(sortValue) ? sortValue : DEFAULT_SORT;
      commitParams((next) => {
        if (valid === DEFAULT_SORT) next.delete('sort');
        else next.set('sort', valid);
      });
    },
    [commitParams]
  );

  const setPriceRange = useCallback(
    ({ minPrice, maxPrice }) => {
      const cleanMin = sanitizePositiveIntString(minPrice);
      const cleanMax = sanitizePositiveIntString(maxPrice);
      commitParams((next) => {
        if (cleanMin !== '') next.set('minPrice', cleanMin);
        else next.delete('minPrice');
        if (cleanMax !== '') next.set('maxPrice', cleanMax);
        else next.delete('maxPrice');
      });
    },
    [commitParams]
  );

  const setFeatured = useCallback(
    (isFeatured) => {
      commitParams((next) => {
        if (isFeatured) next.set('featured', 'true');
        else next.delete('featured');
      });
    },
    [commitParams]
  );

  const setPage = useCallback(
    (pageNumber, { replace = false } = {}) => {
      const num = Number.parseInt(pageNumber, 10);
      commitParams(
        (next) => {
          if (Number.isInteger(num) && num > 1) {
            next.set('page', String(num));
          } else {
            next.delete('page');
          }
        },
        { resetPage: false, replace }
      );
    },
    [commitParams]
  );

  const applyBatchFilters = useCallback(
    ({ sort, tech, minPrice, maxPrice, featured }) => {
      commitParams((next) => {
        const validSort = SORT_OPTIONS.includes(sort) ? sort : DEFAULT_SORT;
        if (validSort === DEFAULT_SORT) next.delete('sort');
        else next.set('sort', validSort);

        const normalizedTech = parseTechList(Array.isArray(tech) ? tech.join(',') : tech);
        if (normalizedTech.length > 0) next.set('tech', normalizedTech.join(','));
        else next.delete('tech');

        const cleanMin = sanitizePositiveIntString(minPrice);
        const cleanMax = sanitizePositiveIntString(maxPrice);
        if (cleanMin !== '') next.set('minPrice', cleanMin);
        else next.delete('minPrice');
        if (cleanMax !== '') next.set('maxPrice', cleanMax);
        else next.delete('maxPrice');

        if (featured) next.set('featured', 'true');
        else next.delete('featured');
      });
    },
    [commitParams]
  );

  const clearAllFilters = useCallback(() => {
    if (searchParams.toString() === '') return;
    setSearchParams(new URLSearchParams());
  }, [searchParams, setSearchParams]);

  const drawerFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sort !== DEFAULT_SORT) count += 1;
    count += filters.tech.length;
    if (filters.minPrice !== '' || filters.maxPrice !== '') count += 1;
    if (filters.featured) count += 1;
    return count;
  }, [filters.sort, filters.tech.length, filters.minPrice, filters.maxPrice, filters.featured]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search ||
        filters.category ||
        filters.tech.length > 0 ||
        filters.minPrice !== '' ||
        filters.maxPrice !== '' ||
        filters.featured ||
        filters.sort !== DEFAULT_SORT
    );
  }, [filters]);

  return {
    filters,
    apiParams,
    isPriceRangeInvalid,
    drawerFilterCount,
    hasActiveFilters,
    setSearch,
    setCategory,
    setTechList,
    toggleTech,
    removeTech,
    setSort,
    setPriceRange,
    setFeatured,
    setPage,
    applyBatchFilters,
    clearAllFilters,
  };
}
