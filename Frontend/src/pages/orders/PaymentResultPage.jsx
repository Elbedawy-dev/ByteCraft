import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getOrderToken,
  setOrderToken,
  useGuestOrder,
} from '../../api/orderTracking';
import { useAccountOrder } from '../../api/account';
import { ApiError } from '../../api/client';
import { useAuth } from '../../features/auth';
import {
  accountOrderDetailsPath,
  orderTrackingPath,
  ROUTES,
} from '../../config/routes';
import {
  Badge,
  Button,
  Card,
  FormField,
  Input,
  Spinner,
} from '../../components/ui';
import { OrderStatusBadge } from '../../features/orders/OrderStatusBadge';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation('orders');
  const { isAuthenticated } = useAuth();

  const orderNumber = (searchParams.get('merchant_order_id') || '').trim();
  const urlSuccess = searchParams.get('success') === 'true';
  const urlPending = searchParams.get('pending') === 'true';
  const urlErrorOccured = searchParams.get('error_occured') === 'true';
  const transactionId = (searchParams.get('id') || '').trim();
  const cardSubType = (searchParams.get('source_data.sub_type') || '').trim();
  const cardPan = (searchParams.get('source_data.pan') || '').trim();
  const gatewayMessage = (searchParams.get('data.message') || '').trim();

  const [token, setToken] = useState(() =>
    orderNumber ? getOrderToken(orderNumber) || '' : ''
  );
  const [manualOrderInput, setManualOrderInput] = useState(orderNumber);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [manualFormError, setManualFormError] = useState('');
  const [verifyTimedOut, setVerifyTimedOut] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(4);

  useEffect(() => {
    if (orderNumber) {
      setManualOrderInput(orderNumber);
      setToken(getOrderToken(orderNumber) || '');
    }
  }, [orderNumber]);

  const useSessionLookup = Boolean(orderNumber && isAuthenticated && !token);

  const shouldPollBriefly =
    Boolean(orderNumber && (token || isAuthenticated)) &&
    urlSuccess &&
    !urlErrorOccured &&
    !urlPending &&
    !verifyTimedOut;

  const {
    data: guestOrder,
    isLoading: guestLoading,
    error: guestError,
  } = useGuestOrder(orderNumber, token, {
    customIntervalMs: shouldPollBriefly && token ? 3000 : false,
  });

  const {
    data: accountOrder,
    isLoading: accountLoading,
    error: accountError,
  } = useAccountOrder(orderNumber, {
    enabled: useSessionLookup,
    customIntervalMs: shouldPollBriefly && useSessionLookup ? 3000 : false,
  });

  const order = token ? guestOrder : accountOrder;
  const isLoading = token ? guestLoading : useSessionLookup ? accountLoading : false;
  const error = token ? guestError : accountError;

  // Cap webhook wait polling on the return page at 12 seconds
  useEffect(() => {
    if (!shouldPollBriefly || order?.status !== 'pending_payment') {
      return undefined;
    }
    const timer = setTimeout(() => setVerifyTimedOut(true), 12000);
    return () => clearTimeout(timer);
  }, [shouldPollBriefly, order?.status]);

  // Clear stale token if server rejected it
  useEffect(() => {
    if (error instanceof ApiError && error.isUnauthorized && orderNumber) {
      setToken('');
    }
  }, [error, orderNumber]);

  const isConfirmedPaid =
    order?.status === 'paid' || order?.status === 'delivered';

  const targetOrderPath = isAuthenticated
    ? accountOrderDetailsPath(orderNumber)
    : orderTrackingPath(orderNumber);

  // Auto-redirect to order page once confirmed paid
  useEffect(() => {
    if (!isConfirmedPaid || !orderNumber) return undefined;

    if (redirectSeconds <= 0) {
      navigate(targetOrderPath, { replace: true });
      return undefined;
    }

    const countdown = setTimeout(() => {
      setRedirectSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(countdown);
  }, [isConfirmedPaid, redirectSeconds, orderNumber, navigate, targetOrderPath]);

  const handleManualLookup = (event) => {
    event.preventDefault();
    const targetOrder = (orderNumber || manualOrderInput).trim();
    const targetToken = manualTokenInput.trim();

    if (!targetOrder || !targetToken) {
      setManualFormError(t('tracking.tokenGate.requiredError'));
      return;
    }

    setManualFormError('');
    setOrderToken(targetOrder, targetToken);
    navigate(orderTrackingPath(targetOrder));
  };

  // Determine UI view state (never trusting URL success=true without backend confirmation)
  let viewState = 'missingOrder';
  if (!orderNumber) {
    viewState = 'missingOrder';
  } else if (!token && !isAuthenticated) {
    viewState = 'missingToken';
  } else if (isLoading) {
    viewState = 'verifying';
  } else if (isConfirmedPaid) {
    viewState = 'paid';
  } else if (
    urlErrorOccured ||
    searchParams.get('success') === 'false' ||
    order?.status === 'rejected' ||
    order?.status === 'cancelled' ||
    order?.status === 'expired'
  ) {
    viewState = 'failed';
  } else if (order?.status === 'pending_payment' && shouldPollBriefly) {
    viewState = 'verifying';
  } else {
    viewState = 'pending';
  }

  const stateBadgeConfig = {
    verifying: { variant: 'primary', icon: 'sync' },
    paid: { variant: 'success', icon: 'check_circle' },
    pending: { variant: 'warning', icon: 'hourglass_top' },
    failed: { variant: 'error', icon: 'cancel' },
    missingToken: { variant: 'warning', icon: 'vpn_key' },
    missingOrder: { variant: 'neutral', icon: 'help_outline' },
  }[viewState];

  return (
    <div className="w-full py-10 sm:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <Card variant="flat" padding="lg" className="space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <Badge variant={stateBadgeConfig.variant} size="sm">
              {t('paymentResult.eyebrow')}
            </Badge>

            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${
                viewState === 'paid'
                  ? 'bc-chip-mint'
                  : viewState === 'failed'
                    ? 'bc-chip-danger'
                    : viewState === 'pending' || viewState === 'missingToken'
                      ? 'bc-chip-amber'
                      : 'bg-surface border-card-border text-primary'
              }`}
            >
              {viewState === 'verifying' ? (
                <Spinner size="lg" />
              ) : (
                <span className="material-symbols-outlined text-[34px]">
                  {stateBadgeConfig.icon}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface">
              {t(`paymentResult.states.${viewState}.title`)}
            </h1>

            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-lg">
              {t(`paymentResult.states.${viewState}.description`, {
                orderNumber,
                seconds: redirectSeconds,
              })}
            </p>
          </div>

          {/* Gateway / Order Summary Box */}
          {orderNumber && (
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/80 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-on-surface-variant">
                  {t('paymentResult.orderNumberLabel')}
                </span>
                <div className="flex items-center gap-2">
                  <bdi dir="ltr" className="font-mono font-bold text-primary">
                    {orderNumber}
                  </bdi>
                  {order?.status && (
                    <OrderStatusBadge status={order.status} size="sm" />
                  )}
                </div>
              </div>

              {transactionId && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-on-surface-variant">
                    {t('paymentResult.transactionIdLabel')}
                  </span>
                  <bdi dir="ltr" className="font-mono text-on-surface">
                    {transactionId}
                  </bdi>
                </div>
              )}

              {(cardSubType || cardPan) && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-on-surface-variant">
                    {t('paymentResult.cardLabel')}
                  </span>
                  <bdi dir="ltr" className="font-mono text-on-surface">
                    {[cardSubType, cardPan ? `•••• ${cardPan}` : '']
                      .filter(Boolean)
                      .join(' ')}
                  </bdi>
                </div>
              )}

              {gatewayMessage && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-on-surface-variant">
                    {t('paymentResult.gatewayMessageLabel')}
                  </span>
                  <bdi dir="ltr" className="font-mono text-on-surface">
                    {gatewayMessage}
                  </bdi>
                </div>
              )}
            </div>
          )}

          {/* Missing Token / Missing Order Inline Form */}
          {(viewState === 'missingToken' || viewState === 'missingOrder') && (
            <form onSubmit={handleManualLookup} className="space-y-4">
              {viewState === 'missingOrder' && (
                <FormField
                  id="result-order-number"
                  label={t('paymentResult.states.missingOrder.orderNumberLabel')}
                  required
                >
                  <Input
                    value={manualOrderInput}
                    onChange={(e) => setManualOrderInput(e.target.value)}
                    dir="ltr"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder={t(
                      'paymentResult.states.missingOrder.orderNumberPlaceholder'
                    )}
                    className="font-mono text-sm"
                  />
                </FormField>
              )}

              <FormField
                id="result-order-token"
                label={t('paymentResult.states.missingOrder.tokenLabel')}
                required
                error={manualFormError}
              >
                <Input
                  value={manualTokenInput}
                  onChange={(e) => {
                    setManualTokenInput(e.target.value);
                    if (manualFormError) setManualFormError('');
                  }}
                  dir="ltr"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={t(
                    'paymentResult.states.missingOrder.tokenPlaceholder'
                  )}
                  className="font-mono text-xs sm:text-sm"
                />
              </FormField>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  variant="primary-gradient"
                  size="md"
                  className="flex-1 sm:flex-none"
                >
                  {viewState === 'missingToken'
                    ? t('paymentResult.states.missingToken.goToOrder')
                    : t('paymentResult.states.missingOrder.lookup')}
                </Button>

                {orderNumber ? (
                  <Link to={orderTrackingPath(orderNumber)}>
                    <Button type="button" variant="outline" size="md">
                      {t('paymentResult.states.missingToken.goToOrder')}
                    </Button>
                  </Link>
                ) : (
                  <Link to={ROUTES.PROJECTS}>
                    <Button type="button" variant="outline" size="md">
                      {t('paymentResult.states.missingOrder.browseProjects')}
                    </Button>
                  </Link>
                )}
              </div>
            </form>
          )}

          {/* Action Buttons for Paid / Pending / Failed */}
          {(viewState === 'paid' ||
            viewState === 'pending' ||
            viewState === 'failed') && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to={targetOrderPath}>
                <Button variant="primary-gradient" size="md">
                  {t(`paymentResult.states.${viewState}.cta`)}
                </Button>
              </Link>

              {viewState === 'failed' && (
                <>
                  <Link to={ROUTES.PROJECTS}>
                    <Button variant="secondary" size="md">
                      {t('paymentResult.states.failed.retryProjects')}
                    </Button>
                  </Link>
                  <Link to={ROUTES.CONTACT}>
                    <Button variant="outline" size="md">
                      {t('paymentResult.states.failed.support')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
