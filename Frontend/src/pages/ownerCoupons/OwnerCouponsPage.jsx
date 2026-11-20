import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang, useToast } from '@/app/providers';
import { useOwnerPageTitle } from '@/components/layout/OwnerLayout';
import { getApiErrorMessage } from '@/api/client';
import {
  useDeleteOwnerCoupon,
  useOwnerCoupons,
  useUpdateOwnerCoupon,
} from '@/api/owner/coupons';
import { formatDateTime } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { localized } from '@/lib/localized';
import { Badge, Button, Card, CopyButton, Skeleton, Switch } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/shared';
import { OwnerConfirmDialog } from '@/features/ownerOrders/NativeDialog';
import { CouponFormModal } from '@/features/ownerCoupons/CouponFormModal';

export default function OwnerCouponsPage() {
  const { t } = useTranslation(['ownerCoupons', 'common']);
  const { lang } = useLang();
  const toast = useToast();

  useOwnerPageTitle(t('ownerCoupons:title'));

  const { data: coupons = [], isLoading, isFetching, isError, error, refetch } = useOwnerCoupons();
  const updateMutation = useUpdateOwnerCoupon();
  const deleteMutation = useDeleteOwnerCoupon();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const activeCount = coupons.filter((c) => c.isActive).length;

  const openCreateModal = () => {
    setEditingCoupon(null);
    setModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setModalOpen(true);
  };

  const handleToggleActive = async (coupon) => {
    const id = coupon.id || coupon._id;
    const nextActive = !coupon.isActive;
    try {
      await updateMutation.mutateAsync({ id, isActive: nextActive });
      toast.success(
        nextActive
          ? t('ownerCoupons:messages.toggledActive', { code: coupon.code })
          : t('ownerCoupons:messages.toggledInactive', { code: coupon.code })
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id || deleteTarget._id;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t('ownerCoupons:messages.deleted', { code: deleteTarget.code }));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const renderDiscountValue = (coupon) => {
    if (coupon.type === 'percent') {
      return (
        <bdi dir="ltr" className="font-mono font-bold text-primary">
          {coupon.value}%
        </bdi>
      );
    }
    return (
      <span className="font-mono font-bold text-primary">
        {formatMoney(coupon.value || 0, lang)}
      </span>
    );
  };

  const renderUsage = (coupon) => {
    const used = coupon.usedCount || 0;
    const max = coupon.maxUses;
    const isExhausted = max != null && used >= max;
    const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;

    return (
      <div className="space-y-1 min-w-[110px]">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <bdi dir="ltr" className="font-semibold text-on-surface">
            {used} / {max != null ? max : '∞'}
          </bdi>
          {max == null && (
            <span className="text-[11px] font-sans text-on-surface-variant">
              ({t('ownerCoupons:table.unlimited')})
            </span>
          )}
          {isExhausted && (
            <Badge variant="error" size="sm">
              {t('ownerCoupons:table.exhaustedBadge')}
            </Badge>
          )}
        </div>
        {max != null && (
          <div className="h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                isExhausted ? 'bg-error' : 'bg-primary'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderProjects = (coupon) => {
    const list = Array.isArray(coupon.appliesToProjects) ? coupon.appliesToProjects : [];
    if (list.length === 0) {
      return (
        <Badge variant="neutral" size="sm">
          {t('ownerCoupons:table.allProjects')}
        </Badge>
      );
    }
    return (
      <div className="flex flex-wrap gap-1 max-w-[240px]">
        {list.slice(0, 3).map((proj, idx) => {
          const label =
            typeof proj === 'object' ? localized(proj.title, lang) || proj.slug : String(proj);
          return (
            <Badge
              key={proj?.id || proj?._id || idx}
              variant="primary"
              size="sm"
              className="max-w-[180px]"
            >
              <span className="truncate block max-w-[150px]">{label}</span>
            </Badge>
          );
        })}
        {list.length > 3 && (
          <Badge variant="outline" size="sm">
            +{list.length - 3}
          </Badge>
        )}
      </div>
    );
  };

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
                {t('ownerCoupons:title')}
              </h1>
              <Badge variant="neutral" size="md">
                <bdi dir="ltr" className="font-mono">
                  {coupons.length}
                </bdi>
              </Badge>
              {activeCount > 0 && (
                <Badge variant="primary" dot size="md">
                  {t('ownerCoupons:stats.active')}:{' '}
                  <bdi dir="ltr" className="font-mono font-bold">
                    {activeCount}
                  </bdi>
                </Badge>
              )}
            </div>
            <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl">
              {t('ownerCoupons:subtitle')}
            </p>
          </div>

          <Button
            variant="primary-gradient"
            size="md"
            onClick={openCreateModal}
            iconLeading={<span className="material-symbols-outlined text-[20px]">add_circle</span>}
          >
            {t('ownerCoupons:createButton')}
          </Button>
        </div>
      </header>

      {/* Content */}
      {isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />
      ) : isLoading ? (
        <Card padding="none" className="overflow-hidden">
          <div className="p-4 sm:p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      ) : coupons.length === 0 ? (
        <EmptyState
          icon="confirmation_number"
          title={t('ownerCoupons:empty.title')}
          description={t('ownerCoupons:empty.description')}
          action={
            <Button
              variant="primary-gradient"
              size="sm"
              onClick={openCreateModal}
              iconLeading={<span className="material-symbols-outlined text-[18px]">add</span>}
            >
              {t('ownerCoupons:createButton')}
            </Button>
          }
        />
      ) : (
        <div className={clsx('transition-opacity', isFetching && 'opacity-70')}>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-outline-variant bg-surface-container overflow-hidden">
            <div
              tabIndex={0}
              role="region"
              aria-label={t('ownerCoupons:table.regionLabel')}
              className="w-full overflow-x-auto"
            >
              <table className="w-full text-start border-collapse text-sm">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low/80 text-on-surface-variant text-xs font-semibold">
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerCoupons:table.code')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerCoupons:table.discount')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerCoupons:table.usage')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerCoupons:table.projects')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerCoupons:table.expiry')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerCoupons:table.status')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-end whitespace-nowrap">
                      {t('ownerCoupons:table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {coupons.map((coupon) => {
                    const id = coupon.id || coupon._id;
                    const isExpired =
                      Boolean(coupon.expiresAt) && new Date(coupon.expiresAt) < new Date();

                    return (
                      <tr
                        key={id}
                        className="hover:bg-surface-container-high/50 transition-colors"
                      >
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant">
                            <bdi dir="ltr" className="font-mono font-bold text-on-surface">
                              {coupon.code}
                            </bdi>
                            <CopyButton
                              text={coupon.code}
                              size="icon-sm"
                              className="!w-7 !h-7"
                              copiedLabel={t('common:actions.copied')}
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="flex flex-col">
                            {renderDiscountValue(coupon)}
                            <span className="text-[11px] text-on-surface-variant">
                              {coupon.type === 'percent'
                                ? t('ownerCoupons:table.percentType')
                                : t('ownerCoupons:table.fixedType')}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-middle">{renderUsage(coupon)}</td>

                        <td className="py-3.5 px-4 align-middle">{renderProjects(coupon)}</td>

                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          {coupon.expiresAt ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-mono text-on-surface">
                                {formatDateTime(coupon.expiresAt, lang)}
                              </span>
                              {isExpired && (
                                <Badge variant="error" size="sm" className="w-fit">
                                  {t('ownerCoupons:table.expiredBadge')}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-on-surface-variant">
                              {t('ownerCoupons:table.noExpiry')}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`coupon-active-table-${id}`}
                              checked={Boolean(coupon.isActive)}
                              disabled={updateMutation.isPending}
                              onChange={() => handleToggleActive(coupon)}
                              aria-label={coupon.code}
                            />
                            <Badge variant={coupon.isActive ? 'success' : 'neutral'} dot size="sm">
                              {coupon.isActive
                                ? t('ownerCoupons:table.activeBadge')
                                : t('ownerCoupons:table.inactiveBadge')}
                            </Badge>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-middle text-end whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(coupon)}
                              className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors"
                              title={t('ownerCoupons:table.edit')}
                              aria-label={t('ownerCoupons:table.edit')}
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(coupon)}
                              className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-error flex items-center justify-center transition-colors"
                              title={t('ownerCoupons:table.delete')}
                              aria-label={t('ownerCoupons:table.delete')}
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {coupons.map((coupon) => {
              const id = coupon.id || coupon._id;
              const isExpired =
                Boolean(coupon.expiresAt) && new Date(coupon.expiresAt) < new Date();
              return (
                <article
                  key={id}
                  className="rounded-xl border border-outline-variant bg-surface-container p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant">
                      <bdi dir="ltr" className="font-mono font-bold text-sm text-on-surface">
                        {coupon.code}
                      </bdi>
                      <CopyButton
                        text={coupon.code}
                        size="icon-sm"
                        className="!w-7 !h-7"
                        copiedLabel={t('common:actions.copied')}
                      />
                    </div>
                    <Badge variant={coupon.isActive ? 'success' : 'neutral'} dot size="sm">
                      {coupon.isActive
                        ? t('ownerCoupons:table.activeBadge')
                        : t('ownerCoupons:table.inactiveBadge')}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg">{renderDiscountValue(coupon)}</div>
                      <div className="text-xs text-on-surface-variant">
                        {coupon.type === 'percent'
                          ? t('ownerCoupons:table.percentType')
                          : t('ownerCoupons:table.fixedType')}
                      </div>
                    </div>
                    <div className="w-36">{renderUsage(coupon)}</div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-outline-variant/60">
                    <div className="text-xs text-on-surface-variant">
                      {t('ownerCoupons:table.projects')}:
                    </div>
                    {renderProjects(coupon)}
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-on-surface-variant">{t('ownerCoupons:table.expiry')}:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-on-surface">
                        {coupon.expiresAt
                          ? formatDateTime(coupon.expiresAt, lang)
                          : t('ownerCoupons:table.noExpiry')}
                      </span>
                      {isExpired && (
                        <Badge variant="error" size="sm">
                          {t('ownerCoupons:table.expiredBadge')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-outline-variant/60">
                    <Switch
                      id={`coupon-active-mobile-${id}`}
                      label={
                        coupon.isActive
                          ? t('ownerCoupons:table.activeBadge')
                          : t('ownerCoupons:table.inactiveBadge')
                      }
                      checked={Boolean(coupon.isActive)}
                      disabled={updateMutation.isPending}
                      onChange={() => handleToggleActive(coupon)}
                    />
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(coupon)}
                        iconLeading={<span className="material-symbols-outlined text-[16px]">edit</span>}
                      >
                        {t('ownerCoupons:table.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(coupon)}
                        className="text-on-surface-variant hover:text-error border border-outline-variant"
                        aria-label={t('ownerCoupons:table.delete')}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <CouponFormModal
        isOpen={modalOpen}
        coupon={editingCoupon}
        onClose={() => {
          setModalOpen(false);
          setEditingCoupon(null);
        }}
      />

      {/* Delete Confirm Dialog */}
      <OwnerConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        loading={deleteMutation.isPending}
        title={t('ownerCoupons:deleteDialog.title')}
        message={t('ownerCoupons:deleteDialog.message', { code: deleteTarget?.code || '' })}
        confirmText={t('ownerCoupons:deleteDialog.confirm')}
        cancelText={t('common:actions.cancel')}
      />
    </div>
  );
}
