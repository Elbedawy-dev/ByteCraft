import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { ROUTES } from '../../config/routes';
import { Card } from '../../components/ui';
import { EmptyState } from '../../components/shared';
import { localized } from '../../lib/localized';
import { formatMoney } from '../../lib/money';
import { formatDate } from '../../lib/format';
import { OwnerStatusBadge } from './OwnerStatusBadge';

export function RecentOrdersCard({ recentOrders = [] }) {
  const { t } = useTranslation(['ownerDashboard', 'owner', 'common']);
  const { lang } = useLang();

  return (
    <Card variant="flat" className="flex flex-col justify-between h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              shopping_bag
            </span>
            <span>{t('ownerDashboard:recentOrders.title')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            {t('ownerDashboard:recentOrders.subtitle')}
          </p>
        </div>

        <Link
          to={ROUTES.OWNER_ORDERS}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-surface border border-card-border text-xs font-semibold text-primary hover:bg-card-hover hover:border-card-hover-border transition-colors"
        >
          <span>{t('ownerDashboard:recentOrders.viewAll')}</span>
          <span className="material-symbols-outlined text-[15px] rtl:-scale-x-100">
            arrow_forward
          </span>
        </Link>
      </div>

      {recentOrders.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title={t('ownerDashboard:recentOrders.emptyTitle')}
          description={t('ownerDashboard:recentOrders.emptyDesc')}
        />
      ) : (
        <>
          {/* Mobile Cards View (< sm) */}
          <div className="flex flex-col gap-3 sm:hidden">
            {recentOrders.map((order, idx) => {
              const title = localized(order.snapshot?.title, lang);
              const amountLabel = order.isFreeOrder
                ? t('owner:common.freeOrder')
                : formatMoney(order.pricing?.total ?? 0, lang);

              return (
                <div
                  key={order._id || order.id || order.orderNumber || idx}
                  className="rounded-xl bg-surface border border-card-border p-3.5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-semibold text-primary">
                        <bdi dir="ltr">{order.orderNumber}</bdi>
                      </div>
                      <div className="text-sm font-semibold text-on-surface truncate mt-0.5">
                        {order.customer?.fullName}
                      </div>
                    </div>
                    <OwnerStatusBadge type="order" status={order.status} />
                  </div>

                  <div className="text-xs text-on-surface-variant truncate">
                    {title}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/50 text-xs">
                    <span className="text-on-surface-variant">
                      {t(`common:paymentMethods.${order.paymentMethod}`, {
                        defaultValue: order.paymentMethod,
                      })}
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {amountLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop/Tablet Scrollable Table (>= sm) */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-card-border bg-surface">
            <table className="w-full text-start border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-card-border bg-surface-container-high text-on-surface-variant text-xs font-semibold">
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">
                    {t('ownerDashboard:recentOrders.columns.orderCustomer')}
                  </th>
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">
                    {t('ownerDashboard:recentOrders.columns.project')}
                  </th>
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">
                    {t('ownerDashboard:recentOrders.columns.payment')}
                  </th>
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">
                    {t('ownerDashboard:recentOrders.columns.amount')}
                  </th>
                  <th className="py-3 px-3.5 text-end whitespace-nowrap">
                    {t('ownerDashboard:recentOrders.columns.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {recentOrders.map((order, idx) => {
                  const title = localized(order.snapshot?.title, lang);
                  const amountLabel = order.isFreeOrder
                    ? t('owner:common.freeOrder')
                    : formatMoney(order.pricing?.total ?? 0, lang);

                  return (
                    <tr
                      key={order._id || order.id || order.orderNumber || idx}
                      className="even:bg-section-band hover:bg-surface-container-high/60 transition-colors"
                    >
                      <td className="py-3 px-3.5 align-top">
                        <div className="font-semibold text-on-surface whitespace-nowrap">
                          {order.customer?.fullName}
                        </div>
                        <div className="text-[11px] font-mono text-on-surface-variant mt-0.5 whitespace-nowrap">
                          <bdi dir="ltr">{order.orderNumber}</bdi> ·{' '}
                          {formatDate(order.createdAt, lang)}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 align-top max-w-[180px]">
                        <span className="text-on-surface font-medium line-clamp-2">
                          {title}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 align-top whitespace-nowrap text-xs text-on-surface-variant">
                        {t(`common:paymentMethods.${order.paymentMethod}`, {
                          defaultValue: order.paymentMethod,
                        })}
                      </td>
                      <td className="py-3 px-3.5 align-top whitespace-nowrap font-mono font-bold text-primary text-xs">
                        {amountLabel}
                      </td>
                      <td className="py-3 px-3.5 align-top text-end whitespace-nowrap">
                        <OwnerStatusBadge type="order" status={order.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
