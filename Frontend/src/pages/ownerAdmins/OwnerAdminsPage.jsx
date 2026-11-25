import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useLang, useToast } from '@/app/providers';
import { useOwnerPageTitle } from '@/components/layout/OwnerLayout';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '@/api/client';
import {
  useCreateOwnerAdmin,
  useDeleteOwnerAdmin,
  useOwnerAdmins,
} from '@/api/owner/users';
import { formatDateTime } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  FormField,
  Input,
  Select,
  Skeleton,
} from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/shared';
import { useAuth } from '@/features/auth';
import { OwnerConfirmDialog, OwnerModal } from '@/features/ownerOrders/NativeDialog';

export default function OwnerAdminsPage() {
  const { t } = useTranslation(['ownerUsers', 'common']);
  const { lang } = useLang();
  const toast = useToast();
  const { user: currentUser } = useAuth();

  useOwnerPageTitle(t('ownerUsers:admins.title'));

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createBannerError, setCreateBannerError] = useState('');

  const { data: admins = [], isLoading, isError, error, refetch } = useOwnerAdmins();
  const createAdminMutation = useCreateOwnerAdmin();
  const deleteAdminMutation = useDeleteOwnerAdmin();

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(2, t('ownerUsers:validation.nameMin'))
          .max(100, t('ownerUsers:validation.nameMax')),
        email: z
          .string()
          .trim()
          .min(1, t('ownerUsers:validation.emailRequired'))
          .email(t('ownerUsers:validation.emailInvalid')),
        locale: z.enum(['ar', 'en']).default(lang === 'en' ? 'en' : 'ar'),
      }),
    [t, lang]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      locale: lang === 'en' ? 'en' : 'ar',
    },
  });

  const isCreating = isSubmitting || createAdminMutation.isPending;

  const activeAdminsCount = admins.filter((a) => a.status === 'active').length;

  const openCreateModal = () => {
    setCreateBannerError('');
    reset({
      name: '',
      email: '',
      locale: lang === 'en' ? 'en' : 'ar',
    });
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setCreateOpen(false);
    setCreateBannerError('');
  };

  const onCreateSubmit = async (values) => {
    setCreateBannerError('');
    try {
      const created = await createAdminMutation.mutateAsync({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        locale: values.locale,
      });
      setCreateOpen(false);
      toast.success(
        t('ownerUsers:admins.toasts.created', {
          email: created?.email || values.email.trim(),
        })
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const msg = t('ownerUsers:admins.errors.emailExists');
        setError('email', { type: 'server', message: msg });
        setCreateBannerError(msg);
        return;
      }
      if (err instanceof ApiError) {
        applyApiErrorsToForm(err, setError);
      }
      const msg = getApiErrorMessage(err, t);
      setCreateBannerError(msg);
      toast.error(msg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminMutation.mutateAsync(deleteTarget.id);
      toast.success(t('ownerUsers:admins.toasts.deleted'));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              {t('ownerUsers:admins.title')}
            </h1>
            {!isLoading && (
              <Badge variant="neutral" size="sm">
                {t('ownerUsers:admins.totalBadge', { count: admins.length })}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            {t('ownerUsers:admins.subtitle')}
          </p>
        </div>

        <Button
          type="button"
          variant="primary-gradient"
          size="md"
          onClick={openCreateModal}
          className="shrink-0"
          iconLeading={
            <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
              person_add
            </span>
          }
        >
          {t('ownerUsers:admins.createAction')}
        </Button>
      </header>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3" aria-hidden="true">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState
          title={t('common:states.errorTitle')}
          message={getApiErrorMessage(error, t)}
          onRetry={refetch}
        />
      ) : admins.length === 0 ? (
        <EmptyState
          icon="admin_panel_settings"
          title={t('ownerUsers:admins.emptyTitle')}
          description={t('ownerUsers:admins.emptyDescription')}
          action={
            <Button
              type="button"
              variant="primary-gradient"
              size="md"
              onClick={openCreateModal}
            >
              {t('ownerUsers:admins.createAction')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-card border border-card-border rounded-2xl shadow-card overflow-hidden">
            <div
              role="region"
              aria-label={t('ownerUsers:admins.tableRegion')}
              className="overflow-x-auto bc-scroll"
            >
              <table className="min-w-full text-sm text-start border-collapse">
                <thead className="bg-section-band border-b border-card-border text-xs font-semibold text-muted uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerUsers:admins.columns.admin')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerUsers:admins.columns.status')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerUsers:admins.columns.lastLogin')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerUsers:admins.columns.createdAt')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-end whitespace-nowrap">
                      {t('ownerUsers:admins.columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {admins.map((admin) => {
                    const isSelf = String(admin.id) === String(currentUser?.id);
                    const isLastAdmin =
                      admins.length <= 1 ||
                      (admin.status === 'active' && activeAdminsCount <= 1);
                    const canDelete = !isSelf && !isLastAdmin;

                    return (
                      <tr
                        key={admin.id}
                        className="even:bg-section-band/35 hover:bg-brand-soft/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-on-surface truncate">
                              {admin.name}
                            </span>
                            {isSelf && (
                              <Badge variant="primary" size="sm">
                                {t('ownerUsers:admins.youBadge')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted truncate mt-0.5">
                            <bdi dir="ltr">{admin.email}</bdi>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge
                            variant={admin.status === 'active' ? 'success' : 'error'}
                            size="sm"
                            dot
                          >
                            {t(`ownerUsers:status.${admin.status}`, {
                              defaultValue: admin.status,
                            })}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-muted">
                          {admin.lastLoginAt
                            ? formatDateTime(admin.lastLoginAt, lang)
                            : t('ownerUsers:admins.neverLoggedIn')}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-muted">
                          {formatDateTime(admin.createdAt, lang)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-end">
                          {canDelete ? (
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => setDeleteTarget(admin)}
                            >
                              {t('common:actions.delete')}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted">
                              {isSelf
                                ? t('ownerUsers:admins.selfProtected')
                                : t('ownerUsers:admins.lastProtected')}
                            </span>
                          )}
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
            {admins.map((admin) => {
              const isSelf = String(admin.id) === String(currentUser?.id);
              const isLastAdmin =
                admins.length <= 1 ||
                (admin.status === 'active' && activeAdminsCount <= 1);
              const canDelete = !isSelf && !isLastAdmin;

              return (
                <Card key={admin.id} variant="panel" padding="sm" className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-on-surface truncate">
                          {admin.name}
                        </span>
                        {isSelf && (
                          <Badge variant="primary" size="sm">
                            {t('ownerUsers:admins.youBadge')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted truncate mt-0.5">
                        <bdi dir="ltr">{admin.email}</bdi>
                      </div>
                    </div>

                    <Badge
                      variant={admin.status === 'active' ? 'success' : 'error'}
                      size="sm"
                      dot
                    >
                      {t(`ownerUsers:status.${admin.status}`, {
                        defaultValue: admin.status,
                      })}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs text-muted pt-2 border-t border-outline-variant/60">
                    <span>
                      {admin.lastLoginAt
                        ? formatDateTime(admin.lastLoginAt, lang)
                        : t('ownerUsers:admins.neverLoggedIn')}
                    </span>

                    {canDelete && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(admin)}
                      >
                        {t('common:actions.delete')}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      <OwnerModal
        isOpen={createOpen}
        onClose={closeCreateModal}
        preventClose={isCreating}
        size="md"
        title={t('ownerUsers:admins.createModal.title')}
        description={t('ownerUsers:admins.createModal.description')}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={closeCreateModal}
              disabled={isCreating}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              form="create-admin-form"
              variant="primary-gradient"
              size="sm"
              loading={isCreating}
              disabled={isCreating}
            >
              {isCreating
                ? t('ownerUsers:admins.createModal.submitting')
                : t('ownerUsers:admins.createModal.submit')}
            </Button>
          </>
        }
      >
        <form
          id="create-admin-form"
          onSubmit={handleSubmit(onCreateSubmit)}
          noValidate
          className="space-y-4"
        >
          {createBannerError && (
            <div
              role="alert"
              className="rounded-xl border border-error/30 bg-error/10 p-3 text-xs sm:text-sm text-error flex items-start gap-2"
            >
              <span className="material-symbols-rounded text-[18px] shrink-0 mt-0.5" aria-hidden="true">
                error
              </span>
              <span>{createBannerError}</span>
            </div>
          )}

          <FormField
            id="create-admin-name"
            label={t('ownerUsers:admins.createModal.nameLabel')}
            error={errors.name?.message}
            required
          >
            <Input
              id="create-admin-name"
              type="text"
              autoComplete="name"
              enterKeyHint="next"
              disabled={isCreating}
              error={Boolean(errors.name)}
              placeholder={t('ownerUsers:admins.createModal.namePlaceholder')}
              iconLeading={
                <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                  person
                </span>
              }
              {...register('name')}
            />
          </FormField>

          <FormField
            id="create-admin-email"
            label={t('ownerUsers:admins.createModal.emailLabel')}
            hint={t('ownerUsers:admins.createModal.emailHint')}
            error={errors.email?.message}
            required
          >
            <Input
              id="create-admin-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="done"
              disabled={isCreating}
              error={Boolean(errors.email)}
              placeholder={t('ownerUsers:admins.createModal.emailPlaceholder')}
              className="text-start"
              iconLeading={
                <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                  mail
                </span>
              }
              {...register('email')}
            />
          </FormField>

          <FormField
            id="create-admin-locale"
            label={t('ownerUsers:admins.createModal.localeLabel')}
            error={errors.locale?.message}
          >
            <Controller
              name="locale"
              control={control}
              render={({ field }) => (
                <Select
                  id="create-admin-locale"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={isCreating}
                >
                  <option value="ar">{t('ownerUsers:admins.createModal.localeAr')}</option>
                  <option value="en">{t('ownerUsers:admins.createModal.localeEn')}</option>
                </Select>
              )}
            />
          </FormField>
        </form>
      </OwnerModal>

      {/* Delete Admin Confirm Dialog */}
      <OwnerConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleteAdminMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('ownerUsers:admins.confirmDelete.title')}
        message={
          deleteTarget
            ? t('ownerUsers:admins.confirmDelete.message', {
                name: deleteTarget.name,
                email: deleteTarget.email,
              })
            : ''
        }
        confirmText={t('common:actions.delete')}
        cancelText={t('common:actions.cancel')}
        variant="danger"
        loading={deleteAdminMutation.isPending}
      />
    </div>
  );
}
