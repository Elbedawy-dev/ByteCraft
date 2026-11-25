import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang, useToast } from '@/app/providers';
import { useOwnerPageTitle } from '@/components/layout/OwnerLayout';
import { getApiErrorMessage } from '@/api/client';
import { useOwnerCustomers, useUpdateOwnerUserStatus } from '@/api/owner/users';
import { formatDateTime, formatNumber } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  Input,
  Pagination,
  Select,
  Skeleton,
} from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/shared';
import { OwnerConfirmDialog } from '@/features/ownerOrders/NativeDialog';

const PAGE_LIMIT = 20;

export default function OwnerUsersPage() {
  const { t } = useTranslation(['ownerUsers', 'common']);
  const { lang } = useLang();
  const toast = useToast();

  useOwnerPageTitle(t('ownerUsers:customers.title'));

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = {
    search: debouncedSearch || undefined,
    status: status || undefined,
    page,
    limit: PAGE_LIMIT,
  };

  const { data, isLoading, isFetching, isError, error, refetch } =
    useOwnerCustomers(queryParams);
  const updateStatusMutation = useUpdateOwnerUserStatus();

  const users = data?.users || [];
  const meta = data?.meta || { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 };

  const hasActiveFilters = Boolean(debouncedSearch || status);

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatus('');
    setPage(1);
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmTarget) return;
    const nextStatus = confirmTarget.status === 'active' ? 'disabled' : 'active';
    try {
      await updateStatusMutation.mutateAsync({
        id: confirmTarget.id,
        status: nextStatus,
      });
      toast.success(
        nextStatus === 'disabled'
          ? t('ownerUsers:customers.toasts.disabled')
          : t('ownerUsers:customers.toasts.enabled')
      );
      setConfirmTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t));
    }
  };

  const nextActionIsDisable = confirmTarget?.status === 'active';

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              {t('ownerUsers:customers.title')}
            </h1>
            {!isLoading && (
              <Badge variant="neutral" size="sm">
                {t('ownerUsers:customers.totalBadge', { count: meta.total })}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            {t('ownerUsers:customers.subtitle')}
          </p>
        </div>

        {isFetching && !isLoading && (
          <span className="text-xs text-primary font-medium shrink-0">
            {t('common:states.loading')}
          </span>
        )}
      </header>

      {/* Filters */}
      <Card variant="flat" padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 lg:col-span-7">
            <label htmlFor="owner-users-search" className="sr-only">
              {t('ownerUsers:customers.filters.searchLabel')}
            </label>
            <Input
              id="owner-users-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('ownerUsers:customers.filters.searchPlaceholder')}
              iconLeading={
                <span className="material-symbols-rounded text-[20px]" aria-hidden="true">
                  search
                </span>
              }
            />
          </div>

          <div className="sm:col-span-4 lg:col-span-3">
            <label htmlFor="owner-users-status" className="sr-only">
              {t('ownerUsers:customers.filters.statusLabel')}
            </label>
            <Select
              id="owner-users-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('ownerUsers:customers.filters.allStatuses')}</option>
              <option value="active">{t('ownerUsers:status.active')}</option>
              <option value="disabled">{t('ownerUsers:status.disabled')}</option>
            </Select>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="w-full sm:w-auto"
              >
                {t('common:actions.resetFilters')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3" aria-hidden="true">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState
          title={t('common:states.errorTitle')}
          message={getApiErrorMessage(error, t)}
          onRetry={refetch}
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon="group"
          title={
            hasActiveFilters
              ? t('ownerUsers:customers.emptyFilteredTitle')
              : t('ownerUsers:customers.emptyTitle')
          }
          description={
            hasActiveFilters
              ? t('ownerUsers:customers.emptyFilteredDescription')
              : t('ownerUsers:customers.emptyDescription')
          }
          action={
            hasActiveFilters ? (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters}>
                {t('common:actions.resetFilters')}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-5">
          {/* Desktop Table */}
          <div className="hidden md:block bg-card border border-card-border rounded-2xl shadow-card overflow-hidden">
            <div
              role="region"
              aria-label={t('ownerUsers:customers.tableRegion')}
              className="overflow-x-auto bc-scroll"
            >
              <table className="min-w-full text-sm text-start border-collapse">
                <thead className="bg-section-band border-b border-card-border text-xs font-semibold text-muted uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerUsers:customers.columns.customer')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerUsers:customers.columns.verification')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerUsers:customers.columns.status')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerUsers:customers.columns.orders')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerUsers:customers.columns.joined')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-end whitespace-nowrap">
                      {t('ownerUsers:customers.columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {users.map((u) => {
                    const isActive = u.status === 'active';
                    return (
                      <tr
                        key={u.id}
                        className="even:bg-section-band/35 hover:bg-brand-soft/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-on-surface truncate">
                            {u.name}
                          </div>
                          <div className="text-xs text-muted truncate">
                            <bdi dir="ltr">{u.email}</bdi>
                          </div>
                          {u.phone && (
                            <div className="text-xs text-muted font-mono truncate">
                              <bdi dir="ltr">{u.phone}</bdi>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge
                            variant={u.emailVerified ? 'success' : 'warning'}
                            size="sm"
                            dot
                          >
                            {u.emailVerified
                              ? t('ownerUsers:verification.verified')
                              : t('ownerUsers:verification.unverified')}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge
                            variant={isActive ? 'success' : 'error'}
                            size="sm"
                            dot
                          >
                            {t(`ownerUsers:status.${u.status}`, {
                              defaultValue: u.status,
                            })}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold text-on-surface">
                          {formatNumber(u.ordersCount ?? 0, lang)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-muted">
                          {formatDateTime(u.createdAt, lang)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-end">
                          <Button
                            type="button"
                            variant={isActive ? 'outline' : 'secondary'}
                            size="sm"
                            onClick={() => setConfirmTarget(u)}
                          >
                            {isActive
                              ? t('ownerUsers:customers.actions.disable')
                              : t('ownerUsers:customers.actions.enable')}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards (< md) */}
          <div className="md:hidden space-y-3">
            {users.map((u) => {
              const isActive = u.status === 'active';
              return (
                <Card key={u.id} variant="panel" padding="sm" className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-on-surface truncate">
                        {u.name}
                      </div>
                      <div className="text-xs text-muted truncate">
                        <bdi dir="ltr">{u.email}</bdi>
                      </div>
                      {u.phone && (
                        <div className="text-xs text-muted font-mono truncate">
                          <bdi dir="ltr">{u.phone}</bdi>
                        </div>
                      )}
                    </div>
                    <Badge variant={isActive ? 'success' : 'error'} size="sm" dot>
                      {t(`ownerUsers:status.${u.status}`, { defaultValue: u.status })}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-2 border-t border-outline-variant/60">
                    <Badge
                      variant={u.emailVerified ? 'success' : 'warning'}
                      size="sm"
                      dot
                    >
                      {u.emailVerified
                        ? t('ownerUsers:verification.verified')
                        : t('ownerUsers:verification.unverified')}
                    </Badge>

                    <span className="text-muted">
                      {t('ownerUsers:customers.columns.orders')}:{' '}
                      <strong className="font-mono text-on-surface">
                        {formatNumber(u.ordersCount ?? 0, lang)}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/60">
                    <span className="text-xs text-muted">
                      {formatDateTime(u.createdAt, lang)}
                    </span>
                    <Button
                      type="button"
                      variant={isActive ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => setConfirmTarget(u)}
                    >
                      {isActive
                        ? t('ownerUsers:customers.actions.disable')
                        : t('ownerUsers:customers.actions.enable')}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Enable / Disable Confirm Dialog */}
      <OwnerConfirmDialog
        isOpen={Boolean(confirmTarget)}
        onClose={() => {
          if (!updateStatusMutation.isPending) setConfirmTarget(null);
        }}
        onConfirm={handleConfirmStatusChange}
        title={
          nextActionIsDisable
            ? t('ownerUsers:customers.confirmDisable.title')
            : t('ownerUsers:customers.confirmEnable.title')
        }
        message={
          confirmTarget
            ? nextActionIsDisable
              ? t('ownerUsers:customers.confirmDisable.message', {
                  name: confirmTarget.name,
                  email: confirmTarget.email,
                })
              : t('ownerUsers:customers.confirmEnable.message', {
                  name: confirmTarget.name,
                  email: confirmTarget.email,
                })
            : ''
        }
        confirmText={
          nextActionIsDisable
            ? t('ownerUsers:customers.actions.disable')
            : t('ownerUsers:customers.actions.enable')
        }
        cancelText={t('common:actions.cancel')}
        variant={nextActionIsDisable ? 'danger' : 'primary'}
        loading={updateStatusMutation.isPending}
      />
    </div>
  );
}
