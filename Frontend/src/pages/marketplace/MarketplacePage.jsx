import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCategories, useProjects } from '@/api/projects';
import { useMarketplaceFilters } from '@/features/marketplace/useMarketplaceFilters';
import { MarketplaceHeader } from '@/features/marketplace/MarketplaceHeader';
import { MarketplaceFilterConsole } from '@/features/marketplace/MarketplaceFilterConsole';
import { MarketplaceGrid } from '@/features/marketplace/MarketplaceGrid';
import { IncludedFeaturesSection } from '@/features/marketplace/IncludedFeaturesSection';
import { CustomBuildCta } from '@/features/marketplace/CustomBuildCta';

export default function MarketplacePage() {
  const resultsTopRef = useRef(null);

  const {
    filters,
    apiParams,
    isPriceRangeInvalid,
    drawerFilterCount,
    hasActiveFilters,
    setSearch,
    setCategory,
    toggleTech,
    removeTech,
    setSort,
    setPriceRange,
    setFeatured,
    setPage,
    applyBatchFilters,
    clearAllFilters,
  } = useMarketplaceFilters();

  const categoriesQuery = useCategories();
  const projectsQuery = useProjects(apiParams);

  const projects = useMemo(
    () => projectsQuery.data?.projects ?? [],
    [projectsQuery.data]
  );
  const meta = projectsQuery.data?.meta ?? null;

  const [knownTechs, setKnownTechs] = useState([]);

  useEffect(() => {
    if (!projects.length) return;
    setKnownTechs((prev) => {
      const map = new Map(prev.map((item) => [item.toLowerCase(), item]));
      let changed = false;
      for (const project of projects) {
        if (!Array.isArray(project.techStack)) continue;
        for (const tech of project.techStack) {
          const trimmed = String(tech || '').trim();
          if (!trimmed) continue;
          const lower = trimmed.toLowerCase();
          if (!map.has(lower)) {
            map.set(lower, trimmed);
            changed = true;
          }
        }
      }
      if (!changed) return prev;
      return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
    });
  }, [projects]);

  const availableTechs = useMemo(() => {
    const map = new Map(knownTechs.map((item) => [item.toLowerCase(), item]));
    for (const active of filters.tech) {
      const lower = active.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, active);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [knownTechs, filters.tech]);

  useEffect(() => {
    if (
      !projectsQuery.isFetching &&
      !projectsQuery.isPlaceholderData &&
      meta &&
      meta.total > 0 &&
      filters.page > meta.totalPages
    ) {
      setPage(meta.totalPages, { replace: true });
    }
  }, [
    projectsQuery.isFetching,
    projectsQuery.isPlaceholderData,
    meta,
    filters.page,
    setPage,
  ]);

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultsTopRef.current?.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="relative w-full overflow-x-clip flex-1 flex flex-col">
      <div className="w-full bc-hero-wash py-12 lg:py-16">
        <div className="max-w-container mx-auto px-4 sm:px-6 space-y-10">
          <MarketplaceHeader />

          <MarketplaceFilterConsole
            filters={filters}
            isPriceRangeInvalid={isPriceRangeInvalid}
            drawerFilterCount={drawerFilterCount}
            hasActiveFilters={hasActiveFilters}
            categories={categoriesQuery.data ?? []}
            categoriesLoading={categoriesQuery.isPending}
            availableTechs={availableTechs}
            onSearchChange={setSearch}
            onCategoryChange={setCategory}
            onToggleTech={toggleTech}
            onRemoveTech={removeTech}
            onSortChange={setSort}
            onPriceRangeChange={setPriceRange}
            onFeaturedChange={setFeatured}
            onApplyBatchFilters={applyBatchFilters}
            onClearAll={clearAllFilters}
          />
        </div>
      </div>

      <div className="max-w-container w-full mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-16 flex-1">
        <div ref={resultsTopRef} className="scroll-mt-24">
          <MarketplaceGrid
            projects={projects}
            meta={meta}
            isPending={projectsQuery.isPending}
            isFetching={projectsQuery.isFetching}
            isPlaceholderData={projectsQuery.isPlaceholderData}
            isError={projectsQuery.isError}
            error={projectsQuery.error}
            hasActiveFilters={hasActiveFilters}
            onRetry={() => projectsQuery.refetch()}
            onClearFilters={clearAllFilters}
            onPageChange={handlePageChange}
          />
        </div>

        <IncludedFeaturesSection />
      </div>

      <CustomBuildCta />
    </div>
  );
}
