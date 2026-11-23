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

  // Accumulate distinct techStack values from real API responses so filter options
  // remain accessible even while narrowing results
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

  // If URL points past the last available page for a non-empty result set, snap to last valid page
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
    <div className="relative w-full overflow-x-clip bc-hero-wash flex-1">
      <div className="relative z-10 max-w-7xl mx-auto px-gutter-mobile sm:px-6 lg:px-gutter py-space-lg sm:py-space-xl space-y-space-xl">
        {/* Top Section: Header + Stats Strip + Filter Console */}
        <section className="space-y-space-lg">
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
        </section>

        {/* Results Grid + Pagination */}
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

        {/* What You Get With Every Project */}
        <IncludedFeaturesSection />

        {/* Custom Build CTA Banner */}
        <CustomBuildCta />
      </div>
    </div>
  );
}
