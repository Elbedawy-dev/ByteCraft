import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClaimGuestOrders } from '../../api/account';
import { ApiError, getApiErrorMessage } from '../../api/client';
import { useToast } from '../../app/providers';
import { ROUTES } from '../../config/routes';
import { Button, Card } from '../../components/ui';

export function ClaimOrdersCard({ user }) {
  const { t } = useTranslation(['account', 'common']);
  const toast = useToast();
  const claimMutation = useClaimGuestOrders();
  const [claimResult, setClaimResult] = useState(null);
  const [claimError, setClaimError] = useState('');

  if (!user?.emailVerified) {
    return null;
  }

  const handleClaim = async () => {
    setClaimError('');
    try {
      const data = await claimMutation.mutateAsync();
      const count = Number(data?.claimedCount || 0);
      setClaimResult({ count });
      if (count > 0) {
        toast.success(t('account:claimOrders.successToast', { count }));
      } else {
        toast.info(t('account:claimOrders.noneFoundToast'));
      }
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED'
          ? t('common:errors.codes.EMAIL_NOT_VERIFIED')
          : getApiErrorMessage(err, t);
      setClaimError(msg);
      toast.error(msg);
    }
  };

  return (
    <Card variant="panel" padding="md" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
            <span className="material-symbols-rounded icon-gradient text-[22px]" aria-hidden="true">
              manage_search
            </span>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-on-surface">
              {t('account:claimOrders.title')}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {t('account:claimOrders.description')}{' '}
              <bdi dir="ltr" className="font-mono font-semibold text-on-surface">
                {user.email}
              </bdi>
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          loading={claimMutation.isPending}
          onClick={handleClaim}
          className="shrink-0"
          iconLeading={
            <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
              sync
            </span>
          }
        >
          {claimMutation.isPending
            ? t('account:claimOrders.claiming')
            : t('account:claimOrders.action')}
        </Button>
      </div>

      {claimError && (
        <div
          role="alert"
          className="rounded-xl border border-error/30 bg-error/10 p-3.5 text-sm text-error flex items-start gap-2"
        >
          <span className="material-symbols-rounded text-[18px] shrink-0 mt-0.5" aria-hidden="true">
            error
          </span>
          <span>{claimError}</span>
        </div>
      )}

      {claimResult && (
        <div
          role="status"
          className={
            claimResult.count > 0
              ? 'rounded-xl bc-chip-mint border p-4 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3'
              : 'rounded-xl bg-section-band border border-card-border p-4 text-sm text-on-surface-variant flex items-center gap-2.5'
          }
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-rounded text-[20px] shrink-0" aria-hidden="true">
              {claimResult.count > 0 ? 'check_circle' : 'info'}
            </span>
            <span>
              {claimResult.count > 0
                ? t('account:claimOrders.successMessage', { count: claimResult.count })
                : t('account:claimOrders.noneFoundMessage')}
            </span>
          </div>

          {claimResult.count > 0 && (
            <Link to={ROUTES.ACCOUNT_ORDERS} className="shrink-0">
              <Button variant="primary-gradient" size="sm">
                {t('account:claimOrders.viewOrders')}
              </Button>
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
