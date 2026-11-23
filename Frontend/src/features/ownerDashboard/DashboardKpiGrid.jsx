import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang } from '../../app/providers';
import { ROUTES } from '../../config/routes';
import { formatMoney } from '../../lib/money';
import { formatNumber } from '../../lib/format';

export function DashboardKpiGrid({ totals = {} }) {
  const { t } = useTranslation('ownerDashboard');
  const { lang } = useLang();

  const revenue = totals.revenue ?? 0;
  const ordersCount = totals.ordersCount ?? 0;
  const paidOrders = totals.paidOrders ?? 0;
  const pendingProofs = totals.pendingProofs ?? 0;
  const newInquiries = totals.newInquiries ?? 0;
  const publishedProjects = totals.publishedProjects ?? 0;

  const cards = [
    {
      key: 'revenue',
      label: t('kpis.revenue.label'),
      value: formatMoney(revenue, lang),
      hint: t('kpis.revenue.hint'),
      icon: 'account_balance_wallet',
      highlight: true,
      iconClasses: 'bc-chip-mint border',
      to: `${ROUTES.OWNER_ORDERS}?status=paid`,
    },
    {
      key: 'ordersCount',
      label: t('kpis.ordersCount.label'),
      value: formatNumber(ordersCount),
      hint: t('kpis.ordersCount.hint'),
      icon: 'shopping_bag',
      iconClasses: 'bc-chip-blue border',
      to: ROUTES.OWNER_ORDERS,
    },
    {
      key: 'paidOrders',
      label: t('kpis.paidOrders.label'),
      value: formatNumber(paidOrders),
      hint: t('kpis.paidOrders.hint'),
      icon: 'verified',
      iconClasses: 'bc-chip-sky border',
      to: `${ROUTES.OWNER_ORDERS}?status=paid`,
    },
    {
      key: 'pendingProofs',
      label: t('kpis.pendingProofs.label'),
      value: formatNumber(pendingProofs),
      hint:
        pendingProofs > 0
          ? t('kpis.pendingProofs.hint')
          : t('kpis.pendingProofs.clearHint'),
      icon: 'receipt_long',
      alert: pendingProofs > 0,
      alertTone: 'warning',
      iconClasses: 'bc-chip-amber border',
      to: `${ROUTES.OWNER_ORDERS}?status=awaiting_review`,
    },
    {
      key: 'newInquiries',
      label: t('kpis.newInquiries.label'),
      value: formatNumber(newInquiries),
      hint:
        newInquiries > 0
          ? t('kpis.newInquiries.hint')
          : t('kpis.newInquiries.clearHint'),
      icon: 'mark_chat_unread',
      alert: newInquiries > 0,
      alertTone: 'primary',
      iconClasses: 'bc-chip-rose border',
      to: `${ROUTES.OWNER_INQUIRIES}?status=new`,
    },
    {
      key: 'publishedProjects',
      label: t('kpis.publishedProjects.label'),
      value: formatNumber(publishedProjects),
      hint: t('kpis.publishedProjects.hint'),
      icon: 'folder_code',
      iconClasses: 'bc-chip-violet border',
      to: ROUTES.OWNER_PROJECTS,
    },
  ];

  return (
    <section
      aria-label={t('title')}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
    >
      {cards.map((card) => (
        <Link
          key={card.key}
          to={card.to}
          className={clsx(
            'group relative rounded-xl border p-5 flex flex-col justify-between gap-4 bg-card shadow-card transition-all duration-200 hover:bg-card-hover hover:shadow-card-hover hover:-translate-y-0.5',
            card.highlight
              ? 'border-primary/40 hover:border-primary'
              : 'border-card-border hover:border-card-hover-border'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-on-surface-variant">
                  {card.label}
                </span>
                {card.alert && (
                  <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                    <span
                      className={clsx(
                        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                        card.alertTone === 'warning' ? 'bg-warning' : 'bg-primary'
                      )}
                    />
                    <span
                      className={clsx(
                        'relative inline-flex rounded-full h-2 w-2',
                        card.alertTone === 'warning' ? 'bg-warning' : 'bg-primary'
                      )}
                    />
                  </span>
                )}
              </div>

              <div
                className={clsx(
                  'mt-2 text-2xl sm:text-3xl font-bold tracking-tight truncate',
                  card.highlight ? 'text-primary' : 'text-on-surface'
                )}
              >
                {card.value}
              </div>
            </div>

            <div
              className={clsx(
                'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                card.iconClasses
              )}
              aria-hidden="true"
            >
              <span className="material-symbols-outlined text-[22px]">
                {card.icon}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-outline-variant/50 text-xs">
            <span
              className={clsx(
                'truncate',
                card.alert
                  ? card.alertTone === 'warning'
                    ? 'text-warning font-medium'
                    : 'text-primary font-medium'
                  : 'text-on-surface-variant'
              )}
            >
              {card.hint}
            </span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors rtl:-scale-x-100 shrink-0">
              arrow_forward
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
