import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResendVerification } from '../../api/auth';
import { ApiError, getApiErrorMessage } from '../../api/client';
import { useToast } from '../../app/providers';
import { ROUTES } from '../../config/routes';
import { Badge, Button, Card, Spinner } from '../../components/ui';
import { Breadcrumbs } from '../../components/shared';
import { useAuth } from '../../features/auth';
import {
  AccountNavTabs,
  AccountPasswordForm,
  ClaimOrdersCard,
  DeleteAccountSection,
  ProfileForm,
} from '../../features/account';

export default function AccountPage() {
  const { t } = useTranslation(['account', 'common']);
  const location = useLocation();
  const toast = useToast();
  const { user, isLoading, refresh } = useAuth();
  const resendMutation = useResendVerification();

  const justRegistered = Boolean(location.state?.justRegistered);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  const handleResendVerification = async () => {
    setResendMessage('');
    setResendError('');
    try {
      await resendMutation.mutateAsync({});
      setResendMessage(t('account:verificationBanner.sentMessage'));
      toast.success(t('account:verificationBanner.sentToast'));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_VERIFIED') {
        await refresh();
        toast.info(t('account:verificationBanner.alreadyVerifiedToast'));
        return;
      }
      const msg = getApiErrorMessage(err, t);
      setResendError(msg);
      toast.error(msg);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center">
        <Spinner size="lg" className="text-primary mb-3" />
        <p className="text-sm text-on-surface-variant">{t('common:states.loading')}</p>
      </div>
    );
  }

  return (
    <div className="w-full bc-band-wash py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <Breadcrumbs
          items={[
            { label: t('common:nav.home'), href: ROUTES.HOME },
            { label: t('account:page.title') },
          ]}
        />

        {/* Header + Tabs */}
        <header className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                  {t('account:page.title')}
                </h1>
                {user?.role === 'admin' && (
                  <Badge variant="primary" size="sm">
                    {t('account:page.adminBadge')}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-on-surface-variant">
                {t('account:page.subtitle')}
              </p>
            </div>
          </div>

          <AccountNavTabs activeTab="profile" />
        </header>

        {/* Email Verification Banner */}
        {user && !user.emailVerified && (
          <Card
            variant="flat"
            padding="md"
            role="status"
            className="border-chip-amber-border bg-chip-amber-bg/60 space-y-3"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bc-chip-amber border flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded text-[21px]" aria-hidden="true">
                    mark_email_unread
                  </span>
                </div>
                <div className="space-y-1">
                  <h2 className="text-sm sm:text-base font-bold text-on-surface">
                    {justRegistered
                      ? t('account:verificationBanner.justRegisteredTitle')
                      : t('account:verificationBanner.title')}
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    {justRegistered
                      ? t('account:verificationBanner.justRegisteredDescription')
                      : t('account:verificationBanner.description')}{' '}
                    <bdi dir="ltr" className="font-mono font-semibold text-on-surface">
                      {user.email}
                    </bdi>
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="primary-gradient"
                size="sm"
                loading={resendMutation.isPending}
                onClick={handleResendVerification}
                className="shrink-0"
                iconLeading={
                  <span className="material-symbols-rounded text-[18px]" aria-hidden="true">
                    send
                  </span>
                }
              >
                {resendMutation.isPending
                  ? t('account:verificationBanner.sending')
                  : t('account:verificationBanner.resendAction')}
              </Button>
            </div>

            {resendMessage && (
              <p className="text-xs sm:text-sm font-medium text-primary flex items-center gap-1.5">
                <span className="material-symbols-rounded text-[17px]" aria-hidden="true">
                  check_circle
                </span>
                <span>{resendMessage}</span>
              </p>
            )}

            {resendError && (
              <p role="alert" className="text-xs sm:text-sm font-medium text-error flex items-center gap-1.5">
                <span className="material-symbols-rounded text-[17px]" aria-hidden="true">
                  error
                </span>
                <span>{resendError}</span>
              </p>
            )}
          </Card>
        )}

        {/* Profile Form */}
        {user && <ProfileForm user={user} />}

        {/* Claim Past Guest Orders (only when emailVerified) */}
        {user?.emailVerified && <ClaimOrdersCard user={user} />}

        {/* Change Password */}
        {user && <AccountPasswordForm />}

        {/* Delete Account (customers only) */}
        {user && <DeleteAccountSection user={user} />}
      </div>
    </div>
  );
}
