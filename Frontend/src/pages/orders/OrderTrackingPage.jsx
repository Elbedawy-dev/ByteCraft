import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getOrderBootstrap,
  getOrderToken,
  removeOrderToken,
  setOrderBootstrap,
  setOrderToken,
  useGuestOrder,
} from '../../api/orderTracking';
import { ApiError, getApiErrorMessage } from '../../api/client';
import { useLang } from '../../app/providers';
import { formatDateTime } from '../../lib/format';
import { orderTrackingPath, ROUTES } from '../../config/routes';
import {
  Badge,
  Button,
  Card,
  CopyButton,
  Skeleton,
} from '../../components/ui';
import { Breadcrumbs, ErrorState } from '../../components/shared';
import { OrderTokenGate } from '../../features/orders/OrderTokenGate';
import { OrderStatusBadge } from '../../features/orders/OrderStatusBadge';
import { OrderStatusTimeline } from '../../features/orders/OrderStatusTimeline';
import { OrderPaymentSection } from '../../features/orders/OrderPaymentSection';
import { OrderDeliverySection } from '../../features/orders/OrderDeliverySection';
import { OrderReviewSection } from '../../features/orders/OrderReviewSection';
import { OrderSummarySidebar } from '../../features/orders/OrderSummarySidebar';

export default function OrderTrackingPage() {
  const { orderNumber = '' } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { t } = useTranslation('orders');
  const { lang } = useLang();

  const urlToken = (searchParams.get('token') || '').trim();

  const [token, setTokenState] = useState(() => {
    if (urlToken) {
      setOrderToken(orderNumber, urlToken);
      return urlToken;
    }
    return getOrderToken(orderNumber) || '';
  });

  const [tokenRejectedMessage, setTokenRejectedMessage] = useState('');
  const [isTabVisible, setIsTabVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden'
  );

  // Sync URL token or route changes
  useEffect(() => {
    if (urlToken) {
      setOrderToken(orderNumber, urlToken);
      setTokenState(urlToken);
      setTokenRejectedMessage('');
    } else {
      const stored = getOrderToken(orderNumber) || '';
      setTokenState(stored);
      setTokenRejectedMessage('');
    }
  }, [orderNumber, urlToken]);

  // Persist bootstrap data (e.g. fawryReference / initial paymentInstructions) passed from Checkout
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

  // Pause 20s polling when browser tab is hidden
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
  } = useGuestOrder(orderNumber, token, { isTabVisible });

  // Handle 401 invalid token gracefully
  useEffect(() => {
    if (error instanceof ApiError && error.isUnauthorized && token) {
      removeOrderToken(orderNumber);
      setTokenState('');
      setTokenRejectedMessage(t('tracking.tokenGate.invalidError'));
    }
  }, [error, token, orderNumber, t]);

  const handleTokenSubmit = (submittedToken) => {
    setTokenRejectedMessage('');
    setOrderToken(orderNumber, submittedToken);
    setTokenState(submittedToken);
  };

  const trackingShareUrl = useMemo(() => {
    if (typeof window === 'undefined' || !orderNumber || !token) return '';
    return `${window.location.origin}${orderTrackingPath(orderNumber, token)}`;
  }, [orderNumber, token]);

  const isPollingStatus =
    order?.status === 'pending_payment' || order?.status === 'awaiting_review';

  return (
    <div className="w-full py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <Breadcrumbs
          items={[
            { label: t('tracking.breadcrumbs.home'), href: ROUTES.HOME },
            { label: t('tracking.breadcrumbs.projects'), href: ROUTES.PROJECTS },
            { label: t('tracking.breadcrumbs.order') },
          ]}
        />

        {/* Missing or rejected token gate */}
        {!token ? (
          <OrderTokenGate
            orderNumber={orderNumber}
            errorMessage={tokenRejectedMessage}
            onSubmitToken={handleTokenSubmit}
          />
        ) : isLoading ? (
          /* Loading Skeleton */
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
                <span className="material-symbols-outlined text-[30px]">
                  search_off
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
                {t('tracking.notFound.title')}
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {t('tracking.notFound.message', { orderNumber })}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link to={ROUTES.PROJECTS}>
                  <Button variant="primary-gradient" size="sm">
                    {t('tracking.notFound.browseProjects')}
                  </Button>
                </Link>
                <Link to={ROUTES.CONTACT}>
                  <Button variant="outline" size="sm">
                    {t('tracking.notFound.contactSupport')}
                  </Button>
                </Link>
              </div>
            </Card>
          ) : error instanceof ApiError && error.isRateLimited ? (
            <ErrorState
              title={t('common:errors.codes.TOO_MANY_REQUESTS')}
              message={t('tracking.tokenGate.rateLimitError')}
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
            {/* Order Header + Copy Private Tracking Link */}
            <Card variant="flat" padding="md" className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider block">
                    {t('tracking.header.eyebrow')}
                  </span>

                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                      <span className="text-on-surface-variant font-semibold text-lg sm:text-xl me-2">
                        {t('tracking.header.orderNumberLabel')}
                      </span>
                      <bdi dir="ltr" className="font-mono text-primary">
                        {order.orderNumber}
                      </bdi>
                    </h1>
                    <OrderStatusBadge status={order.status} size="lg" />
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-xs sm:text-sm text-on-surface-variant">
                    <span>
                      {t('tracking.header.createdAt', {
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
                          ? t('tracking.header.pollingActive')
                          : t('tracking.header.pollingPaused')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions: Refresh & Copy Tracking Link */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <Button
                    type="button"
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
                    {isFetching && !isLoading
                      ? t('tracking.header.refreshing')
                      : t('tracking.header.refresh')}
                  </Button>

                  <CopyButton
                    text={trackingShareUrl}
                    label={t('tracking.header.copyLink')}
                    copiedLabel={t('tracking.header.copiedLink')}
                    size="sm"
                    variant="outline"
                  />
                </div>
              </div>

              {/* Privacy Warning for Tracking Link */}
              <div className="p-3 rounded-xl bg-chip-amber-bg/70 border border-chip-amber-border text-xs text-on-surface-variant flex items-start gap-2">
                <span className="material-symbols-outlined text-chip-amber-fg text-[18px] shrink-0 mt-0.5">
                  shield
                </span>
                <span className="leading-relaxed">
                  {t('tracking.header.privacyWarning')}
                </span>
              </div>
            </Card>

            {/* Two-Column Detail Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <OrderStatusTimeline order={order} />
                <OrderPaymentSection
                  order={order}
                  token={token}
                  bootstrap={bootstrap}
                />
                <OrderDeliverySection order={order} />
                <OrderReviewSection order={order} token={token} />
              </div>

              <OrderSummarySidebar order={order} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
