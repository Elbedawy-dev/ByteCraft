import React, { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/app/providers';
import { localized } from '@/lib/localized';
import { formatNumber } from '@/lib/format';
import { Button, Drawer, Input, Select, Skeleton, Switch } from '@/components/ui';
import { DEFAULT_SORT, SORT_OPTIONS } from './useMarketplaceFilters';

function digitsOnly(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

export function MarketplaceFilterConsole({
  filters,
  isPriceRangeInvalid,
  drawerFilterCount,
  hasActiveFilters,
  categories = [],
  categoriesLoading = false,
  availableTechs = [],
  onSearchChange,
  onCategoryChange,
  onToggleTech,
  onRemoveTech,
  onSortChange,
  onPriceRangeChange,
  onFeaturedChange,
  onApplyBatchFilters,
  onClearAll,
}) {
  const { t } = useTranslation('marketplace');
  const { lang } = useLang();

  const searchInputId = useId();
  const desktopSortId = useId();
  const desktopTechId = useId();
  const desktopMinPriceId = useId();
  const desktopMaxPriceId = useId();
  const desktopFeaturedId = useId();
  const drawerSortId = useId();
  const drawerMinPriceId = useId();
  const drawerMaxPriceId = useId();
  const drawerFeaturedId = useId();

  // Local debounced search input synced with URL
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const trimmed = searchDraft.trim();
    if (trimmed === filters.search) return undefined;

    searchDebounceRef.current = setTimeout(() => {
      onSearchChange(trimmed);
    }, 400);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchDraft, filters.search, onSearchChange]);

  // Local debounced desktop price inputs synced with URL
  const [minPriceDraft, setMinPriceDraft] = useState(filters.minPrice);
  const [maxPriceDraft, setMaxPriceDraft] = useState(filters.maxPrice);
  const priceDebounceRef = useRef(null);

  useEffect(() => {
    setMinPriceDraft(filters.minPrice);
    setMaxPriceDraft(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);

  const desktopPriceInvalid =
    minPriceDraft !== '' &&
    maxPriceDraft !== '' &&
    Number(minPriceDraft) > Number(maxPriceDraft);

  useEffect(() => {
    if (minPriceDraft === filters.minPrice && maxPriceDraft === filters.maxPrice) {
      return undefined;
    }
    if (desktopPriceInvalid) return undefined;

    priceDebounceRef.current = setTimeout(() => {
      onPriceRangeChange({ minPrice: minPriceDraft, maxPrice: maxPriceDraft });
    }, 400);

    return () => {
      if (priceDebounceRef.current) {
        clearTimeout(priceDebounceRef.current);
      }
    };
  }, [
    minPriceDraft,
    maxPriceDraft,
    filters.minPrice,
    filters.maxPrice,
    desktopPriceInvalid,
    onPriceRangeChange,
  ]);

  // Mobile bottom sheet drawer state + focus restoration
  const [drawerOpen, setDrawerOpen] = useState(false);
  const filterTriggerRef = useRef(null);
  const wasDrawerOpenRef = useRef(false);

  const [drawerDraft, setDrawerDraft] = useState({
    sort: filters.sort,
    tech: filters.tech,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    featured: filters.featured,
  });

  useEffect(() => {
    if (drawerOpen) {
      wasDrawerOpenRef.current = true;
      setDrawerDraft({
        sort: filters.sort,
        tech: filters.tech,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        featured: filters.featured,
      });
    } else if (wasDrawerOpenRef.current) {
      wasDrawerOpenRef.current = false;
      filterTriggerRef.current?.focus();
    }
  }, [
    drawerOpen,
    filters.sort,
    filters.tech,
    filters.minPrice,
    filters.maxPrice,
    filters.featured,
  ]);

  const drawerPriceInvalid =
    drawerDraft.minPrice !== '' &&
    drawerDraft.maxPrice !== '' &&
    Number(drawerDraft.minPrice) > Number(drawerDraft.maxPrice);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (e.nativeEvent?.isComposing) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    onSearchChange(searchDraft.trim());
  };

  const handleClearSearch = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchDraft('');
    onSearchChange('');
  };

  const handleDesktopPriceBlur = () => {
    if (desktopPriceInvalid) return;
    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    onPriceRangeChange({ minPrice: minPriceDraft, maxPrice: maxPriceDraft });
  };

  const handleDrawerToggleTech = (techName) => {
    const lower = techName.toLowerCase();
    setDrawerDraft((prev) => {
      const exists = prev.tech.some((item) => item.toLowerCase() === lower);
      return {
        ...prev,
        tech: exists
          ? prev.tech.filter((item) => item.toLowerCase() !== lower)
          : [...prev.tech, techName],
      };
    });
  };

  const handleDrawerApply = (e) => {
    e.preventDefault();
    if (drawerPriceInvalid) return;
    onApplyBatchFilters(drawerDraft);
    setDrawerOpen(false);
  };

  const handleDrawerReset = () => {
    setDrawerDraft({
      sort: DEFAULT_SORT,
      tech: [],
      minPrice: '',
      maxPrice: '',
      featured: false,
    });
    onClearAll();
    setDrawerOpen(false);
  };

  // Techs not yet selected for the desktop dropdown
  const selectedTechLower = new Set(filters.tech.map((item) => item.toLowerCase()));
  const unselectedTechs = availableTechs.filter(
    (tech) => !selectedTechLower.has(tech.toLowerCase())
  );

  // Active filter summary pills (excluding category since category chips already highlight it)
  const activePills = [];
  if (filters.search) {
    activePills.push({
      key: 'search',
      label: t('filters.activeChips.search', { value: filters.search }),
      onRemove: handleClearSearch,
    });
  }
  for (const tech of filters.tech) {
    activePills.push({
      key: `tech-${tech}`,
      label: t('filters.activeChips.tech', { value: tech }),
      onRemove: () => onRemoveTech(tech),
    });
  }
  if (filters.minPrice !== '' && filters.maxPrice !== '') {
    activePills.push({
      key: 'price',
      label: t('filters.activeChips.priceRange', {
        min: formatNumber(filters.minPrice),
        max: formatNumber(filters.maxPrice),
      }),
      onRemove: () => onPriceRangeChange({ minPrice: '', maxPrice: '' }),
    });
  } else if (filters.minPrice !== '') {
    activePills.push({
      key: 'minPrice',
      label: t('filters.activeChips.minPrice', {
        value: formatNumber(filters.minPrice),
      }),
      onRemove: () => onPriceRangeChange({ minPrice: '', maxPrice: filters.maxPrice }),
    });
  } else if (filters.maxPrice !== '') {
    activePills.push({
      key: 'maxPrice',
      label: t('filters.activeChips.maxPrice', {
        value: formatNumber(filters.maxPrice),
      }),
      onRemove: () => onPriceRangeChange({ minPrice: filters.minPrice, maxPrice: '' }),
    });
  }
  if (filters.featured) {
    activePills.push({
      key: 'featured',
      label: t('filters.activeChips.featured'),
      onRemove: () => onFeaturedChange(false),
    });
  }

  return (
    <search aria-label={t('filters.searchRegionLabel')}>
      <div className="bg-card border border-card-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-card">
        {/* Row 1: Search Input + Mobile Filter Button + Desktop Sort Select */}
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 items-stretch lg:items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <form
              method="GET"
              onSubmit={handleSearchSubmit}
              className="relative flex-1 min-w-0"
            >
              <label htmlFor={searchInputId} className="sr-only">
                {t('filters.searchLabel')}
              </label>
              <Input
                id={searchInputId}
                name="search"
                type="search"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent?.isComposing) {
                    handleSearchSubmit(e);
                  }
                }}
                placeholder={t('filters.searchPlaceholder')}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="search"
                iconLeading={
                  <span className="material-symbols-rounded text-[20px]" aria-hidden="true">search</span>
                }
                className={clsx(
                  'bg-input text-base sm:text-sm !rounded-full [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
                  searchDraft && 'pe-12'
                )}
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label={t('filters.clearSearch')}
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-on-surface hover:bg-section-band transition-colors"
                >
                  <span className="material-symbols-rounded text-[18px]" aria-hidden="true">close</span>
                </button>
              )}
            </form>

            {/* Mobile Filter Drawer Trigger (< lg) */}
            <Button
              ref={filterTriggerRef}
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              aria-haspopup="dialog"
              className="lg:hidden shrink-0 px-4"
              iconLeading={
                <span className="material-symbols-rounded text-[20px]" aria-hidden="true">tune</span>
              }
            >
              <span>{t('filters.openFilters')}</span>
              {drawerFilterCount > 0 && (
                <span className="ms-1 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-on-primary font-mono text-[11px] font-bold inline-flex items-center justify-center">
                  {drawerFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Desktop Sort Select */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <label
              htmlFor={desktopSortId}
              className="text-sm font-semibold text-on-surface-variant whitespace-nowrap flex items-center gap-1.5 select-none"
            >
              <span className="material-symbols-rounded text-[18px] text-primary" aria-hidden="true">
                sort
              </span>
              <span>{t('filters.sortLabel')}</span>
            </label>
            <div className="w-56">
              <Select
                id={desktopSortId}
                name="sort"
                value={filters.sort}
                onChange={(e) => onSortChange(e.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {t(`filters.sortOptions.${option}`)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Row 2: Category Pill Chips */}
        <div
          role="group"
          aria-label={t('filters.categoriesLabel')}
          className="flex flex-nowrap md:flex-wrap items-center gap-2 overflow-x-auto md:overflow-visible overscroll-x-contain pb-1 md:pb-0 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            type="button"
            onClick={() => onCategoryChange('')}
            aria-pressed={!filters.category}
            className={clsx(
              'shrink-0 whitespace-nowrap min-h-[42px] px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer inline-flex items-center gap-2 border',
              !filters.category
                ? 'btn-primary-gradient text-white border-transparent'
                : 'bg-section-band border-outline-variant text-on-surface-variant hover:bg-brand-soft hover:text-primary'
            )}
          >
            <span>{t('filters.allCategories')}</span>
          </button>

          {categoriesLoading && categories.length === 0
            ? Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton
                  key={idx}
                  className="h-10 w-28 rounded-full shrink-0"
                />
              ))
            : categories.map((cat) => {
                const isActive = filters.category === cat.key;
                return (
                  <button
                    key={cat.id || cat._id || cat.key}
                    type="button"
                    onClick={() => onCategoryChange(cat.key)}
                    aria-pressed={isActive}
                    className={clsx(
                      'shrink-0 whitespace-nowrap min-h-[42px] px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer inline-flex items-center gap-2 border',
                      isActive
                        ? 'btn-primary-gradient text-white border-transparent'
                        : 'bg-section-band border-outline-variant text-on-surface-variant hover:bg-brand-soft hover:text-primary'
                    )}
                  >
                    <span>{localized(cat.name, lang)}</span>
                  </button>
                );
              })}
        </div>

        {/* Row 3 (Desktop Only): Tech Filter + Optional Price Range + Featured Toggle */}
        <div className="hidden lg:block pt-3.5 border-t border-outline-variant/50 space-y-2">
          <div className="flex flex-wrap items-end gap-4">
            {/* Tech Filter Select */}
            <div className="flex flex-col gap-1.5 w-52">
              <label
                htmlFor={desktopTechId}
                className="h-5 text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px] text-primary" aria-hidden="true">
                  code
                </span>
                <span>{t('filters.techLabel')}</span>
              </label>
              <Select
                id={desktopTechId}
                name="tech"
                value=""
                disabled={availableTechs.length === 0 || unselectedTechs.length === 0}
                onChange={(e) => {
                  if (e.target.value) {
                    onToggleTech(e.target.value);
                  }
                }}
              >
                <option value="">
                  {availableTechs.length === 0
                    ? t('filters.techEmpty')
                    : t('filters.techPlaceholder')}
                </option>
                {unselectedTechs.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </Select>
            </div>

            {/* Optional Price Range (EGP -> converted to piasters in API request) */}
            <fieldset className="flex flex-col min-w-0">
              <legend className="h-5 text-xs font-semibold text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary" aria-hidden="true">
                  payments
                </span>
                <span>{t('filters.priceRangeLabel')}</span>
              </legend>
              <div className="flex items-center gap-2">
                <div className="w-32">
                  <label htmlFor={desktopMinPriceId} className="sr-only">
                    {t('filters.minPriceLabel')}
                  </label>
                  <Input
                    id={desktopMinPriceId}
                    name="minPrice"
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={minPriceDraft}
                    onChange={(e) => setMinPriceDraft(digitsOnly(e.target.value))}
                    onBlur={handleDesktopPriceBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent?.isComposing) {
                        handleDesktopPriceBlur();
                      }
                    }}
                    placeholder={t('filters.minPricePlaceholder')}
                    error={desktopPriceInvalid || isPriceRangeInvalid}
                    className="bg-input rounded-xl text-start"
                  />
                </div>
                <span className="text-on-surface-variant text-sm select-none" aria-hidden="true">
                  —
                </span>
                <div className="w-32">
                  <label htmlFor={desktopMaxPriceId} className="sr-only">
                    {t('filters.maxPriceLabel')}
                  </label>
                  <Input
                    id={desktopMaxPriceId}
                    name="maxPrice"
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={maxPriceDraft}
                    onChange={(e) => setMaxPriceDraft(digitsOnly(e.target.value))}
                    onBlur={handleDesktopPriceBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent?.isComposing) {
                        handleDesktopPriceBlur();
                      }
                    }}
                    placeholder={t('filters.maxPricePlaceholder')}
                    error={desktopPriceInvalid || isPriceRangeInvalid}
                    className="bg-input rounded-xl text-start"
                  />
                </div>
              </div>
            </fieldset>

            {/* Featured Toggle */}
            <div className="flex items-center h-12 px-4 rounded-lg bg-input border border-input-border">
              <Switch
                id={desktopFeaturedId}
                name="featured"
                label={t('filters.featuredShort')}
                checked={filters.featured}
                onChange={(e) => onFeaturedChange(e.target.checked)}
                className="gap-3 py-0"
              />
            </div>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <div className="ms-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="text-muted hover:text-error"
                  iconLeading={
                    <span className="material-symbols-rounded text-[18px]" aria-hidden="true">filter_alt_off</span>
                  }
                >
                  {t('filters.clearAll')}
                </Button>
              </div>
            )}
          </div>

          {(desktopPriceInvalid || isPriceRangeInvalid) && (
            <p role="alert" className="text-xs text-error flex items-center gap-1.5 pt-1">
              <span className="material-symbols-rounded text-[15px]" aria-hidden="true">
                error
              </span>
              <span>{t('filters.priceRangeError')}</span>
            </p>
          )}
        </div>

        {/* Active Filter Pills */}
        {activePills.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant">
            {activePills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={pill.onRemove}
                aria-label={t('filters.removeFilter', { label: pill.label })}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1 rounded-full bg-brand-soft border border-chip-mint-border text-brand-soft-text text-xs font-semibold hover:bg-primary/15 transition-colors"
              >
                <span>{pill.label}</span>
                <span className="material-symbols-rounded text-[15px]" aria-hidden="true">
                  close
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={onClearAll}
              className="lg:hidden text-xs font-semibold text-muted hover:text-error px-2 py-1.5 min-h-[36px] transition-colors"
            >
              {t('filters.clearAll')}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet Filter Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t('filters.drawerTitle')}
        side="bottom"
      >
        <form onSubmit={handleDrawerApply} className="space-y-6 overscroll-contain">
          {/* Sort */}
          <div className="space-y-2">
            <label
              htmlFor={drawerSortId}
              className="block text-sm font-semibold text-on-surface"
            >
              {t('filters.sortLabel')}
            </label>
            <Select
              id={drawerSortId}
              name="drawer-sort"
              value={drawerDraft.sort}
              onChange={(e) =>
                setDrawerDraft((prev) => ({ ...prev, sort: e.target.value }))
              }
              className="text-base"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`filters.sortOptions.${option}`)}
                </option>
              ))}
            </Select>
          </div>

          {/* Tech Filter Chips */}
          <fieldset className="space-y-2.5">
            <legend className="text-sm font-semibold text-on-surface">
              {t('filters.techLabel')}
            </legend>
            <p className="text-xs text-on-surface-variant">
              {t('filters.techHint')}
            </p>
            {availableTechs.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-40 bc-scroll pe-1">
                {availableTechs.map((tech) => {
                  const selected = drawerDraft.tech.some(
                    (item) => item.toLowerCase() === tech.toLowerCase()
                  );
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => handleDrawerToggleTech(tech)}
                      aria-pressed={selected}
                      className={clsx(
                        'min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-label-code transition-all border inline-flex items-center gap-1.5',
                        selected
                          ? 'bg-primary/15 border-primary text-primary font-bold'
                          : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:text-on-surface'
                      )}
                    >
                      {selected && (
                        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                          check
                        </span>
                      )}
                      <bdi dir="ltr">{tech}</bdi>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic">
                {t('filters.techEmpty')}
              </p>
            )}
          </fieldset>

          {/* Price Range */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-on-surface">
              {t('filters.priceRangeLabel')}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor={drawerMinPriceId}
                  className="block text-xs text-on-surface-variant"
                >
                  {t('filters.minPriceLabel')}
                </label>
                <Input
                  id={drawerMinPriceId}
                  name="drawer-min-price"
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={drawerDraft.minPrice}
                  onChange={(e) =>
                    setDrawerDraft((prev) => ({
                      ...prev,
                      minPrice: digitsOnly(e.target.value),
                    }))
                  }
                  placeholder={t('filters.minPricePlaceholder')}
                  error={drawerPriceInvalid}
                  className="text-base text-start"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor={drawerMaxPriceId}
                  className="block text-xs text-on-surface-variant"
                >
                  {t('filters.maxPriceLabel')}
                </label>
                <Input
                  id={drawerMaxPriceId}
                  name="drawer-max-price"
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={drawerDraft.maxPrice}
                  onChange={(e) =>
                    setDrawerDraft((prev) => ({
                      ...prev,
                      maxPrice: digitsOnly(e.target.value),
                    }))
                  }
                  placeholder={t('filters.maxPricePlaceholder')}
                  error={drawerPriceInvalid}
                  className="text-base text-start"
                />
              </div>
            </div>
            {drawerPriceInvalid && (
              <p role="alert" className="text-xs text-error flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                  error
                </span>
                <span>{t('filters.priceRangeError')}</span>
              </p>
            )}
          </fieldset>

          {/* Featured Switch */}
          <div className="p-3.5 rounded-xl bg-card border border-card-border">
            <Switch
              id={drawerFeaturedId}
              name="drawer-featured"
              label={t('filters.featuredLabel')}
              description={t('filters.featuredDescription')}
              checked={drawerDraft.featured}
              onChange={(e) =>
                setDrawerDraft((prev) => ({
                  ...prev,
                  featured: e.target.checked,
                }))
              }
              className="w-full"
            />
          </div>

          {/* Sticky Footer Actions */}
          <div className="sticky -bottom-4 sm:-bottom-6 z-20 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4 bg-surface border-t border-outline-variant shadow-sticky-bar flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleDrawerReset}
              className="shrink-0"
            >
              {t('filters.clearAll')}
            </Button>
            <Button
              type="submit"
              variant="primary-gradient"
              size="md"
              disabled={drawerPriceInvalid}
              className="flex-1"
            >
              {t('filters.applyFilters')}
            </Button>
          </div>
        </form>
      </Drawer>
    </search>
  );
}
