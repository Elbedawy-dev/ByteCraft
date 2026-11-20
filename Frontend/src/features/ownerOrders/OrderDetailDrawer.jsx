import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang, useToast } from '@/app/providers';
import { getApiErrorMessage } from '@/api/client';
import {
  useApproveOrder,
  useOwnerOrder,
  useRefundOrder,
  useRejectOrder,
  useUpdateOrderDelivery,
} from '@/api/owner/orders';
import { formatDateTime } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { localized } from '@/lib/localized';
import {
  Badge,
  Button,
  CopyButton,
  FormField,
  Select,
  Skeleton,
  Textarea,
} from '@/components/ui';
import { ErrorState } from '@/components/shared';
import { OwnerConfirmDialog, OwnerDrawer, OwnerModal } from './NativeDialog';
import { PaymentProofViewer } from './PaymentProofViewer';
import {
  DELIVERY_BADGE_VARIANT,
  ORDER_STATUS_BADGE_VARIANT,
  REPO_ACCESS_STATES,
  getAllowedOrderActions,
  isInvalidStateError,
} from './orderMeta';

export function OrderDetailDrawer({ orderId, initialOrder = null, onClose }) {
  const { t } = useTranslation(['ownerOrders', 'common']);
  const { lang } = useLang();
  const toast = useToast();

  const {
    data: fetchedOrder,
    isLoading,
    isError,
    error,
    refetch,
  } = useOwnerOrder(orderId);

  const order = fetchedOrder || initialOrder;

  const approveMutation = useApproveOrder();
  const rejectMutation = useRejectOrder();
  const deliveryMutation = useUpdateOrderDelivery();
  const refundMutation = useRefundOrder();

  // Action dialog states
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [repoAccess, setRepoAccess] = useState('pending');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [markDeliveredOpen, setMarkDeliveredOpen] = useState(false);

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundNote, setRefundNote] = useState('');

  const orderKey = order?._id || order?.id;
  const orderRepoAccess = order?.delivery?.repoAccess;
  const orderDeliveryNotes = order?.delivery?.notes;

  useEffect(() => {
    if (orderKey) {
      setRepoAccess(orderRepoAccess || 'pending');
      setDeliveryNotes(orderDeliveryNotes || '');
    }
  }, [orderKey, orderRepoAccess, orderDeliveryNotes]);

  useEffect(() => {
    setApproveOpen(false);
    setRejectOpen(false);
    setRejectReason('');
    setRejectError('');
    setMarkDeliveredOpen(false);
    setRefundOpen(false);
    setRefundNote('');
  }, [orderId]);

  const handleActionError = (err) => {
    if (isInvalidStateError(err)) {
      toast.warning(t('ownerOrders:actions.invalidStateError'));
      refetch();
      return;
    }
    toast.error(getApiErrorMessage(err));
  };

  const handleApprove = async () => {
    if (!order) return;
    const id = order._id || order.id;
    try {
      await approveMutation.mutateAsync(id);
      toast.success(t('ownerOrders:actions.approveSuccess', { orderNumber: order.orderNumber }));
      setApproveOpen(false);
      refetch();
    } catch (err) {
      setApproveOpen(false);
      handleActionError(err);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!order) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 3) {
      setRejectError(t('ownerOrders:actions.rejectReasonError'));
      return;
    }
    setRejectError('');
    const id = order._id || order.id;
    try {
      await rejectMutation.mutateAsync({ id, reason: trimmed });
      toast.success(t('ownerOrders:actions.rejectSuccess', { orderNumber: order.orderNumber }));
      setRejectOpen(false);
      setRejectReason('');
      refetch();
    } catch (err) {
      if (isInvalidStateError(err)) {
        setRejectOpen(false);
      }
      handleActionError(err);
    }
  };

  const handleSaveDelivery = async (e) => {
    e.preventDefault();
    if (!order) return;
    const id = order._id || order.id;
    try {
      await deliveryMutation.mutateAsync({
        id,
        repoAccess,
        notes: deliveryNotes,
      });
      toast.success(t('ownerOrders:actions.deliverySuccess'));
      refetch();
    } catch (err) {
      handleActionError(err);
    }
  };

  const handleMarkDelivered = async () => {
    if (!order) return;
    const id = order._id || order.id;
    try {
      await deliveryMutation.mutateAsync({
        id,
        repoAccess: 'granted',
        notes: deliveryNotes,
      });
      toast.success(t('ownerOrders:actions.deliverySuccess'));
      setMarkDeliveredOpen(false);
      refetch();
    } catch (err) {
      setMarkDeliveredOpen(false);
      handleActionError(err);
    }
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!order) return;
    const id = order._id || order.id;
    try {
      await refundMutation.mutateAsync({ id, note: refundNote });
      toast.success(t('ownerOrders:actions.refundSuccess', { orderNumber: order.orderNumber }));
      setRefundOpen(false);
      setRefundNote('');
      refetch();
    } catch (err) {
      if (isInvalidStateError(err)) {
        setRefundOpen(false);
      }
      handleActionError(err);
    }
  };

  const allowed = getAllowedOrderActions(order?.status);
  const hasAnyAction =
    allowed.canApprove || allowed.canReject || allowed.canUpdateDelivery || allowed.canRefund;
  const anyMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    deliveryMutation.isPending ||
    refundMutation.isPending;

  const statusVariant = ORDER_STATUS_BADGE_VARIANT[order?.status] || 'neutral';
  const historyList = Array.isArray(order?.statusHistory)
    ? [...order.statusHistory].reverse()
    : [];

  return (
    <>
      <OwnerDrawer
        isOpen={Boolean(orderId)}
        onClose={onClose}
        size="lg"
        closeLabel={t('ownerOrders:drawer.close')}
        title={
          order?.orderNumber ? (
            <span className="inline-flex items-center gap-2 flex-wrap">
              <span>{t('ownerOrders:drawer.title')}</span>
              <bdi dir="ltr" className="font-mono text-primary">
                {order.orderNumber}
              </bdi>
            </span>
          ) : (
            t('ownerOrders:drawer.title')
          )
        }
        headerBadge={
          order?.status ? (
            <Badge variant={statusVariant} dot size="sm">
              {t(`ownerOrders:status.${order.status}`, { defaultValue: order.status })}
            </Badge>
          ) : null
        }
        subtitle={
          order?.createdAt ? (
            <span className="inline-flex items-center gap-3 flex-wrap text-xs">
              <span>
                {t('ownerOrders:drawer.createdAt')}: {formatDateTime(order.createdAt, lang)}
              </span>
              {order.locale && (
                <span>
                  • {t('ownerOrders:drawer.locale')}:{' '}
                  {order.locale === 'en'
                    ? t('ownerOrders:drawer.localeEn')
                    : t('ownerOrders:drawer.localeAr')}
                </span>
              )}
              {order.isFreeOrder && (
                <Badge variant="primary" size="sm">
                  {t('ownerOrders:table.freeBadge')}
                </Badge>
              )}
            </span>
          ) : null
        }
      >
        {isLoading && !order ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        ) : isError && !order ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />
        ) : order ? (
          <div className="space-y-6">
            {/* 1. Allowed Actions Bar */}
            <section className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
                  <span>{t('ownerOrders:drawer.sections.actions')}</span>
                </h3>
              </div>

              {hasAnyAction ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  {allowed.canApprove && (
                    <Button
                      variant="primary-gradient"
                      size="sm"
                      disabled={anyMutating}
                      onClick={() => setApproveOpen(true)}
                      iconLeading={
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      }
                    >
                      {t('ownerOrders:actions.approve')}
                    </Button>
                  )}

                  {allowed.canReject && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={anyMutating}
                      onClick={() => {
                        setRejectReason('');
                        setRejectError('');
                        setRejectOpen(true);
                      }}
                      iconLeading={
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                      }
                    >
                      {t('ownerOrders:actions.reject')}
                    </Button>
                  )}

                  {allowed.canUpdateDelivery && order.status !== 'delivered' && (
                    <Button
                      variant="primary-gradient"
                      size="sm"
                      disabled={anyMutating}
                      onClick={() => setMarkDeliveredOpen(true)}
                      iconLeading={
                        <span className="material-symbols-outlined text-[18px]">
                          local_shipping
                        </span>
                      }
                    >
                      {t('ownerOrders:drawer.delivery.markDelivered')}
                    </Button>
                  )}

                  {allowed.canRefund && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={anyMutating}
                      onClick={() => {
                        setRefundNote('');
                        setRefundOpen(true);
                      }}
                      className="!border-error/50 !text-error hover:!bg-error/10"
                      iconLeading={
                        <span className="material-symbols-outlined text-[18px]">
                          currency_exchange
                        </span>
                      }
                    >
                      {t('ownerOrders:actions.refund')}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">
                  {t('ownerOrders:actions.noAllowedActions')}
                </p>
              )}
            </section>

            {/* 2. Customer & Git Info */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                <span>{t('ownerOrders:drawer.sections.customer')}</span>
              </h3>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="min-w-0">
                  <div className="text-xs text-on-surface-variant">
                    {t('ownerOrders:drawer.customer.fullName')}
                  </div>
                  <div className="font-semibold text-on-surface mt-0.5 break-words">
                    {order.customer?.fullName || '—'}
                  </div>
                </div>

                {order.customer?.organization && (
                  <div className="min-w-0">
                    <div className="text-xs text-on-surface-variant">
                      {t('ownerOrders:drawer.customer.organization')}
                    </div>
                    <div className="font-medium text-on-surface mt-0.5 break-words">
                      {order.customer.organization}
                    </div>
                  </div>
                )}

                <div className="min-w-0">
                  <div className="text-xs text-on-surface-variant">
                    {t('ownerOrders:drawer.customer.email')}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                    <a
                      href={`mailto:${order.customer?.email || ''}`}
                      className="text-primary hover:underline truncate text-xs sm:text-sm"
                    >
                      <bdi dir="ltr">{order.customer?.email || '—'}</bdi>
                    </a>
                    {order.customer?.email && (
                      <CopyButton
                        text={order.customer.email}
                        size="icon-sm"
                        className="!w-8 !h-8 shrink-0"
                        copiedLabel={t('common:actions.copied')}
                      />
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-xs text-on-surface-variant">
                    {t('ownerOrders:drawer.customer.phone')}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                    <bdi dir="ltr" className="font-mono text-xs sm:text-sm text-on-surface truncate">
                      {order.customer?.phone || '—'}
                    </bdi>
                    {order.customer?.phone && (
                      <CopyButton
                        text={order.customer.phone}
                        size="icon-sm"
                        className="!w-8 !h-8 shrink-0"
                        copiedLabel={t('common:actions.copied')}
                      />
                    )}
                  </div>
                </div>

                {/* Git provider & username highlighted box */}
                <div className="sm:col-span-2 rounded-lg border border-primary/25 bg-primary/5 p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[18px]">code</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-on-surface-variant">
                        {t('ownerOrders:drawer.customer.gitProvider')}:{' '}
                        <span className="font-semibold uppercase text-on-surface">
                          {order.customer?.gitProvider || '—'}
                        </span>
                      </div>
                      <div className="font-mono text-sm font-semibold text-primary truncate">
                        <bdi dir="ltr">@{order.customer?.gitUsername || '—'}</bdi>
                      </div>
                    </div>
                  </div>

                  {order.customer?.gitUsername && (
                    <CopyButton
                      text={order.customer.gitUsername}
                      label={t('ownerOrders:drawer.customer.copyGit')}
                      copiedLabel={t('common:actions.copied')}
                      size="sm"
                      variant="secondary"
                    />
                  )}
                </div>
              </div>
            </section>

            {/* 3. Pricing Breakdown */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
                <span>{t('ownerOrders:drawer.sections.pricing')}</span>
              </h3>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-outline-variant/60">
                  <div className="min-w-0">
                    <div className="font-semibold text-on-surface break-words">
                      {localized(order.snapshot?.title, lang) || order.snapshot?.slug || '—'}
                    </div>
                    <div className="text-xs text-on-surface-variant mt-0.5 flex flex-wrap items-center gap-2">
                      <span>{localized(order.snapshot?.packageName, lang) || order.snapshot?.packageKey}</span>
                      {order.snapshot?.licenseType && (
                        <Badge variant="neutral" size="sm">
                          {t(`ownerOrders:licenseType.${order.snapshot.licenseType}`, {
                            defaultValue: order.snapshot.licenseType,
                          })}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-on-surface-variant">
                      {t('ownerOrders:drawer.pricing.subtotal')}
                    </span>
                    <span className="font-mono font-medium text-on-surface">
                      {formatMoney(order.pricing?.subtotal || 0, lang)}
                    </span>
                  </div>

                  {order.pricing?.couponCode && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-on-surface-variant flex items-center gap-2">
                        <span>{t('ownerOrders:drawer.pricing.discount')}</span>
                        <Badge variant="primary" size="sm">
                          <bdi dir="ltr" className="font-mono">
                            {order.pricing.couponCode}
                          </bdi>
                        </Badge>
                      </span>
                      <span className="font-mono font-medium text-primary">
                        - {formatMoney(order.pricing?.discount || 0, lang)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-outline-variant/70 text-base font-bold">
                    <span className="text-on-surface">{t('ownerOrders:drawer.pricing.total')}</span>
                    <span className="font-mono text-primary">
                      {formatMoney(order.pricing?.total || 0, lang)}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    {t('ownerOrders:drawer.pricing.taxNote')}
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Payment Info & Proof Viewer */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  receipt_long
                </span>
                <span>{t('ownerOrders:drawer.sections.payment')}</span>
              </h3>

              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-on-surface-variant">
                    {t('ownerOrders:drawer.payment.method')}
                  </div>
                  <div className="font-semibold text-on-surface mt-0.5">
                    {t(`ownerOrders:paymentMethod.${order.paymentMethod}`, {
                      defaultValue: order.paymentMethod,
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-on-surface-variant">
                    {t('ownerOrders:drawer.payment.provider')}
                  </div>
                  <div className="font-medium text-on-surface mt-0.5">
                    {order.payment?.provider === 'paymob'
                      ? t('ownerOrders:drawer.payment.providerPaymob')
                      : t('ownerOrders:drawer.payment.providerManual')}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-on-surface-variant">
                    {t('ownerOrders:drawer.payment.paidAt')}
                  </div>
                  <div className="font-mono text-xs text-on-surface mt-0.5">
                    {order.payment?.paidAt
                      ? formatDateTime(order.payment.paidAt, lang)
                      : t('ownerOrders:drawer.payment.notPaidYet')}
                  </div>
                </div>

                {order.payment?.fawryReference && (
                  <div className="min-w-0">
                    <div className="text-xs text-on-surface-variant">
                      {t('ownerOrders:drawer.payment.fawryRef')}
                    </div>
                    <div className="font-mono text-xs text-on-surface mt-0.5 truncate">
                      <bdi dir="ltr">{order.payment.fawryReference}</bdi>
                    </div>
                  </div>
                )}

                {order.payment?.transactionId && (
                  <div className="min-w-0">
                    <div className="text-xs text-on-surface-variant">
                      {t('ownerOrders:drawer.payment.transactionId')}
                    </div>
                    <div className="font-mono text-xs text-on-surface mt-0.5 truncate">
                      <bdi dir="ltr">{order.payment.transactionId}</bdi>
                    </div>
                  </div>
                )}

                {order.payment?.rejectionReason && (
                  <div className="sm:col-span-2 rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">
                    <div className="font-semibold mb-0.5">
                      {t('ownerOrders:drawer.payment.rejectionReason')}
                    </div>
                    <p className="break-words text-on-surface">{order.payment.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Payment Proof Viewer */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('ownerOrders:drawer.sections.proof')}
                </h4>
                <PaymentProofViewer proof={order.payment?.proof} />
              </div>
            </section>

            {/* 5. Delivery Info & Update Form */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  local_shipping
                </span>
                <span>{t('ownerOrders:drawer.sections.delivery')}</span>
              </h3>

              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-on-surface-variant">
                      {t('ownerOrders:drawer.delivery.repoAccess')}:
                    </span>
                    <Badge
                      variant={DELIVERY_BADGE_VARIANT[order.delivery?.repoAccess] || 'neutral'}
                      dot
                      size="sm"
                    >
                      {t(`ownerOrders:deliveryStatus.${order.delivery?.repoAccess || 'pending'}`, {
                        defaultValue: order.delivery?.repoAccess || 'pending',
                      })}
                    </Badge>
                  </div>
                  {order.delivery?.deliveredAt && (
                    <span className="font-mono text-xs text-on-surface-variant">
                      {t('ownerOrders:drawer.delivery.deliveredAt')}:{' '}
                      {formatDateTime(order.delivery.deliveredAt, lang)}
                    </span>
                  )}
                </div>

                {allowed.canUpdateDelivery ? (
                  <form onSubmit={handleSaveDelivery} className="space-y-4 pt-2 border-t border-outline-variant/60">
                    <FormField
                      id="order-delivery-access"
                      label={t('ownerOrders:drawer.delivery.repoAccess')}
                    >
                      <Select
                        value={repoAccess}
                        onChange={(e) => setRepoAccess(e.target.value)}
                        disabled={deliveryMutation.isPending}
                      >
                        {REPO_ACCESS_STATES.map((state) => (
                          <option key={state} value={state}>
                            {t(`ownerOrders:deliveryStatus.${state}`)}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField
                      id="order-delivery-notes"
                      label={t('ownerOrders:drawer.delivery.notes')}
                    >
                      <Textarea
                        rows={3}
                        className="min-h-[96px] placeholder:text-outline"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder={t('ownerOrders:drawer.delivery.notesPlaceholder')}
                        disabled={deliveryMutation.isPending}
                      />
                    </FormField>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        loading={deliveryMutation.isPending}
                        iconLeading={
                          <span className="material-symbols-outlined text-[18px]">save</span>
                        }
                      >
                        {t('ownerOrders:drawer.delivery.saveDelivery')}
                      </Button>
                      {order.status !== 'delivered' && (
                        <Button
                          type="button"
                          variant="primary-gradient"
                          size="sm"
                          disabled={deliveryMutation.isPending}
                          onClick={() => setMarkDeliveredOpen(true)}
                          iconLeading={
                            <span className="material-symbols-outlined text-[18px]">task_alt</span>
                          }
                        >
                          {t('ownerOrders:drawer.delivery.markDelivered')}
                        </Button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="text-xs sm:text-sm text-on-surface-variant">
                    <span className="font-medium text-on-surface">
                      {t('ownerOrders:drawer.delivery.notes')}:{' '}
                    </span>
                    <span>{order.delivery?.notes || t('ownerOrders:drawer.delivery.noNotes')}</span>
                  </div>
                )}
              </div>
            </section>

            {/* 6. Status History Timeline */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">history</span>
                <span>{t('ownerOrders:drawer.sections.history')}</span>
              </h3>

              {historyList.length === 0 ? (
                <p className="text-xs text-on-surface-variant">
                  {t('ownerOrders:drawer.history.empty')}
                </p>
              ) : (
                <ol className="relative border-s border-outline-variant ms-3 space-y-4 ps-5">
                  {historyList.map((entry, idx) => (
                    <li key={entry._id || `${entry.status}-${idx}`} className="relative">
                      <span
                        className={clsx(
                          'absolute -start-[26px] top-1.5 w-3 h-3 rounded-full ring-4 ring-surface-container',
                          idx === 0 ? 'bg-primary' : 'bg-outline'
                        )}
                        aria-hidden="true"
                      />
                      <div className="rounded-xl border border-outline-variant/70 bg-surface-container-low p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <Badge
                            variant={ORDER_STATUS_BADGE_VARIANT[entry.status] || 'neutral'}
                            size="sm"
                          >
                            {t(`ownerOrders:status.${entry.status}`, {
                              defaultValue: entry.status,
                            })}
                          </Badge>
                          <time className="text-[11px] font-mono text-on-surface-variant">
                            {formatDateTime(entry.at, lang)}
                          </time>
                        </div>
                        {entry.note && (
                          <p className="text-xs text-on-surface-variant leading-relaxed break-words">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        ) : null}
      </OwnerDrawer>

      {/* Approve Confirm Dialog */}
      <OwnerConfirmDialog
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApprove}
        variant="primary"
        loading={approveMutation.isPending}
        title={t('ownerOrders:actions.approveTitle')}
        message={t('ownerOrders:actions.approveMessage', {
          orderNumber: order?.orderNumber || '',
        })}
        confirmText={t('ownerOrders:actions.approveConfirm')}
        cancelText={t('common:actions.cancel')}
      />

      {/* Mark Delivered Confirm Dialog */}
      <OwnerConfirmDialog
        isOpen={markDeliveredOpen}
        onClose={() => setMarkDeliveredOpen(false)}
        onConfirm={handleMarkDelivered}
        variant="primary"
        loading={deliveryMutation.isPending}
        title={t('ownerOrders:actions.deliveryUpdateTitle')}
        message={t('ownerOrders:actions.deliveryConfirmMarkMessage', {
          orderNumber: order?.orderNumber || '',
        })}
        confirmText={t('ownerOrders:drawer.delivery.markDelivered')}
        cancelText={t('common:actions.cancel')}
      />

      {/* Reject Reason Modal */}
      <OwnerModal
        isOpen={rejectOpen}
        onClose={() => !rejectMutation.isPending && setRejectOpen(false)}
        preventClose={rejectMutation.isPending}
        size="sm"
        title={t('ownerOrders:actions.rejectTitle')}
        description={t('ownerOrders:actions.rejectDescription')}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRejectOpen(false)}
              disabled={rejectMutation.isPending}
              autoFocus
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="submit"
              form="reject-order-form"
              loading={rejectMutation.isPending}
            >
              {t('ownerOrders:actions.rejectConfirm')}
            </Button>
          </>
        }
      >
        <form id="reject-order-form" onSubmit={handleReject} noValidate>
          <FormField
            id="reject-order-reason"
            label={t('ownerOrders:actions.rejectReasonLabel')}
            required
            error={rejectError}
          >
            <Textarea
              rows={3}
              className="min-h-[110px] placeholder:text-outline"
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError('');
              }}
              placeholder={t('ownerOrders:actions.rejectReasonPlaceholder')}
              disabled={rejectMutation.isPending}
            />
          </FormField>
        </form>
      </OwnerModal>

      {/* Refund Modal (with explicit status-only warning) */}
      <OwnerModal
        isOpen={refundOpen}
        onClose={() => !refundMutation.isPending && setRefundOpen(false)}
        preventClose={refundMutation.isPending}
        size="sm"
        title={t('ownerOrders:actions.refundTitle')}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRefundOpen(false)}
              disabled={refundMutation.isPending}
              autoFocus
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="submit"
              form="refund-order-form"
              loading={refundMutation.isPending}
            >
              {t('ownerOrders:actions.refundConfirm')}
            </Button>
          </>
        }
      >
        <form id="refund-order-form" onSubmit={handleRefund} className="space-y-4">
          <div
            role="alert"
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs sm:text-sm text-on-surface flex items-start gap-2.5 leading-relaxed"
          >
            <span className="material-symbols-outlined text-[20px] text-amber-400 shrink-0 mt-0.5">
              warning
            </span>
            <span>{t('ownerOrders:actions.refundStatusOnlyWarning')}</span>
          </div>

          <FormField
            id="refund-order-note"
            label={t('ownerOrders:actions.refundNoteLabel')}
          >
            <Textarea
              rows={3}
              className="min-h-[100px] placeholder:text-outline"
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              placeholder={t('ownerOrders:actions.refundNotePlaceholder')}
              disabled={refundMutation.isPending}
            />
          </FormField>
        </form>
      </OwnerModal>
    </>
  );
}
