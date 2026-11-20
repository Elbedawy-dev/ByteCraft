import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { getApiErrorMessage } from '@/api/client';
import { useOwnerCategories, useUpdateOwnerCategory } from '@/api/owner/categories';
import { useLang, useToast } from '@/app/providers';
import { formatNumber } from '@/lib/format';
import { useNoIndexMeta } from '@/features/ownerAuth';
import { Badge, Button, Card, Input, Select, Skeleton, Switch } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/shared';
import { CategoryFormModal } from '@/features/ownerCategories/CategoryFormModal';
import { DeleteCategoryDialog } from '@/features/ownerCategories/DeleteCategoryDialog';

export default function OwnerCategoriesPage() {
  const { t } = useTranslation(['ownerCategories', 'common']);
  const { lang } = useLang();
  const toast = useToast();

  useNoIndexMeta();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [formModalState, setFormModalState] = useState({ open: false, category: null });
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    document.title = t('ownerCategories:pageTitle');
  }, [t, lang]);

  const { data: categories = [], isLoading, isFetching, isError, error, refetch } =
    useOwnerCategories();
  const updateMutation = useUpdateOwnerCategory();

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter((cat) => {
      if (statusFilter === 'active' && !cat.isActive) return false;
      if (statusFilter === 'inactive' && cat.isActive) return false;
      if (!q) return true;
      return (
        cat.name?.ar?.toLowerCase().includes(q) ||
        cat.name?.en?.toLowerCase().includes(q) ||
        cat.key?.toLowerCase().includes(q)
      );
    });
  }, [categories, search, statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter !== 'all');

  const handleToggleActive = async (category) => {
    setTogglingId(category.id);
    try {
      await updateMutation.mutateAsync({
        id: category.id,
        isActive: !category.isActive,
      });
      toast.success(t('ownerCategories:toasts.updated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1
              id="categories-page-heading"
              className="text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight"
            >
              {t('ownerCategories:heading')}
            </h1>
            <Badge variant="primary" size="sm" className="font-mono">
              {t('ownerCategories:totalBadge', { count: formatNumber(categories.length) })}
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            {t('ownerCategories:subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            loading={isFetching && !isLoading}
            iconLeading={<span className="material-symbols-outlined text-[18px]">refresh</span>}
          >
            {t('ownerCategories:refresh')}
          </Button>
          <Button
            variant="primary-gradient"
            size="sm"
            onClick={() => setFormModalState({ open: true, category: null })}
            iconLeading={<span className="material-symbols-outlined text-[18px]">add</span>}
          >
            {t('ownerCategories:addCategory')}
          </Button>
        </div>
      </header>

      {/* Filters */}
      <Card padding="sm" className="bg-surface-container-low">
        <search aria-label={t('ownerCategories:filters.regionLabel')}>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 min-w-0">
              <label htmlFor="cat-search-input" className="visually-hidden">
                {t('ownerCategories:filters.searchLabel')}
              </label>
              <Input
                id="cat-search-input"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('ownerCategories:filters.searchPlaceholder')}
                iconLeading={<span className="material-symbols-outlined text-[20px]">search</span>}
              />
            </div>

            <div className="w-full md:w-48 shrink-0">
              <label htmlFor="cat-status-filter" className="visually-hidden">
                {t('ownerCategories:filters.statusLabel')}
              </label>
              <Select
                id="cat-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t('ownerCategories:filters.all')}</option>
                <option value="active">{t('ownerCategories:filters.active')}</option>
                <option value="inactive">{t('ownerCategories:filters.inactive')}</option>
              </Select>
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                iconLeading={<span className="material-symbols-outlined text-[18px]">filter_alt_off</span>}
              >
                {t('ownerCategories:filters.reset')}
              </Button>
            )}
          </div>
        </search>
      </Card>

      {/* Content */}
      {isLoading ? (
        <Card padding="md" className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </Card>
      ) : isError ? (
        <ErrorState
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon="category"
          title={t('ownerCategories:empty.title')}
          description={
            hasFilters
              ? t('ownerCategories:empty.filteredDescription')
              : t('ownerCategories:empty.description')
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
              >
                {t('ownerCategories:filters.reset')}
              </Button>
            ) : (
              <Button
                variant="primary-gradient"
                size="sm"
                onClick={() => setFormModalState({ open: true, category: null })}
                iconLeading={<span className="material-symbols-outlined text-[18px]">add</span>}
              >
                {t('ownerCategories:addCategory')}
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <Card padding="none" className="hidden md:block overflow-hidden">
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="categories-page-heading"
              className="overflow-x-auto"
            >
              <table className="w-full text-start border-collapse text-sm">
                <caption className="visually-hidden">
                  {t('ownerCategories:table.caption')}
                </caption>
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low/80 text-on-surface-variant text-xs font-semibold">
                    <th scope="col" className="py-3.5 px-4 text-start">
                      {t('ownerCategories:table.nameAr')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start">
                      {t('ownerCategories:table.nameEn')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start">
                      {t('ownerCategories:table.key')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-center">
                      {t('ownerCategories:table.order')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-center">
                      {t('ownerCategories:table.status')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-end">
                      {t('ownerCategories:table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {filteredCategories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="hover:bg-surface-container-high/40 transition-colors"
                    >
                      <th scope="row" className="py-3.5 px-4 text-start font-semibold text-on-surface">
                        {cat.name?.ar}
                      </th>
                      <td className="py-3.5 px-4 text-on-surface">
                        <bdi dir="ltr">{cat.name?.en}</bdi>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-mono text-xs">
                          <bdi dir="ltr">{cat.key}</bdi>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-on-surface-variant">
                        {formatNumber(cat.order ?? 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2.5">
                          <Badge
                            variant={cat.isActive ? 'success' : 'neutral'}
                            dot
                            size="sm"
                          >
                            {cat.isActive
                              ? t('ownerCategories:status.active')
                              : t('ownerCategories:status.inactive')}
                          </Badge>
                          <Switch
                            checked={Boolean(cat.isActive)}
                            disabled={togglingId === cat.id}
                            onChange={() => handleToggleActive(cat)}
                            aria-label={t('ownerCategories:actions.toggleActive')}
                            className="!py-0 !min-h-[44px]"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t('ownerCategories:actions.edit')}
                            title={t('ownerCategories:actions.edit')}
                            onClick={() => setFormModalState({ open: true, category: cat })}
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t('ownerCategories:actions.delete')}
                            title={t('ownerCategories:actions.delete')}
                            onClick={() => setDeletingCategory(cat)}
                            className="hover:text-error hover:bg-error/10"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Stacked Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredCategories.map((cat) => (
              <Card key={cat.id} padding="sm" className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-on-surface break-words">
                      {cat.name?.ar}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5 break-words">
                      <bdi dir="ltr">{cat.name?.en}</bdi>
                    </p>
                  </div>
                  <Badge variant={cat.isActive ? 'success' : 'neutral'} dot size="sm">
                    {cat.isActive
                      ? t('ownerCategories:status.active')
                      : t('ownerCategories:status.inactive')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-on-surface-variant flex-wrap">
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-mono">
                    <bdi dir="ltr">{cat.key}</bdi>
                  </span>
                  <span className="font-mono">
                    {t('ownerCategories:table.order')}: {formatNumber(cat.order ?? 0)}
                  </span>
                </div>

                <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between gap-2">
                  <Switch
                    checked={Boolean(cat.isActive)}
                    disabled={togglingId === cat.id}
                    onChange={() => handleToggleActive(cat)}
                    label={t('ownerCategories:actions.toggleActive')}
                    className={clsx('!py-0 flex-1')}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      aria-label={t('ownerCategories:actions.edit')}
                      onClick={() => setFormModalState({ open: true, category: cat })}
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('ownerCategories:actions.delete')}
                      onClick={() => setDeletingCategory(cat)}
                      className="text-error hover:bg-error/10"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create / Edit Modal */}
      <CategoryFormModal
        isOpen={formModalState.open}
        category={formModalState.category}
        onClose={() => setFormModalState({ open: false, category: null })}
      />

      {/* Delete / CATEGORY_IN_USE Dialog */}
      <DeleteCategoryDialog
        category={deletingCategory}
        onClose={() => setDeletingCategory(null)}
      />
    </div>
  );
}
