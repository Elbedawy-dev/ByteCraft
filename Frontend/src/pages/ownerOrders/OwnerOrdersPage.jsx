import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang, useToast } from '@/app/providers';
import { useOwnerPageTitle } from '@/components/layout/OwnerLayout';
import { getApiErrorMessage } from '@/api/client';
import { useCleanupExpiredOrders, useOwnerOrders } from '@/api/owner/orders';
import { formatDateTime } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { localized } from '@/lib/localized';
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
import { OrderDetailDrawer } from '@/features/ownerOrders/OrderDetailDrawer';
import {
  ORDER_STATUSES,
  ORDER_STATUS_BADGE_VARIANT,
  PAYMENT_METHODS,
  PAYMENT_METHOD_ICON,
} from '@/features/ownerOrders/orderMeta';

const PAGE_LIMIT = 15;

export default function OwnerOrdersPage() {
  const { t } = useTranslation(['ownerOrders', 'common']);
  const { lang } = useLang();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  useOwnerPageTitle(t('ownerOrders:title'));

  // Filters & Pagination state (initialized from URL ?status= for notification bell links)
  const urlStatus = searchParams.get('status') || '';
  const initialStatus = ORDER_STATUSES.includes(urlStatus) ? urlStatus : '';
  const [status, setStatus] = useState(initialStatus);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  // Selected order drawer & cleanup confirm state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cleanupOpen, setCleanupOpen] = useState(false);

  useEffect(() => {
    const nextUrlStatus = searchParams.get('status') || '';
    if (nextUrlStatus && ORDER_STATUSES.includes(nextUrlStatus) && nextUrlStatus !== status) {
      setStatus(nextUrlStatus);
      setPage(1);
    }
  }, [searchParams, status]);

  const handleStatusChange = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
    if (searchParams.has('status')) {
      const next = new URLSearchParams(searchParams);
      if (nextStatus) {
        next.set('status', nextStatus);
      } else {
        next.delete('status');
      }
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = {
    status: status || undefined,
    paymentMethod: paymentMethod || undefined,
    search: debouncedSearch || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    page,
    limit: PAGE_LIMIT,
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useOwnerOrders(queryParams);
  const cleanupMutation = useCleanupExpiredOrders();

  const orders = data?.orders || [];
  const meta = data?.meta || { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 };

  const hasActiveFilters = Boolean(status || paymentMethod || debouncedSearch || fromDate || toDate);
  const awaitingInPage = orders.filter((o) => o.status === 'awaiting_review').length;

  const handleResetFilters = () => {
    handleStatusChange('');
    setPaymentMethod('');
    setSearchInput('');
    setDebouncedSearch('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleCleanup = async () => {
    try {
      const result = await cleanupMutation.mutateAsync({});
      const count = result?.expiredCount ?? 0;
      if (count > 0) {
        toast.success(t('ownerOrders:cleanup.success', { count }));
      } else {
        toast.info(t('ownerOrders:cleanup.noneExpired'));
      }
      setCleanupOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const rangeFrom = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const rangeTo = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low p-5 sm:p-6">
        <div
          className="pointer-events-none absolute -top-20 -end-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {t('ownerOrders:title')}
              </h1>
              <Badge variant="neutral" size="md">
                <bdi dir="ltr" className="font-mono">
                  {meta.total}
                </bdi>
              </Badge>
              {awaitingInPage > 0 && (
                <Badge variant="primary" dot size="md">
                  {t('ownerOrders:stats.awaitingReview')}:{' '}
                  <bdi dir="ltr" className="font-mono font-bold">
                    {awaitingInPage}
                  </bdi>
                </Badge>
              )}
            </div>
            <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl">
              {t('ownerOrders:subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCleanupOpen(true)}
              loading={cleanupMutation.isPending}
              iconLeading={
                <span className="material-symbols-outlined text-[18px]">cleaning_services</span>
              }
            >
              {t('ownerOrders:cleanup.button')}
            </Button>
          </div>
        </div>
      </header>

      {/* Filters Panel */}
      <Card variant="flat" padding="sm" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor="orders-search" className="sr-only">
              {t('ownerOrders:filters.searchLabel')}
            </label>
            <Input
              id="orders-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('ownerOrders:filters.searchPlaceholder')}
              className="placeholder:text-outline"
              iconLeading={<span className="material-symbols-outlined text-[20px]">search</span>}
            />
          </div>

          {/* Status Select */}
          <div className="lg:col-span-2">
            <label htmlFor="orders-status-filter" className="sr-only">
              {t('ownerOrders:filters.statusLabel')}
            </label>
            <Select
              id="orders-status-filter"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="">{t('ownerOrders:filters.allStatuses')}</option>
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {t(`ownerOrders:status.${st}`)}
                </option>
              ))}
            </Select>
          </div>

          {/* Payment Method Select */}
          <div className="lg:col-span-2">
            <label htmlFor="orders-payment-filter" className="sr-only">
              {t('ownerOrders:filters.paymentMethodLabel')}
            </label>
            <Select
              id="orders-payment-filter"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('ownerOrders:filters.allPaymentMethods')}</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {t(`ownerOrders:paymentMethod.${pm}`)}
                </option>
              ))}
            </Select>
          </div>

          {/* Date Range: From */}
          <div className="lg:col-span-2">
            <label htmlFor="orders-from-date" className="block text-[11px] font-medium text-on-surface-variant mb-1 sm:hidden">
              {t('ownerOrders:filters.fromDate')}
            </label>
            <Input
              id="orders-from-date"
              type="date"
              dir="ltr"
              value={fromDate}
              aria-label={t('ownerOrders:filters.fromDate')}
              title={t('ownerOrders:filters.fromDate')}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Date Range: To */}
          <div className="lg:col-span-2">
            <label htmlFor="orders-to-date" className="block text-[11px] font-medium text-on-surface-variant mb-1 sm:hidden">
              {t('ownerOrders:filters.toDate')}
            </label>
            <Input
              id="orders-to-date"
              type="date"
              dir="ltr"
              value={toDate}
              aria-label={t('ownerOrders:filters.toDate')}
              title={t('ownerOrders:filters.toDate')}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Quick Status Chips + Reset */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { key: '', label: t('ownerOrders:filters.allStatuses') },
              { key: 'awaiting_review', label: t('ownerOrders:status.awaiting_review') },
              { key: 'pending_payment', label: t('ownerOrders:status.pending_payment') },
              { key: 'paid', label: t('ownerOrders:status.paid') },
              { key: 'delivered', label: t('ownerOrders:status.delivered') },
              { key: 'rejected', label: t('ownerOrders:status.rejected') },
              { key: 'refunded', label: t('ownerOrders:status.refunded') },
              { key: 'expired', label: t('ownerOrders:status.expired') },
            ].map((chip) => {
              const active = status === chip.key;
              return (
                <button
                  key={chip.key || 'all'}
                  type="button"
                  onClick={() => handleStatusChange(chip.key)}
                  className={clsx(
                    'px-3 h-9 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                    active
                      ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-transparent'
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              iconLeading={<span className="material-symbols-outlined text-[16px]">filter_alt_off</span>}
            >
              {t('ownerOrders:filters.clearFilters')}
            </Button>
          )}
        </div>
      </Card>

      {/* Content Area */}
      {isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />
      ) : isLoading ? (
        <Card padding="none" className="overflow-hidden">
          <div className="p-4 sm:p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="shopping_bag"
          title={
            hasActiveFilters
              ? t('ownerOrders:empty.title')
              : t('ownerOrders:empty.noOrdersTitle')
          }
          description={
            hasActiveFilters
              ? t('ownerOrders:empty.description')
              : t('ownerOrders:empty.noOrdersDescription')
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                {t('ownerOrders:filters.clearFilters')}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className={clsx('space-y-4 transition-opacity', isFetching && 'opacity-70')}>
          {/* Desktop Table (md and up) */}
          <div className="hidden md:block rounded-xl border border-outline-variant bg-surface-container overflow-hidden">
            <div
              tabIndex={0}
              role="region"
              aria-label={t('ownerOrders:table.regionLabel')}
              className="w-full overflow-x-auto"
            >
              <table className="w-full text-start border-collapse text-sm">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low/80 text-on-surface-variant text-xs font-semibold">
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerOrders:table.order')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerOrders:table.customer')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerOrders:table.projectPackage')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerOrders:table.payment')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerOrders:table.total')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerOrders:table.status')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-end whitespace-nowrap">
                      {t('ownerOrders:table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {orders.map((order) => {
                    const id = order._id || order.id;
                    const isPendingProof = order.status === 'awaiting_review';
                    const statusVariant = ORDER_STATUS_BADGE_VARIANT[order.status] || 'neutral';
                    return (
                      <tr
                        key={id}
                        onClick={() => setSelectedOrder(order)}
                        className={clsx(
                          'transition-colors cursor-pointer group',
                          isPendingProof
                            ? 'bg-primary/[0.06] hover:bg-primary/[0.11]'
                            : 'hover:bg-surface-container-high/50'
                        )}
                      >
                        <td
                          className={clsx(
                            'py-3.5 px-4 align-top',
                            isPendingProof && 'border-s-4 border-primary'
                          )}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              {isPendingProof && (
                                <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                </span>
                              )}
                              <bdi dir="ltr" className="font-mono font-semibold text-on-surface group-hover:text-primary transition-colors">
                                {order.orderNumber}
                              </bdi>
                            </div>
                            <span className="text-[11px] font-mono text-on-surface-variant whitespace-nowrap">
                              {formatDateTime(order.createdAt, lang)}
                            </span>
                            {isPendingProof && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                                <span className="material-symbols-outlined text-[14px]">
                                  receipt_long
                                </span>
                                <span>{t('ownerOrders:table.pendingProofBadge')}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top max-w-[220px]">
                          <div className="flex flex-col min-w-0">
                            <span
                              className="font-semibold text-on-surface truncate"
                              title={order.customer?.fullName}
                            >
                              {order.customer?.fullName || '—'}
                            </span>
                            <span
                              className="text-xs text-on-surface-variant truncate mt-0.5"
                              title={order.customer?.email}
                            >
                              <bdi dir="ltr">{order.customer?.email || '—'}</bdi>
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top max-w-[220px]">
                          <div className="flex flex-col min-w-0">
                            <span
                              className="font-medium text-on-surface truncate"
                              title={localized(order.snapshot?.title, lang)}
                            >
                              {localized(order.snapshot?.title, lang) || order.snapshot?.slug || '—'}
                            </span>
                            <span className="text-xs text-on-surface-variant truncate mt-0.5">
                              {localized(order.snapshot?.packageName, lang) || order.snapshot?.packageKey}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              {PAYMENT_METHOD_ICON[order.paymentMethod] || 'payments'}
                            </span>
                            <span>
                              {t(`ownerOrders:paymentMethod.${order.paymentMethod}`, {
                                defaultValue: order.paymentMethod,
                              })}
                            </span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono font-bold text-primary">
                              {formatMoney(order.pricing?.total || 0, lang)}
                            </span>
                            {order.isFreeOrder && (
                              <Badge variant="primary" size="sm" className="w-fit">
                                {t('ownerOrders:table.freeBadge')}
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <Badge variant={statusVariant} dot size="sm">
                            {t(`ownerOrders:status.${order.status}`, {
                              defaultValue: order.status,
                            })}
                          </Badge>
                        </td>

                        <td
                          className="py-3.5 px-4 align-top text-end whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            iconLeading={
                              <span className="material-symbols-outlined text-[16px]">
                                visibility
                              </span>
                            }
                          >
                            {t('ownerOrders:table.viewDetails')}
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
            {orders.map((order) => {
              const id = order._id || order.id;
              const isPendingProof = order.status === 'awaiting_review';
              const statusVariant = ORDER_STATUS_BADGE_VARIANT[order.status] || 'neutral';
              return (
                <article
                  key={id}
                  className={clsx(
                    'rounded-xl border p-4 space-y-3 transition-colors',
                    isPendingProof
                      ? 'bg-primary/[0.06] border-primary/50 border-s-4'
                      : 'bg-surface-container border-outline-variant'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isPendingProof && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                        )}
                        <bdi dir="ltr" className="font-mono font-bold text-sm text-on-surface">
                          {order.orderNumber}
                        </bdi>
                      </div>
                      <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                        {formatDateTime(order.createdAt, lang)}
                      </div>
                    </div>
                    <Badge variant={statusVariant} dot size="sm">
                      {t(`ownerOrders:status.${order.status}`, { defaultValue: order.status })}
                    </Badge>
                  </div>

                  {isPendingProof && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 text-primary text-xs font-semibold">
                      <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                      <span>{t('ownerOrders:table.pendingProofBadge')}</span>
                    </div>
                  )}

                  <div className="space-y-1 text-xs sm:text-sm min-w-0">
                    <div className="font-semibold text-on-surface break-words">
                      {order.customer?.fullName || '—'}
                    </div>
                    <div className="text-on-surface-variant break-all">
                      <bdi dir="ltr">{order.customer?.email || '—'}</bdi>
                    </div>
                    <div className="text-on-surface-variant pt-1 break-words">
                      <span className="text-on-surface font-medium">
                        {localized(order.snapshot?.title, lang)}
                      </span>{' '}
                      • {localized(order.snapshot?.packageName, lang)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-outline-variant/60">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-primary text-base">
                        {formatMoney(order.pricing?.total || 0, lang)}
                      </div>
                      <div className="text-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          {PAYMENT_METHOD_ICON[order.paymentMethod] || 'payments'}
                        </span>
                        <span>
                          {t(`ownerOrders:paymentMethod.${order.paymentMethod}`, {
                            defaultValue: order.paymentMethod,
                          })}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      iconLeading={
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      }
                    >
                      {t('ownerOrders:table.viewDetails')}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs font-mono text-on-surface-variant">
              {t('ownerOrders:stats.showing', {
                from: rangeFrom,
                to: rangeTo,
                total: meta.total,
              })}
            </span>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(nextPage) => setPage(nextPage)}
            />
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <OrderDetailDrawer
        orderId={selectedOrder?._id || selectedOrder?.id || null}
        initialOrder={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Clean Expired Orders Confirm Dialog */}
      <OwnerConfirmDialog
        isOpen={cleanupOpen}
        onClose={() => setCleanupOpen(false)}
        onConfirm={handleCleanup}
        variant="primary"
        loading={cleanupMutation.isPending}
        title={t('ownerOrders:cleanup.dialogTitle')}
        message={t('ownerOrders:cleanup.dialogMessage')}
        confirmText={t('ownerOrders:cleanup.confirm')}
        cancelText={t('common:actions.cancel')}
      />
    </div>
  );
}
