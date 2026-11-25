import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/api/client';
import { useOwnerProjects, useUpdateOwnerProjectStatus } from '@/api/owner/projects';
import { useOwnerCategories } from '@/api/owner/categories';
import { useLang, useToast } from '@/app/providers';
import { localized } from '@/lib/localized';
import { formatNumber } from '@/lib/format';
import { useNoIndexMeta } from '@/features/ownerAuth';
import { Badge, Button, Card, Input, Pagination, Select, Skeleton } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/shared';
import { ProjectsTable } from '@/features/ownerProjects/ProjectsTable';
import { ProjectFormModal } from '@/features/ownerProjects/ProjectFormModal';
import { DeleteProjectDialog } from '@/features/ownerProjects/DeleteProjectDialog';

const PAGE_LIMIT = 10;

export default function OwnerProjectsPage() {
  const { t } = useTranslation(['ownerProjects', 'common']);
  const { lang } = useLang();
  const toast = useToast();

  useNoIndexMeta();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState({ open: false, projectId: null });
  const [deletingProject, setDeletingProject] = useState(null);
  const [busyStatusId, setBusyStatusId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = {
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    page,
    limit: PAGE_LIMIT,
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useOwnerProjects(queryParams);
  const { data: categories = [] } = useOwnerCategories();
  const statusMutation = useUpdateOwnerProjectStatus();

  const projects = data?.projects || [];
  const meta = data?.meta || { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 };
  const hasFilters = Boolean(debouncedSearch || statusFilter || categoryFilter);

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setPage(1);
  };

  const handleChangeStatus = async (project, nextStatus) => {
    if (nextStatus === 'published') {
      const hasActivePkg = (project.packages || []).some((p) => p && p.isActive !== false);
      if (!hasActivePkg) {
        toast.error(t('ownerProjects:toasts.publishRequiresPackage'));
        return;
      }
    }

    setBusyStatusId(project.id);
    try {
      await statusMutation.mutateAsync({ id: project.id, status: nextStatus });
      toast.success(
        t('ownerProjects:toasts.statusUpdated', {
          status: t(`ownerProjects:status.${nextStatus}`),
        })
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusyStatusId(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1
              id="projects-page-heading"
              className="text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight"
            >
              {t('ownerProjects:heading')}
            </h1>
            <Badge variant="primary" size="sm" className="font-mono">
              {t('ownerProjects:totalBadge', { count: formatNumber(meta.total ?? projects.length) })}
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            {t('ownerProjects:subtitle')}
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
            {t('ownerProjects:refresh')}
          </Button>
          <Button
            variant="primary-gradient"
            size="sm"
            onClick={() => setFormState({ open: true, projectId: null })}
            iconLeading={<span className="material-symbols-outlined text-[18px]">add_circle</span>}
          >
            {t('ownerProjects:addProject')}
          </Button>
        </div>
      </header>

      {/* Filters (natively supported by GET /api/owner/projects) */}
      <Card padding="sm" className="bg-surface-container-low">
        <search aria-label={t('ownerProjects:filters.regionLabel')}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 min-w-0">
              <label htmlFor="proj-search-input" className="visually-hidden">
                {t('ownerProjects:filters.searchLabel')}
              </label>
              <Input
                id="proj-search-input"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('ownerProjects:filters.searchPlaceholder')}
                iconLeading={<span className="material-symbols-outlined text-[20px]">search</span>}
              />
            </div>

            <div className="md:col-span-3">
              <label htmlFor="proj-status-filter" className="visually-hidden">
                {t('ownerProjects:filters.statusLabel')}
              </label>
              <Select
                id="proj-status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('ownerProjects:filters.allStatuses')}</option>
                <option value="published">{t('ownerProjects:status.published')}</option>
                <option value="draft">{t('ownerProjects:status.draft')}</option>
                <option value="archived">{t('ownerProjects:status.archived')}</option>
              </Select>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="proj-category-filter" className="visually-hidden">
                {t('ownerProjects:filters.categoryLabel')}
              </label>
              <Select
                id="proj-category-filter"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('ownerProjects:filters.allCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {localized(cat.name, lang)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="md:col-span-1 flex justify-end">
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetFilters}
                  aria-label={t('ownerProjects:filters.reset')}
                  title={t('ownerProjects:filters.reset')}
                >
                  <span className="material-symbols-outlined text-[20px]">filter_alt_off</span>
                </Button>
              )}
            </div>
          </div>
        </search>
      </Card>

      {/* Content */}
      {isLoading ? (
        <Card padding="md" className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <Skeleton className="h-12 w-20 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-8 w-24 shrink-0" />
            </div>
          ))}
        </Card>
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="deployed_code"
          title={t('ownerProjects:empty.title')}
          description={
            hasFilters
              ? t('ownerProjects:empty.filteredDescription')
              : t('ownerProjects:empty.description')
          }
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                {t('ownerProjects:filters.reset')}
              </Button>
            ) : (
              <Button
                variant="primary-gradient"
                size="sm"
                onClick={() => setFormState({ open: true, projectId: null })}
                iconLeading={<span className="material-symbols-outlined text-[18px]">add_circle</span>}
              >
                {t('ownerProjects:addProject')}
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-5">
          <ProjectsTable
            projects={projects}
            busyStatusId={busyStatusId}
            onEdit={(proj) => setFormState({ open: true, projectId: proj.id })}
            onChangeStatus={handleChangeStatus}
            onDelete={(proj) => setDeletingProject(proj)}
          />

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </div>
      )}

      {/* Create / Edit Modal */}
      <ProjectFormModal
        isOpen={formState.open}
        projectId={formState.projectId}
        onClose={() => setFormState({ open: false, projectId: null })}
      />

      {/* Delete / PROJECT_HAS_PAID_ORDERS Archive Dialog */}
      <DeleteProjectDialog
        project={deletingProject}
        onClose={() => setDeletingProject(null)}
      />
    </div>
  );
}
