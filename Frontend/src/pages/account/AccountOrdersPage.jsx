import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAccountOrders } from '../../api/account';
import { getApiErrorMessage } from '../../api/client';
import { useLang } from '../../app/providers';
import { formatDateTime } from '../../lib/format';
import { localized } from '../../lib/localized';
import { formatMoney } from '../../lib/money';
import { accountOrderDetailsPath, ROUTES } from '../../config/routes';
import {
  Badge,
  Button,
  Card,
  Pagination,
  Select,
  Skeleton,
} from '../../components/ui';
import { Breadcrumbs, EmptyState, ErrorState } from '../../components/shared';
import { OrderStatusBadge } from '../../features/orders/OrderStatusBadge';
import { AccountNavTabs } from '../../features/account';

const ORDER_STATUSES = [
  'pending_payment',
  'awaiting_review',
  'paid',
  'delivered',
  'rejected',
  'cancelled',
  'refunded',
  'expired',
];

const PAYMENT_METHOD_ICON = {
  vodafone_cash: 'account_balance_wallet',
  instapay: 'swap_horiz',
  fawry: 'receipt_long',
  card: 'credit_card',
};

const PAGE_LIMIT = 10;

export default function AccountOrdersPage() {
  const { t } = useTranslation(['account', 'orders', 'common']);
  const { lang } = useLang();

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const queryParams = useMemo(
    () => ({
      status: status || undefined,
      page,
      limit: PAGE_LIMIT,
    }),
    [status, page]
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAccountOrders(queryParams);

  const orders = data?.orders || [];
  const meta = data?.meta || { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 };

  const handleStatusChange = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
  };

  return (
    <div className="w-full bc-band-wash py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <Breadcrumbs
          items={[
            { label: t('common:nav.home'), href: ROUTES.HOME },
            { label: t('account:page.title'), href: ROUTES.ACCOUNT },
            { label: t('account:orders.title') },
          ]}
        />

        {/* Header + Tabs */}
        <header className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                  {t('account:orders.title')}
                </h1>
                {!isLoading && (
                  <Badge variant="neutral" size="sm">
                    {t('account:orders.totalBadge', { count: meta.total })}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-on-surface-variant">
                {t('account:orders.subtitle')}
              </p>
            </div>

            {isFetching && !isLoading && (
              <span className="text-xs text-primary font-medium">
                {t('common:states.loading')}
              </span>
            )}
          </div>

          <AccountNavTabs activeTab="orders" />
        </header>

        {/* Filter Bar */}
        <Card variant="flat" padding="sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="w-full sm:w-64">
              <label htmlFor="account-orders-status" className="sr-only">
                {t('account:orders.filterLabel')}
              </label>
              <Select
                id="account-orders-status"
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                iconLeading={
                  <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                    filter_list
                  </span>
                }
              >
                <option value="">{t('account:orders.allStatuses')}</option>
                {ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {t(`common:status.order.${st}`, { defaultValue: st })}
                  </option>
                ))}
              </Select>
            </div>

            {status && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange('')}
              >
                {t('common:actions.resetFilters')}
              </Button>
            )}
          </div>
        </Card>

        {/* Orders Content */}
        {isLoading ? (
          <div className="space-y-4" aria-hidden="true">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : isError ? (
          <ErrorState
            title={t('common:states.errorTitle')}
            message={getApiErrorMessage(error, t)}
            onRetry={() => refetch()}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title={
              status
                ? t('account:orders.emptyFilteredTitle')
                : t('account:orders.emptyTitle')
            }
            description={
              status
                ? t('account:orders.emptyFilteredDescription')
                : t('account:orders.emptyDescription')
            }
            action={
              status ? (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => handleStatusChange('')}
                >
                  {t('common:actions.resetFilters')}
                </Button>
              ) : (
                <Link to={ROUTES.PROJECTS}>
                  <Button variant="primary-gradient" size="md">
                    {t('account:orders.browseProjects')}
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-5">
            {/* Desktop Table (md+) */}
            <div className="hidden md:block bg-card border border-card-border rounded-2xl shadow-card overflow-hidden">
              <div role="region" aria-label={t('account:orders.tableRegion')} className="overflow-x-auto bc-scroll">
                <table className="min-w-full text-sm text-start border-collapse">
                  <thead className="bg-section-band border-b border-card-border text-xs font-semibold text-muted uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="py-3.5 px-3.5 text-start whitespace-nowrap">
                        {t('account:orders.columns.order')}
                      </th>
                      <th scope="col" className="py-3.5 px-3.5 text-start whitespace-nowrap">
                        {t('account:orders.columns.project')}
                      </th>
                      <th scope="col" className="py-3.5 px-3.5 text-start whitespace-nowrap">
                        {t('account:orders.columns.status')}
                      </th>
                      <th scope="col" className="py-3.5 px-3.5 text-start whitespace-nowrap">
                        {t('account:orders.columns.payment')}
                      </th>
                      <th scope="col" className="py-3.5 px-3.5 text-start whitespace-nowrap">
                        {t('account:orders.columns.total')}
                      </th>
                      <th scope="col" className="py-3.5 px-3.5 text-start whitespace-nowrap">
                        {t('account:orders.columns.date')}
                      </th>
                      <th scope="col" className="py-3.5 px-3.5 text-end whitespace-nowrap">
                        {t('account:orders.columns.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {orders.map((order) => {
                      const methodIcon =
                        PAYMENT_METHOD_ICON[order.paymentMethod] || 'payments';
                      return (
                        <tr
                          key={order.orderNumber}
                          className="even:bg-section-band/35 hover:bg-brand-soft/30 transition-colors"
                        >
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <Link
                              to={accountOrderDetailsPath(order.orderNumber)}
                              className="font-mono font-bold text-primary hover:underline"
                            >
                              <bdi dir="ltr">{order.orderNumber}</bdi>
                            </Link>
                          </td>
                          <td className="py-3.5 px-3.5 max-w-[260px]">
                            <div className="font-semibold text-on-surface truncate">
                              {localized(order.snapshot?.title, lang)}
                            </div>
                            {order.snapshot?.packageName && (
                              <div className="text-xs text-muted truncate mt-0.5">
                                {localized(order.snapshot.packageName, lang)}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <OrderStatusBadge status={order.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
                              <span className="material-symbols-rounded text-[17px]" aria-hidden="true">
                                {methodIcon}
                              </span>
                              <span>
                                {t(`common:paymentMethods.${order.paymentMethod}`, {
                                  defaultValue: order.paymentMethod,
                                })}
                              </span>
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap font-mono font-bold text-on-surface">
                            {order.isFreeOrder
                              ? t('common:currency.free')
                              : formatMoney(order.pricing?.total || 0, lang)}
                          </td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap text-xs text-muted">
                            {formatDateTime(order.createdAt, lang)}
                          </td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap text-end">
                            <Link to={accountOrderDetailsPath(order.orderNumber)}>
                              <Button variant="outline" size="sm">
                                {t('common:actions.viewDetails')}
                              </Button>
                            </Link>
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
                const methodIcon =
                  PAYMENT_METHOD_ICON[order.paymentMethod] || 'payments';
                return (
                  <Card
                    key={order.orderNumber}
                    variant="panel"
                    padding="sm"
                    className="space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="space-y-1 min-w-0">
                        <Link
                          to={accountOrderDetailsPath(order.orderNumber)}
                          className="font-mono text-sm font-bold text-primary hover:underline block"
                        >
                          <bdi dir="ltr">{order.orderNumber}</bdi>
                        </Link>
                        <div className="text-xs text-muted">
                          {formatDateTime(order.createdAt, lang)}
                        </div>
                      </div>

                      <OrderStatusBadge status={order.status} size="sm" />
                    </div>

                    <div className="pt-2 border-t border-outline-variant/60 space-y-1">
                      <div className="text-sm font-bold text-on-surface">
                        {localized(order.snapshot?.title, lang)}
                      </div>
                      {order.snapshot?.packageName && (
                        <div className="text-xs text-muted">
                          {localized(order.snapshot.packageName, lang)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/60 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <span className="material-symbols-rounded text-[17px]" aria-hidden="true">
                          {methodIcon}
                        </span>
                        <span>
                          {t(`common:paymentMethods.${order.paymentMethod}`, {
                            defaultValue: order.paymentMethod,
                          })}
                        </span>
                      </span>

                      <span className="font-mono text-sm font-extrabold text-on-surface">
                        {order.isFreeOrder
                          ? t('common:currency.free')
                          : formatMoney(order.pricing?.total || 0, lang)}
                      </span>
                    </div>

                    <Link
                      to={accountOrderDetailsPath(order.orderNumber)}
                      className="block w-full"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        {t('account:orders.viewOrder')}
                      </Button>
                    </Link>
                  </Card>
                );
              })}
            </div>

            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(nextPage) => {
                setPage(nextPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
