import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '@/api/client';
import {
  useCreateOwnerServicePlan,
  useUpdateOwnerServicePlan,
} from '@/api/owner/servicePlans';
import { useToast } from '@/app/providers';
import { egpToPiasters, piastersToEgp } from '@/lib/money';
import { formatNumber } from '@/lib/format';
import { Button, FormField, Input, Switch, Textarea } from '@/components/ui';
import { ServicePlanNativeDialog } from './ServicePlanNativeDialog';

const GROUP_PRESETS = ['lms', 'ecommerce', 'custom', 'saas', 'consulting'];

export function ServicePlanFormModal({ isOpen, onClose, plan = null }) {
  const { t } = useTranslation('ownerServicePlans');
  const toast = useToast();
  const isEdit = Boolean(plan?.id);

  const createMutation = useCreateOwnerServicePlan();
  const updateMutation = useUpdateOwnerServicePlan();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [showUnsavedGuard, setShowUnsavedGuard] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        group: z.string().trim().min(1, t('validation.groupRequired')).toLowerCase(),
        name: z.object({
          ar: z.string().trim().min(1, t('validation.nameArRequired')),
          en: z.string().trim().min(1, t('validation.nameEnRequired')),
        }),
        description: z.object({
          ar: z.string().trim().min(1, t('validation.descriptionArRequired')),
          en: z.string().trim().min(1, t('validation.descriptionEnRequired')),
        }),
        startingPriceEgp: z.coerce
          .number({ invalid_type_error: t('validation.priceInvalid') })
          .min(0, t('validation.priceInvalid')),
        deliveryDays: z.coerce
          .number({ invalid_type_error: t('validation.deliveryDaysMin') })
          .int(t('validation.deliveryDaysMin'))
          .min(1, t('validation.deliveryDaysMin')),
        sortOrder: z.coerce
          .number({ invalid_type_error: t('validation.sortOrderInt') })
          .int(t('validation.sortOrderInt')),
        isPopular: z.boolean(),
        isActive: z.boolean(),
        features: z.array(
          z.object({
            ar: z.string().trim().min(1, t('validation.featureBilingualRequired')),
            en: z.string().trim().min(1, t('validation.featureBilingualRequired')),
          })
        ),
      }),
    [t]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      group: 'custom',
      name: { ar: '', en: '' },
      description: { ar: '', en: '' },
      startingPriceEgp: 15000,
      deliveryDays: 21,
      sortOrder: 0,
      isPopular: false,
      isActive: true,
      features: [],
    },
  });

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'features',
  });

  useEffect(() => {
    if (!isOpen) return;
    setShowUnsavedGuard(false);

    reset({
      group: plan?.group || 'custom',
      name: {
        ar: plan?.name?.ar || '',
        en: plan?.name?.en || '',
      },
      description: {
        ar: plan?.description?.ar || '',
        en: plan?.description?.en || '',
      },
      startingPriceEgp: plan ? piastersToEgp(plan.startingPrice) : 15000,
      deliveryDays: plan?.deliveryDays ?? 21,
      sortOrder: plan?.sortOrder ?? 0,
      isPopular: Boolean(plan?.isPopular),
      isActive: plan?.isActive ?? true,
      features: Array.isArray(plan?.features)
        ? plan.features.map((f) => ({ ar: f.ar || '', en: f.en || '' }))
        : [],
    });
  }, [isOpen, plan, reset]);

  const watchedGroup = watch('group');
  const watchedPriceEgp = watch('startingPriceEgp');
  const piastersPreview = egpToPiasters(watchedPriceEgp);

  const handleRequestClose = () => {
    if (isSubmitting) return;
    if (isDirty) {
      setShowUnsavedGuard(true);
      return;
    }
    onClose?.();
  };

  const onSubmit = async (values) => {
    const payload = {
      group: values.group.trim().toLowerCase(),
      name: {
        ar: values.name.ar.trim(),
        en: values.name.en.trim(),
      },
      description: {
        ar: values.description.ar.trim(),
        en: values.description.en.trim(),
      },
      startingPrice: egpToPiasters(values.startingPriceEgp),
      deliveryDays: Math.max(1, Math.trunc(Number(values.deliveryDays) || 1)),
      sortOrder: Math.trunc(Number(values.sortOrder) || 0),
      isPopular: Boolean(values.isPopular),
      isActive: Boolean(values.isActive),
      features: (values.features || []).map((f) => ({
        ar: f.ar.trim(),
        en: f.en.trim(),
      })),
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: plan.id, ...payload });
        toast.success(t('toasts.updated'));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t('toasts.created'));
      }
      onClose?.();
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const mapped = applyApiErrorsToForm(err, setError, {
          fieldMap: { startingPrice: 'startingPriceEgp' },
        });
        if (mapped) return;
      }
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <ServicePlanNativeDialog
      isOpen={isOpen}
      onClose={handleRequestClose}
      preventClose={isSubmitting}
      size="lg"
      title={isEdit ? t('modal.editTitle') : t('modal.createTitle')}
      subtitle={t('modal.subtitle')}
      closeLabel={t('modal.closeLabel')}
      footer={
        <div className="flex flex-col gap-3 w-full">
          {showUnsavedGuard && (
            <div
              role="alert"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs sm:text-sm"
            >
              <span className="text-on-surface font-medium">{t('unsaved.banner')}</span>
              <div className="flex items-center gap-2 shrink-0 justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setShowUnsavedGuard(false);
                    onClose?.();
                  }}
                >
                  {t('unsaved.discard')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  autoFocus
                  onClick={() => setShowUnsavedGuard(false)}
                >
                  {t('unsaved.keepEditing')}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRequestClose}
              disabled={isSubmitting}
            >
              {t('modal.cancel')}
            </Button>
            <Button
              type="submit"
              form="service-plan-form"
              variant="primary-gradient"
              size="sm"
              loading={isSubmitting}
            >
              {isEdit ? t('modal.saveEdit') : t('modal.saveCreate')}
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="service-plan-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
        {/* Group & Presets */}
        <div className="space-y-2.5">
          <FormField
            id="plan-group"
            label={t('modal.groupLabel')}
            required
            hint={t('modal.groupHint')}
            error={errors.group?.message}
          >
            <Input
              autoFocus
              dir="ltr"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="text-start font-mono"
              placeholder={t('modal.groupPlaceholder')}
              {...register('group')}
            />
          </FormField>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-on-surface-variant me-1">
              {t('modal.groupPresetsLabel')}
            </span>
            {GROUP_PRESETS.map((preset) => {
              const active = String(watchedGroup || '').trim().toLowerCase() === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setValue('group', preset, { shouldDirty: true, shouldValidate: true })
                  }
                  className={clsx(
                    'px-2.5 py-1 rounded-full text-xs font-mono border transition-colors min-h-[32px]',
                    active
                      ? 'bg-primary/15 border-primary text-primary font-semibold'
                      : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface'
                  )}
                >
                  <bdi dir="ltr">{preset}</bdi>
                </button>
              );
            })}
          </div>
        </div>

        {/* Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            id="plan-name-ar"
            label={t('modal.nameArLabel')}
            required
            error={errors.name?.ar?.message}
          >
            <Input
              placeholder={t('modal.nameArPlaceholder')}
              {...register('name.ar')}
            />
          </FormField>

          <FormField
            id="plan-name-en"
            label={t('modal.nameEnLabel')}
            required
            error={errors.name?.en?.message}
          >
            <Input
              dir="ltr"
              className="text-start"
              placeholder={t('modal.nameEnPlaceholder')}
              {...register('name.en')}
            />
          </FormField>
        </div>

        {/* Descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            id="plan-desc-ar"
            label={t('modal.descriptionArLabel')}
            required
            error={errors.description?.ar?.message}
          >
            <Textarea
              rows={3}
              className="!min-h-[108px]"
              placeholder={t('modal.descriptionArPlaceholder')}
              {...register('description.ar')}
            />
          </FormField>

          <FormField
            id="plan-desc-en"
            label={t('modal.descriptionEnLabel')}
            required
            error={errors.description?.en?.message}
          >
            <Textarea
              rows={3}
              dir="ltr"
              className="!min-h-[108px] text-start"
              placeholder={t('modal.descriptionEnPlaceholder')}
              {...register('description.en')}
            />
          </FormField>
        </div>

        {/* Pricing, Delivery Days & Order */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <FormField
            id="plan-price"
            label={t('modal.startingPriceLabel')}
            required
            hint={t('modal.piastersHint', { piasters: formatNumber(piastersPreview) })}
            error={errors.startingPriceEgp?.message}
          >
            <div className="relative">
              <Input
                id="plan-price"
                type="number"
                step="any"
                min="0"
                dir="ltr"
                error={Boolean(errors.startingPriceEgp)}
                className="pe-16 font-mono"
                placeholder={t('modal.startingPricePlaceholder')}
                {...register('startingPriceEgp')}
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary bg-surface-container px-2 py-0.5 rounded pointer-events-none">
                {t('modal.currencySuffix')}
              </span>
            </div>
          </FormField>

          <FormField
            id="plan-days"
            label={t('modal.deliveryDaysLabel')}
            required
            error={errors.deliveryDays?.message}
          >
            <Input
              type="number"
              min="1"
              inputMode="numeric"
              dir="ltr"
              className="font-mono"
              placeholder={t('modal.deliveryDaysPlaceholder')}
              {...register('deliveryDays')}
            />
          </FormField>

          <FormField
            id="plan-order"
            label={t('modal.sortOrderLabel')}
            error={errors.sortOrder?.message}
          >
            <Input
              type="number"
              inputMode="numeric"
              dir="ltr"
              className="font-mono"
              {...register('sortOrder')}
            />
          </FormField>
        </div>

        {/* Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/60">
            <Controller
              name="isPopular"
              control={control}
              render={({ field }) => (
                <Switch
                  id="plan-popular"
                  label={t('modal.isPopularLabel')}
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-full"
                />
              )}
            />
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/60">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  id="plan-active"
                  label={t('modal.isActiveLabel')}
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-full"
                />
              )}
            />
          </div>
        </div>

        {/* Repeatable Bilingual Features */}
        <div className="space-y-3 pt-2 border-t border-outline-variant/60">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-on-surface">
              {t('modal.featuresHeading')}
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append({ ar: '', en: '' })}
              iconLeading={<span className="material-symbols-outlined text-[18px]">add</span>}
            >
              {t('modal.addFeature')}
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="text-xs text-on-surface-variant p-4 rounded-xl bg-surface-container border border-dashed border-outline-variant text-center">
              {t('modal.noFeaturesHint')}
            </p>
          ) : (
            <div className="space-y-3">
              {fields.map((fieldItem, idx) => {
                const rowErr =
                  errors.features?.[idx]?.ar?.message || errors.features?.[idx]?.en?.message;
                return (
                  <div
                    key={fieldItem.id}
                    className="p-3 rounded-xl bg-surface-container border border-outline-variant/70 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <div className="flex-1 min-w-0">
                        <Input
                          aria-label={`${t('modal.featureArPlaceholder')} #${idx + 1}`}
                          placeholder={t('modal.featureArPlaceholder')}
                          error={Boolean(errors.features?.[idx]?.ar)}
                          {...register(`features.${idx}.ar`)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Input
                          dir="ltr"
                          className="text-start"
                          aria-label={`${t('modal.featureEnPlaceholder')} #${idx + 1}`}
                          placeholder={t('modal.featureEnPlaceholder')}
                          error={Boolean(errors.features?.[idx]?.en)}
                          {...register(`features.${idx}.en`)}
                        />
                      </div>
                      <div className="flex items-center gap-1 justify-end shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={idx === 0}
                          aria-label={t('modal.moveUp')}
                          title={t('modal.moveUp')}
                          onClick={() => swap(idx, idx - 1)}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            arrow_upward
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={idx === fields.length - 1}
                          aria-label={t('modal.moveDown')}
                          title={t('modal.moveDown')}
                          onClick={() => swap(idx, idx + 1)}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            arrow_downward
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('modal.removeFeature')}
                          title={t('modal.removeFeature')}
                          onClick={() => remove(idx)}
                          className="text-error hover:bg-error/10"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </Button>
                      </div>
                    </div>
                    {rowErr && (
                      <p role="alert" className="text-xs text-error">
                        {rowErr}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </ServicePlanNativeDialog>
  );
}
