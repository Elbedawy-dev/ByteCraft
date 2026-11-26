import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAccountOrder } from '../../api/account';
import { getOrderBootstrap, setOrderBootstrap } from '../../api/orderTracking';
import { ApiError, getApiErrorMessage } from '../../api/client';
import { useLang } from '../../app/providers';
import { formatDateTime } from '../../lib/format';
import { ROUTES } from '../../config/routes';
import { Badge, Button, Card, Skeleton } from '../../components/ui';
import { Breadcrumbs, ErrorState } from '../../components/shared';
import { OrderStatusBadge } from '../../features/orders/OrderStatusBadge';
import { OrderStatusTimeline } from '../../features/orders/OrderStatusTimeline';
import { OrderPaymentSection } from '../../features/orders/OrderPaymentSection';
import { OrderDeliverySection } from '../../features/orders/OrderDeliverySection';
import { OrderReviewSection } from '../../features/orders/OrderReviewSection';
import { OrderSummarySidebar } from '../../features/orders/OrderSummarySidebar';

export default function AccountOrderDetailPage() {
  const { orderNumber = '' } = useParams();
  const location = useLocation();
  const { t } = useTranslation(['orders', 'account', 'common']);
  const { lang } = useLang();

  const [isTabVisible, setIsTabVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden'
  );

  // Persist optional checkout bootstrap data (fawryReference / paymentInstructions)
  const bootstrap = useMemo(() => {
    const stateOrder = location.state?.order || location.state;
    if (
      stateOrder &&
      typeof stateOrder === 'object' &&
      (stateOrder.fawryReference || stateOrder.paymentInstructions)
    ) {
      const data = {
        fawryReference: stateOrder.fawryReference || null,
        paymentInstructions: stateOrder.paymentInstructions || null,
      };
      setOrderBootstrap(orderNumber, data);
      return data;
    }
    return getOrderBootstrap(orderNumber);
  }, [orderNumber, location.state]);

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState !== 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const {
    data: order,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAccountOrder(orderNumber, { isTabVisible });

  const isPollingStatus =
    order?.status === 'pending_payment' || order?.status === 'awaiting_review';

  return (
    <div className="w-full py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <Breadcrumbs
          items={[
            { label: t('common:nav.home'), href: ROUTES.HOME },
            { label: t('account:page.title'), href: ROUTES.ACCOUNT },
            { label: t('account:orders.title'), href: ROUTES.ACCOUNT_ORDERS },
            { label: orderNumber },
          ]}
        />

        {isLoading ? (
          <div className="space-y-6" aria-hidden="true">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <Skeleton className="h-56 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
              <div className="lg:col-span-4">
                <Skeleton className="h-80 w-full rounded-xl" />
              </div>
            </div>
          </div>
        ) : error ? (
          error instanceof ApiError && error.status === 404 ? (
            <Card
              variant="flat"
              padding="lg"
              className="max-w-xl mx-auto text-center space-y-4 my-8"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-error/10 text-error flex items-center justify-center">
                <span className="material-symbols-rounded text-[30px]" aria-hidden="true">
                  search_off
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
                {t('orders:tracking.notFound.title')}
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {t('orders:tracking.notFound.message', { orderNumber })}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  to={ROUTES.ACCOUNT_ORDERS}
                  variant="primary-gradient"
                  size="sm"
                >
                    {t('account:orders.backToList')}
                  </Button>
                <Button
                  to={ROUTES.PROJECTS}
                  variant="outline"
                  size="sm"
                >
                    {t('orders:tracking.notFound.browseProjects')}
                  </Button>
              </div>
            </Card>
          ) : error instanceof ApiError && error.isRateLimited ? (
            <ErrorState
              title={t('common:errors.codes.TOO_MANY_REQUESTS')}
              message={t('common:errors.rateLimited')}
              onRetry={() => refetch()}
            />
          ) : (
            <ErrorState
              title={t('common:states.errorTitle')}
              message={getApiErrorMessage(error, t)}
              onRetry={() => refetch()}
            />
          )
        ) : order ? (
          <div className="space-y-6 sm:space-y-8">
            <Card variant="flat" padding="md" className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider block">
                    {t('account:orders.detailEyebrow')}
                  </span>

                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                      <span className="text-on-surface-variant font-semibold text-lg sm:text-xl me-2">
                        {t('orders:tracking.header.orderNumberLabel')}
                      </span>
                      <bdi dir="ltr" className="font-mono text-primary">
                        {order.orderNumber}
                      </bdi>
                    </h1>
                    <OrderStatusBadge status={order.status} size="lg" />
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-xs sm:text-sm text-on-surface-variant">
                    <span>
                      {t('orders:tracking.header.createdAt', {
                        date: formatDateTime(order.createdAt, lang),
                      })}
                    </span>

                    {isPollingStatus && (
                      <Badge
                        variant={isTabVisible ? 'primary' : 'neutral'}
                        size="sm"
                        dot
                      >
                        {isTabVisible
                          ? t('orders:tracking.header.pollingActive')
                          : t('orders:tracking.header.pollingPaused')}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <Button
                    to={ROUTES.ACCOUNT_ORDERS}
                    variant="outline"
                    size="sm"
                    iconLeading={
                        <span className="material-symbols-rounded text-[18px] rtl:-scale-x-100" aria-hidden="true">
                          arrow_back
                        </span>
                      }
                  >
                      {t('account:orders.backToList')}
                    </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={isFetching && !isLoading}
                    onClick={() => refetch()}
                    iconLeading={
                      <span className="material-symbols-rounded text-[18px]" aria-hidden="true">
                        refresh
                      </span>
                    }
                  >
                    {isFetching && !isLoading
                      ? t('orders:tracking.header.refreshing')
                      : t('orders:tracking.header.refresh')}
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <OrderStatusTimeline order={order} />
                <OrderPaymentSection
                  mode="account"
                  order={order}
                  bootstrap={bootstrap}
                />
                <OrderDeliverySection order={order} />
                <OrderReviewSection mode="account" order={order} />
              </div>

              <OrderSummarySidebar order={order} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
