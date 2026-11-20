import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { useOwnerDashboard } from '../../api/owner/dashboard';
import { ROUTES } from '../../config/routes';
import { Button, Card } from '../../components/ui';
import { ErrorState } from '../../components/shared';
import { OwnerPageHeader, useOwner } from '../../components/layout/OwnerLayout';
import {
  DashboardKpiGrid,
  DashboardSkeleton,
  OrdersStatusChart,
  RecentInquiriesCard,
  RecentOrdersCard,
  RevenueTrendChart,
  TopProjectsCard,
} from '../../features/ownerDashboard';

export default function OwnerDashboardPage() {
  const { t } = useTranslation(['ownerDashboard', 'owner']);
  const { lang } = useLang();
  const { owner } = useOwner();
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOwnerDashboard();

  const cairoNowLabel = new Intl.DateTimeFormat(
    lang === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn',
    {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(new Date());

  const totals = data?.totals || {};
  const isCompletelyEmpty =
    data &&
    (totals.ordersCount ?? 0) === 0 &&
    (totals.publishedProjects ?? 0) === 0 &&
    (data.topProjects?.length ?? 0) === 0 &&
    (data.recentInquiries?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <OwnerPageHeader
        title={t('ownerDashboard:title')}
        description={t('ownerDashboard:description')}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
            {t('ownerDashboard:liveSync')}
          </span>
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              loading={isFetching && !isLoading}
              onClick={() => refetch()}
              iconLeading={
                <span className="material-symbols-outlined text-[18px]">
                  refresh
                </span>
              }
            >
              {t('ownerDashboard:actions.refresh')}
            </Button>
            <Link to={ROUTES.OWNER_PROJECTS}>
              <Button
                variant="primary-gradient"
                size="sm"
                iconLeading={
                  <span className="material-symbols-outlined text-[18px]">
                    folder_code
                  </span>
                }
              >
                {t('ownerDashboard:actions.manageProjects')}
              </Button>
            </Link>
          </>
        }
      />

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <ErrorState
          title={t('ownerDashboard:error.title')}
          message={error?.message || t('ownerDashboard:error.description')}
          onRetry={refetch}
        />
      ) : (
        <div className="space-y-6">
          {/* Greeting Banner (aligned with bytecraft_8) */}
          <Card variant="flat" className="relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -top-24 -end-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none"
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-on-surface-variant">
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                    {t('owner:consoleBadge')}
                  </span>
                  <span>
                    {cairoNowLabel} · {t('ownerDashboard:cairoTime')}
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-on-surface">
                  {t('ownerDashboard:greeting', {
                    name: owner?.name || 'ByteCraft',
                  })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link to={ROUTES.OWNER_ORDERS}>
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeading={
                      <span className="material-symbols-outlined text-[18px]">
                        shopping_bag
                      </span>
                    }
                  >
                    {t('ownerDashboard:actions.manageOrders')}
                  </Button>
                </Link>
                <Link to={ROUTES.OWNER_SETTINGS}>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeading={
                      <span className="material-symbols-outlined text-[18px]">
                        settings
                      </span>
                    }
                  >
                    {t('ownerDashboard:actions.settings')}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Optional Getting Started Banner when DB is completely empty */}
          {isCompletelyEmpty && (
            <Card
              variant="default"
              className="border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">
                    rocket_launch
                  </span>
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-on-surface">
                    {t('ownerDashboard:gettingStarted.title')}
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                    {t('ownerDashboard:gettingStarted.description')}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link to={ROUTES.OWNER_PROJECTS}>
                  <Button variant="primary-gradient" size="sm">
                    {t('ownerDashboard:gettingStarted.addProjectAction')}
                  </Button>
                </Link>
                <Link to={ROUTES.OWNER_SETTINGS}>
                  <Button variant="secondary" size="sm">
                    {t('ownerDashboard:gettingStarted.settingsAction')}
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* 6 KPI Tiles */}
          <DashboardKpiGrid totals={totals} />

          {/* Charts Row: 12-Month Revenue (2 cols) + Orders by Status (1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <RevenueTrendChart revenueByMonth={data?.revenueByMonth || []} />
            </div>
            <div>
              <OrdersStatusChart ordersByStatus={data?.ordersByStatus || []} />
            </div>
          </div>

          {/* Top Projects */}
          <TopProjectsCard topProjects={data?.topProjects || []} />

          {/* Recent Orders + Recent Inquiries */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <RecentOrdersCard recentOrders={data?.recentOrders || []} />
            <RecentInquiriesCard recentInquiries={data?.recentInquiries || []} />
          </div>
        </div>
      )}
    </div>
  );
}
