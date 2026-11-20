import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang, useToast } from '@/app/providers';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '@/api/client';
import {
  useCreateOwnerCoupon,
  useOwnerCouponProjects,
  useUpdateOwnerCoupon,
} from '@/api/owner/coupons';
import { localized } from '@/lib/localized';
import {
  Badge,
  Button,
  Checkbox,
  FormField,
  Input,
  Select,
  Skeleton,
  Switch,
} from '@/components/ui';
import { OwnerModal } from '@/features/ownerOrders/NativeDialog';
import {
  buildCouponSchema,
  couponToFormValues,
  formValuesToCouponPayload,
} from './couponSchema';

export function CouponFormModal({ isOpen, coupon = null, onClose }) {
  const { t } = useTranslation(['ownerCoupons', 'common']);
  const { lang } = useLang();
  const toast = useToast();

  const isEdit = Boolean(coupon);
  const [projectSearch, setProjectSearch] = useState('');

  const createMutation = useCreateOwnerCoupon();
  const updateMutation = useUpdateOwnerCoupon();
  const { data: projects = [], isLoading: loadingProjects } = useOwnerCouponProjects({
    enabled: isOpen,
  });

  const schema = useMemo(() => buildCouponSchema(t), [t]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: couponToFormValues(coupon),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isOpen) {
      reset(couponToFormValues(coupon));
      setProjectSearch('');
    }
  }, [isOpen, coupon, reset]);

  const watchedType = watch('type');
  const watchedValue = watch('value');
  const watchedSelectedIds = watch('appliesToProjects') || [];
  const isFreePercent = watchedType === 'percent' && Number(watchedValue) === 100;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      const ar = (p.title?.ar || '').toLowerCase();
      const en = (p.title?.en || '').toLowerCase();
      const slug = (p.slug || '').toLowerCase();
      return ar.includes(q) || en.includes(q) || slug.includes(q);
    });
  }, [projects, projectSearch]);

  const toggleProjectId = (projectId) => {
    const current = new Set(watchedSelectedIds);
    if (current.has(projectId)) {
      current.delete(projectId);
    } else {
      current.add(projectId);
    }
    setValue('appliesToProjects', Array.from(current), { shouldDirty: true });
  };

  const onSubmit = async (values) => {
    const payload = formValuesToCouponPayload(values);
    try {
      if (isEdit) {
        const id = coupon.id || coupon._id;
        const updated = await updateMutation.mutateAsync({ id, ...payload });
        toast.success(
          t('ownerCoupons:messages.updated', { code: updated?.code || payload.code })
        );
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success(
          t('ownerCoupons:messages.created', { code: created?.code || payload.code })
        );
      }
      onClose?.();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409 || err.code === 'CONFLICT') {
          setError('code', {
            type: 'server',
            message: t('ownerCoupons:messages.duplicateCode'),
          });
          return;
        }
        if (err.status === 400 && applyApiErrorsToForm(err, setError)) {
          return;
        }
      }
      toast.error(getApiErrorMessage(err));
    }
  };

  const codeReg = register('code');

  return (
    <OwnerModal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : onClose}
      preventClose={isSubmitting}
      size="lg"
      title={isEdit ? t('ownerCoupons:modal.editTitle') : t('ownerCoupons:modal.createTitle')}
      description={
        isEdit
          ? t('ownerCoupons:modal.editDescription', { code: coupon?.code || '' })
          : t('ownerCoupons:modal.createDescription')
      }
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="owner-coupon-form"
            variant="primary-gradient"
            size="sm"
            loading={isSubmitting}
            iconLeading={
              <span className="material-symbols-outlined text-[18px]">
                {isEdit ? 'save' : 'add_circle'}
              </span>
            }
          >
            {isEdit
              ? t('ownerCoupons:modal.submitUpdate')
              : t('ownerCoupons:modal.submitCreate')}
          </Button>
        </>
      }
    >
      <form id="owner-coupon-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Code + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            id="coupon-code"
            label={t('ownerCoupons:modal.fields.code')}
            required
            hint={t('ownerCoupons:modal.fields.codeHint')}
            error={errors.code?.message}
          >
            <Input
              dir="ltr"
              autoComplete="off"
              placeholder={t('ownerCoupons:modal.fields.codePlaceholder')}
              className="font-mono uppercase tracking-wider placeholder:text-outline"
              disabled={isSubmitting}
              {...codeReg}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                codeReg.onChange(e);
              }}
            />
          </FormField>

          <FormField
            id="coupon-type"
            label={t('ownerCoupons:modal.fields.type')}
            required
            error={errors.type?.message}
          >
            <Select disabled={isSubmitting} {...register('type')}>
              <option value="percent">{t('ownerCoupons:modal.fields.typePercent')}</option>
              <option value="fixed">{t('ownerCoupons:modal.fields.typeFixed')}</option>
            </Select>
          </FormField>
        </div>

        {/* Value + Max Uses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            id="coupon-value"
            label={
              watchedType === 'fixed'
                ? t('ownerCoupons:modal.fields.valueFixed')
                : t('ownerCoupons:modal.fields.valuePercent')
            }
            required
            hint={
              watchedType === 'fixed' ? t('ownerCoupons:modal.fields.valueFixedHint') : undefined
            }
            error={errors.value?.message}
          >
            <Input
              type="number"
              dir="ltr"
              min={watchedType === 'fixed' ? '0.01' : '1'}
              max={watchedType === 'percent' ? '100' : undefined}
              step={watchedType === 'fixed' ? '0.01' : '1'}
              placeholder={
                watchedType === 'fixed'
                  ? t('ownerCoupons:modal.fields.valueFixedPlaceholder')
                  : t('ownerCoupons:modal.fields.valuePercentPlaceholder')
              }
              className="font-mono placeholder:text-outline"
              disabled={isSubmitting}
              iconTrailing={
                <span className="text-xs font-semibold text-primary">
                  {watchedType === 'fixed' ? t('common:currency.egp') : '%'}
                </span>
              }
              {...register('value')}
            />
          </FormField>

          <FormField
            id="coupon-max-uses"
            label={t('ownerCoupons:modal.fields.maxUses')}
            required={isFreePercent}
            hint={t('ownerCoupons:modal.fields.maxUsesHint')}
            error={errors.maxUses?.message}
          >
            <Input
              type="number"
              dir="ltr"
              min="1"
              step="1"
              placeholder={t('ownerCoupons:modal.fields.maxUsesPlaceholder')}
              className="font-mono placeholder:text-outline"
              disabled={isSubmitting}
              {...register('maxUses')}
            />
          </FormField>
        </div>

        {/* Expiry Date + Active Switch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
          <FormField
            id="coupon-expires-at"
            label={t('ownerCoupons:modal.fields.expiresAt')}
            hint={t('ownerCoupons:modal.fields.expiresAtHint')}
            error={errors.expiresAt?.message}
          >
            <Input
              type="datetime-local"
              dir="ltr"
              className="font-mono"
              disabled={isSubmitting}
              {...register('expiresAt')}
            />
          </FormField>

          <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 sm:mt-7">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  id="coupon-is-active"
                  label={t('ownerCoupons:modal.fields.isActive')}
                  description={t('ownerCoupons:modal.fields.isActiveDescription')}
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-full"
                />
              )}
            />
          </div>
        </div>

        {/* Applicable Projects Multi-select */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-sm font-medium text-on-surface">
              {t('ownerCoupons:modal.fields.appliesToProjects')}
            </label>
            <div className="flex items-center gap-2">
              {watchedSelectedIds.length > 0 ? (
                <>
                  <Badge variant="primary" size="sm">
                    {t('ownerCoupons:modal.fields.selectedProjectsCount', {
                      count: watchedSelectedIds.length,
                    })}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setValue('appliesToProjects', [], { shouldDirty: true })}
                    className="text-xs font-medium text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {t('ownerCoupons:modal.fields.clearSelection')}
                  </button>
                </>
              ) : (
                <Badge variant="neutral" size="sm">
                  {t('ownerCoupons:table.allProjects')}
                </Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-on-surface-variant">
            {t('ownerCoupons:modal.fields.appliesToProjectsHint')}
          </p>

          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3 space-y-3">
            <Input
              type="search"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder={t('ownerCoupons:modal.fields.searchProjectsPlaceholder')}
              className="h-10 text-xs placeholder:text-outline"
              iconLeading={<span className="material-symbols-outlined text-[18px]">search</span>}
            />

            <div className="max-h-48 overflow-y-auto space-y-1 pe-1">
              {loadingProjects ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-8 w-full rounded-lg" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              ) : filteredProjects.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-4">
                  {t('ownerCoupons:modal.fields.noProjectsAvailable')}
                </p>
              ) : (
                filteredProjects.map((project) => {
                  const pid = project.id || project._id;
                  const checked = watchedSelectedIds.includes(pid);
                  const title = localized(project.title, lang) || project.slug;
                  return (
                    <div
                      key={pid}
                      className={clsx(
                        'px-2.5 rounded-lg border transition-colors',
                        checked
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-transparent hover:bg-surface-container'
                      )}
                    >
                      <Checkbox
                        id={`coupon-proj-${pid}`}
                        checked={checked}
                        onChange={() => toggleProjectId(pid)}
                        disabled={isSubmitting}
                        label={title}
                        description={project.slug}
                        className="w-full"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </form>
    </OwnerModal>
  );
}
