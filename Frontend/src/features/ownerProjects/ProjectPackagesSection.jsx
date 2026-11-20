import React from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { egpToPiasters } from '@/lib/money';
import { formatNumber } from '@/lib/format';
import { Badge, Button, Card, FormField, Input, Select, Switch } from '@/components/ui';
import { createEmptyPackage } from './projectUtils';

function PackageCard({
  pkgIndex,
  control,
  register,
  watch,
  errors,
  canRemove,
  onRemove,
  t,
}) {
  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
  } = useFieldArray({
    control,
    name: `packages.${pkgIndex}.features`,
  });

  const pkgErrors = errors?.packages?.[pkgIndex] || {};
  const watchedPriceEgp = watch(`packages.${pkgIndex}.priceEgp`);
  const watchedActive = watch(`packages.${pkgIndex}.isActive`);
  const piastersPreview =
    String(watchedPriceEgp ?? '').trim() !== '' ? egpToPiasters(watchedPriceEgp) : 0;

  return (
    <Card
      padding="sm"
      variant="flat"
      className="bg-surface-container border-outline-variant/80 space-y-4"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-outline-variant/60">
        <div className="flex items-center gap-2">
          <Badge variant={watchedActive ? 'success' : 'neutral'} dot size="sm">
            {t('modal.packages.packageIndex', { index: formatNumber(pkgIndex + 1) })}
          </Badge>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canRemove}
          onClick={onRemove}
          className="text-error hover:bg-error/10 !h-9 px-2.5"
          iconLeading={<span className="material-symbols-outlined text-[17px]">delete</span>}
        >
          {t('modal.packages.removePackage')}
        </Button>
      </div>

      {/* Key + Names */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          id={`pkg-${pkgIndex}-key`}
          label={t('modal.packages.keyLabel')}
          required
          error={pkgErrors.key?.message}
        >
          <Input
            dir="ltr"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            className="font-mono text-start"
            placeholder={t('modal.packages.keyPlaceholder')}
            {...register(`packages.${pkgIndex}.key`)}
          />
        </FormField>

        <FormField
          id={`pkg-${pkgIndex}-name-ar`}
          label={t('modal.packages.nameArLabel')}
          required
          error={pkgErrors.name?.ar?.message}
        >
          <Input
            placeholder={t('modal.packages.nameArPlaceholder')}
            {...register(`packages.${pkgIndex}.name.ar`)}
          />
        </FormField>

        <FormField
          id={`pkg-${pkgIndex}-name-en`}
          label={t('modal.packages.nameEnLabel')}
          required
          error={pkgErrors.name?.en?.message}
        >
          <Input
            dir="ltr"
            className="text-start"
            placeholder={t('modal.packages.nameEnPlaceholder')}
            {...register(`packages.${pkgIndex}.name.en`)}
          />
        </FormField>
      </div>

      {/* Pricing, License, Support Days */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FormField
          id={`pkg-${pkgIndex}-price`}
          label={t('modal.packages.priceLabel')}
          required
          hint={t('modal.packages.piastersHint', { piasters: formatNumber(piastersPreview) })}
          error={pkgErrors.priceEgp?.message}
        >
          <div className="relative">
            <Input
              id={`pkg-${pkgIndex}-price`}
              type="number"
              step="any"
              min="0"
              dir="ltr"
              error={Boolean(pkgErrors.priceEgp)}
              className="pe-14 font-mono"
              placeholder={t('modal.packages.pricePlaceholder')}
              {...register(`packages.${pkgIndex}.priceEgp`)}
            />
            <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-primary bg-surface-container-high px-2 py-0.5 rounded pointer-events-none">
              {t('modal.packages.currencySuffix')}
            </span>
          </div>
        </FormField>

        <FormField
          id={`pkg-${pkgIndex}-compare`}
          label={t('modal.packages.compareAtPriceLabel')}
          error={pkgErrors.compareAtPriceEgp?.message}
        >
          <div className="relative">
            <Input
              id={`pkg-${pkgIndex}-compare`}
              type="number"
              step="any"
              min="0"
              dir="ltr"
              error={Boolean(pkgErrors.compareAtPriceEgp)}
              className="pe-14 font-mono"
              placeholder={t('modal.packages.compareAtPricePlaceholder')}
              {...register(`packages.${pkgIndex}.compareAtPriceEgp`)}
            />
            <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded pointer-events-none">
              {t('modal.packages.currencySuffix')}
            </span>
          </div>
        </FormField>

        <FormField
          id={`pkg-${pkgIndex}-license`}
          label={t('modal.packages.licenseTypeLabel')}
          error={pkgErrors.licenseType?.message}
        >
          <Select {...register(`packages.${pkgIndex}.licenseType`)}>
            <option value="single">{t('modal.packages.licenseSingle')}</option>
            <option value="multi">{t('modal.packages.licenseMulti')}</option>
          </Select>
        </FormField>

        <FormField
          id={`pkg-${pkgIndex}-support`}
          label={t('modal.packages.supportDaysLabel')}
          error={pkgErrors.supportDays?.message}
        >
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            dir="ltr"
            className="font-mono"
            {...register(`packages.${pkgIndex}.supportDays`)}
          />
        </FormField>
      </div>

      {/* Popular & Active Switches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/60">
          <Controller
            name={`packages.${pkgIndex}.isPopular`}
            control={control}
            render={({ field }) => (
              <Switch
                id={`pkg-${pkgIndex}-popular`}
                label={t('modal.packages.isPopularLabel')}
                checked={Boolean(field.value)}
                onChange={(e) => field.onChange(e.target.checked)}
                className="w-full"
              />
            )}
          />
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/60">
          <Controller
            name={`packages.${pkgIndex}.isActive`}
            control={control}
            render={({ field }) => (
              <Switch
                id={`pkg-${pkgIndex}-active`}
                label={t('modal.packages.isActiveLabel')}
                checked={field.value !== false}
                onChange={(e) => field.onChange(e.target.checked)}
                className="w-full"
              />
            )}
          />
        </div>
      </div>

      {/* Nested Repeatable Package Features */}
      <div className="space-y-2.5 pt-2 border-t border-outline-variant/50">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-on-surface-variant">
            {t('modal.packages.featuresLabel')}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="!h-8 px-3 text-xs"
            onClick={() => appendFeature({ ar: '', en: '' })}
            iconLeading={<span className="material-symbols-outlined text-[16px]">add</span>}
          >
            {t('modal.packages.addPackageFeature')}
          </Button>
        </div>

        {featureFields.map((feat, fIdx) => {
          const featErr =
            pkgErrors.features?.[fIdx]?.ar?.message || pkgErrors.features?.[fIdx]?.en?.message;
          return (
            <div key={feat.id} className="space-y-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder={t('modal.packages.packageFeatureArPlaceholder')}
                    error={Boolean(pkgErrors.features?.[fIdx]?.ar)}
                    {...register(`packages.${pkgIndex}.features.${fIdx}.ar`)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    dir="ltr"
                    className="text-start"
                    placeholder={t('modal.packages.packageFeatureEnPlaceholder')}
                    error={Boolean(pkgErrors.features?.[fIdx]?.en)}
                    {...register(`packages.${pkgIndex}.features.${fIdx}.en`)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('modal.techFeatures.removeFeature')}
                  onClick={() => removeFeature(fIdx)}
                  className="text-error hover:bg-error/10 shrink-0 self-end sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </Button>
              </div>
              {featErr && (
                <p role="alert" className="text-xs text-error">
                  {featErr}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function ProjectPackagesSection({ control, register, watch, errors }) {
  const { t } = useTranslation('ownerProjects');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'packages',
  });

  const watchedPackages = watch('packages') || [];
  const hasActivePackage = watchedPackages.some((p) => p && p.isActive !== false);
  const rootPackagesError = errors?.packages?.root?.message || errors?.packages?.message;

  return (
    <section className="space-y-4">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
            <span>{t('modal.packages.heading')}</span>
            <span className="text-primary font-bold" aria-hidden="true">
              *
            </span>
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">{t('modal.packages.subtitle')}</p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append(createEmptyPackage(fields.length))}
          iconLeading={<span className="material-symbols-outlined text-[18px]">add</span>}
        >
          {t('modal.packages.addPackage')}
        </Button>
      </div>

      {!hasActivePackage && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-on-surface"
        >
          <span className="material-symbols-outlined text-amber-400 text-[18px] shrink-0">
            warning
          </span>
          <span>{t('modal.packages.activeRequiredBanner')}</span>
        </div>
      )}

      {typeof rootPackagesError === 'string' && (
        <p role="alert" className="text-xs sm:text-[13px] text-error flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
          <span>{rootPackagesError}</span>
        </p>
      )}

      <div className="space-y-4">
        {fields.map((fieldItem, pkgIndex) => (
          <PackageCard
            key={fieldItem.id}
            pkgIndex={pkgIndex}
            control={control}
            register={register}
            watch={watch}
            errors={errors}
            canRemove={fields.length > 1}
            onRemove={() => remove(pkgIndex)}
            t={t}
          />
        ))}
      </div>
    </section>
  );
}
