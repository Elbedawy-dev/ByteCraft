import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '@/api/client';
import {
  useCreateOwnerProject,
  useOwnerProject,
  useUpdateOwnerProject,
} from '@/api/owner/projects';
import { useOwnerCategories } from '@/api/owner/categories';
import { useLang, useToast } from '@/app/providers';
import { localized } from '@/lib/localized';
import { formatNumber } from '@/lib/format';
import {
  Button,
  FormField,
  Input,
  Select,
  Skeleton,
  Switch,
  TagInput,
  Textarea,
} from '@/components/ui';
import { ErrorState } from '@/components/shared';
import { ProjectNativeDialog } from './ProjectNativeDialog';
import { ProjectMediaSection } from './ProjectMediaSection';
import { ProjectPackagesSection } from './ProjectPackagesSection';
import {
  formValuesToProjectPayload,
  getDefaultProjectFormValues,
  projectToFormValues,
  suggestProjectSlug,
} from './projectUtils';

const SECTION_IDS = ['all', 'basics', 'media', 'techFeatures', 'packages', 'preview', 'repo'];
const STEP_ORDER = ['basics', 'media', 'techFeatures', 'packages', 'preview', 'repo'];

export function ProjectFormModal({ isOpen, onClose, projectId = null }) {
  const { t } = useTranslation('ownerProjects');
  const { lang } = useLang();
  const toast = useToast();

  const isEdit = Boolean(projectId);
  const [activeSection, setActiveSection] = useState('all');
  const [showUnsavedGuard, setShowUnsavedGuard] = useState(false);
  const slugManuallyEditedRef = useRef(false);

  const {
    data: fullProject,
    isLoading: isLoadingProject,
    isError: isLoadError,
    error: loadError,
    refetch: refetchProject,
  } = useOwnerProject(isOpen && isEdit ? projectId : null);

  const { data: categories = [] } = useOwnerCategories();
  const createMutation = useCreateOwnerProject();
  const updateMutation = useUpdateOwnerProject();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const schema = useMemo(
    () =>
      z.object({
        title: z.object({
          ar: z.string().trim().min(1, t('modal.validation.titleArRequired')),
          en: z.string().trim().min(1, t('modal.validation.titleEnRequired')),
        }),
        tagline: z.object({
          ar: z.string().trim().min(1, t('modal.validation.taglineArRequired')),
          en: z.string().trim().min(1, t('modal.validation.taglineEnRequired')),
        }),
        description: z.object({
          ar: z.string().trim().min(1, t('modal.validation.descriptionArRequired')),
          en: z.string().trim().min(1, t('modal.validation.descriptionEnRequired')),
        }),
        category: z.string().regex(/^[0-9a-fA-F]{24}$/, t('modal.validation.categoryRequired')),
        slug: z.string().trim().optional().default(''),
        status: z.enum(['draft', 'published', 'archived']).default('draft'),
        isFeatured: z.boolean().default(false),
        sortOrder: z.coerce.number().int().default(0),
        thumbnail: z
          .object({
            url: z.string().trim().min(1),
            publicId: z.string().trim().min(1),
          })
          .nullable()
          .refine((val) => Boolean(val && val.url && val.publicId), {
            message: t('modal.validation.thumbnailRequired'),
          }),
        gallery: z
          .array(
            z.object({
              url: z.string().trim().min(1),
              publicId: z.string().trim().min(1),
            })
          )
          .default([]),
        techStack: z
          .array(z.string().trim().min(1))
          .min(1, t('modal.validation.techStackMin')),
        features: z
          .array(
            z.object({
              ar: z.string().trim().min(1, t('modal.validation.featureBilingualRequired')),
              en: z.string().trim().min(1, t('modal.validation.featureBilingualRequired')),
            })
          )
          .default([]),
        packages: z
          .array(
            z.object({
              key: z.string().trim().min(1, t('modal.validation.packageKeyRequired')).toLowerCase(),
              name: z.object({
                ar: z.string().trim().min(1, t('modal.validation.packageNameArRequired')),
                en: z.string().trim().min(1, t('modal.validation.packageNameEnRequired')),
              }),
              priceEgp: z.coerce
                .number({ invalid_type_error: t('modal.validation.packagePriceInvalid') })
                .min(0, t('modal.validation.packagePriceInvalid')),
              compareAtPriceEgp: z
                .union([z.literal(''), z.coerce.number().min(0, t('modal.validation.packageCompareInvalid'))])
                .optional(),
              licenseType: z.enum(['single', 'multi']).default('single'),
              supportDays: z.coerce.number().int().min(0).default(30),
              isPopular: z.boolean().default(false),
              isActive: z.boolean().default(true),
              features: z
                .array(
                  z.object({
                    ar: z.string().trim().min(1, t('modal.validation.featureBilingualRequired')),
                    en: z.string().trim().min(1, t('modal.validation.featureBilingualRequired')),
                  })
                )
                .default([]),
            })
          )
          .min(1, t('modal.validation.packagesMin')),
        preview: z.object({
          url: z
            .string()
            .trim()
            .refine((val) => {
              if (!val) return true;
              try {
                const parsed = new URL(val);
                return parsed.protocol === 'http:' || parsed.protocol === 'https:';
              } catch {
                return false;
              }
            }, t('modal.validation.previewUrlInvalid'))
            .default(''),
          mode: z.enum(['iframe', 'external']).default('iframe'),
          demoNote: z.object({
            ar: z.string().optional().default(''),
            en: z.string().optional().default(''),
          }),
          demoCredentials: z.object({
            label: z.string().optional().default('Demo Account'),
            email: z.string().optional().default(''),
            password: z.string().optional().default(''),
          }),
        }),
        privateRepo: z.object({
          provider: z.enum(['github', 'gitlab', 'other']).default('github'),
          owner: z.string().trim().optional().default(''),
          name: z.string().trim().optional().default(''),
          url: z.string().trim().optional().default(''),
        }),
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
    defaultValues: getDefaultProjectFormValues(),
  });

  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
    swap: swapFeature,
  } = useFieldArray({
    control,
    name: 'features',
  });

  // Reset form when opening for create or when fullProject finishes loading
  useEffect(() => {
    if (!isOpen) return;
    setActiveSection('all');
    setShowUnsavedGuard(false);

    if (!isEdit) {
      slugManuallyEditedRef.current = false;
      reset(getDefaultProjectFormValues());
      return;
    }

    if (fullProject) {
      slugManuallyEditedRef.current = true;
      reset(projectToFormValues(fullProject));
    }
  }, [isOpen, isEdit, fullProject, reset]);

  // Auto-suggest slug from English title when creating (unless manually edited)
  const watchedTitleEn = watch('title.en');
  useEffect(() => {
    if (!isOpen || isEdit || slugManuallyEditedRef.current) return;
    setValue('slug', suggestProjectSlug(watchedTitleEn), { shouldDirty: false });
  }, [watchedTitleEn, isOpen, isEdit, setValue]);

  const watchedThumbnail = watch('thumbnail');
  const watchedGallery = watch('gallery');
  const watchedStatus = watch('status');
  const watchedTechStack = watch('techStack');

  const sectionHasError = useMemo(() => {
    return {
      basics: Boolean(
        errors.title ||
          errors.tagline ||
          errors.description ||
          errors.category ||
          errors.slug ||
          errors.status ||
          errors.sortOrder
      ),
      media: Boolean(errors.thumbnail || errors.gallery),
      techFeatures: Boolean(errors.techStack || errors.features),
      packages: Boolean(errors.packages),
      preview: Boolean(errors.preview),
      repo: Boolean(errors.privateRepo),
    };
  }, [errors]);

  const handleRequestClose = () => {
    if (isSubmitting) return;
    if (isDirty) {
      setShowUnsavedGuard(true);
      return;
    }
    onClose?.();
  };

  const handleValidationFailure = (formErrors) => {
    toast.error(t('modal.validation.fixErrorsToast'));
    if (activeSection !== 'all') {
      const firstBroken = STEP_ORDER.find((sec) => {
        if (sec === 'basics')
          return Boolean(
            formErrors.title ||
              formErrors.tagline ||
              formErrors.description ||
              formErrors.category ||
              formErrors.slug
          );
        if (sec === 'media') return Boolean(formErrors.thumbnail || formErrors.gallery);
        if (sec === 'techFeatures') return Boolean(formErrors.techStack || formErrors.features);
        if (sec === 'packages') return Boolean(formErrors.packages);
        if (sec === 'preview') return Boolean(formErrors.preview);
        if (sec === 'repo') return Boolean(formErrors.privateRepo);
        return false;
      });
      if (firstBroken) setActiveSection(firstBroken);
    }
  };

  const submitWithTargetStatus = (targetStatus) =>
    handleSubmit(async (values) => {
      const effectiveStatus = targetStatus || values.status || 'draft';

      if (effectiveStatus === 'published') {
        const hasActivePkg = (values.packages || []).some((p) => p && p.isActive !== false);
        if (!hasActivePkg) {
          setError('packages', {
            type: 'manual',
            message: t('modal.validation.activePackageRequired'),
          });
          setActiveSection((prev) => (prev === 'all' ? 'all' : 'packages'));
          toast.error(t('modal.validation.activePackageRequired'));
          return;
        }
      }

      const payload = formValuesToProjectPayload(values, effectiveStatus);

      try {
        if (isEdit) {
          await updateMutation.mutateAsync({ id: projectId, ...payload });
          toast.success(
            effectiveStatus === 'published' ? t('toasts.published') : t('toasts.updated')
          );
        } else {
          await createMutation.mutateAsync(payload);
          toast.success(
            effectiveStatus === 'published' ? t('toasts.published') : t('toasts.created')
          );
        }
        onClose?.();
      } catch (err) {
        if (err instanceof ApiError && err.details?.length) {
          const mapped = applyApiErrorsToForm(err, setError);
          if (mapped) {
            toast.error(t('modal.validation.fixErrorsToast'));
            return;
          }
        }
        toast.error(getApiErrorMessage(err));
      }
    }, handleValidationFailure);

  const slugRegister = register('slug', {
    onChange: () => {
      slugManuallyEditedRef.current = true;
    },
  });

  const showSection = (id) => activeSection === 'all' || activeSection === id;
  const currentStepIdx = STEP_ORDER.indexOf(activeSection);

  return (
    <ProjectNativeDialog
      isOpen={isOpen}
      onClose={handleRequestClose}
      preventClose={isSubmitting}
      size="xl"
      title={isEdit ? t('modal.editTitle') : t('modal.createTitle')}
      badgeText={t('modal.engineBadge')}
      subtitle={t('modal.subtitle')}
      closeLabel={t('modal.closeLabel')}
      subHeader={
        !isEdit || (!isLoadingProject && !isLoadError) ? (
          <nav
            aria-label={t('modal.sectionsLabel', { defaultValue: t('modal.sections.all') })}
            className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
          >
            {SECTION_IDS.map((secId) => {
              const active = activeSection === secId;
              const hasErr = secId !== 'all' && sectionHasError[secId];
              return (
                <button
                  key={secId}
                  type="button"
                  onClick={() => setActiveSection(secId)}
                  aria-current={active ? 'step' : undefined}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors inline-flex items-center gap-1.5 min-h-[36px]',
                    active
                      ? 'bg-primary text-on-primary font-semibold shadow-sm'
                      : 'bg-surface border border-card-border text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  )}
                >
                  <span>{t(`modal.sections.${secId}`)}</span>
                  {hasErr && (
                    <span
                      className={clsx(
                        'w-2 h-2 rounded-full',
                        active ? 'bg-on-primary' : 'bg-error'
                      )}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        ) : null
      }
      footer={
        !isEdit || (!isLoadingProject && !isLoadError) ? (
          <div className="flex flex-col gap-3 w-full">
            {showUnsavedGuard && (
              <div
                role="alert"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs sm:text-sm"
              >
                <span className="text-on-surface font-medium">{t('modal.unsaved.banner')}</span>
                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setShowUnsavedGuard(false);
                      onClose?.();
                    }}
                  >
                    {t('modal.unsaved.discard')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    autoFocus
                    onClick={() => setShowUnsavedGuard(false)}
                  >
                    {t('modal.unsaved.keepEditing')}
                  </Button>
                </div>
              </div>
            )}

            {/* Step-by-step Prev/Next bar when focused on a single section */}
            {activeSection !== 'all' && (
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-outline-variant/50">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={currentStepIdx <= 0}
                  onClick={() => setActiveSection(STEP_ORDER[currentStepIdx - 1])}
                  iconLeading={
                    <span className="material-symbols-outlined text-[18px] rtl:-scale-x-100">
                      arrow_back
                    </span>
                  }
                >
                  {t('modal.stepNavigation.previousSection')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={currentStepIdx >= STEP_ORDER.length - 1}
                  onClick={() => setActiveSection(STEP_ORDER[currentStepIdx + 1])}
                  iconTrailing={
                    <span className="material-symbols-outlined text-[18px] rtl:-scale-x-100">
                      arrow_forward
                    </span>
                  }
                >
                  {t('modal.stepNavigation.nextSection')}
                </Button>
              </div>
            )}

            {/* Main Modal Footer matching Stitch Screen 7 */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRequestClose}
                disabled={isSubmitting}
                iconLeading={<span className="material-symbols-outlined text-[18px]">cancel</span>}
              >
                {t('modal.footer.cancel')}
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={isSubmitting}
                  onClick={submitWithTargetStatus('draft')}
                  iconLeading={<span className="material-symbols-outlined text-[18px]">save_as</span>}
                >
                  {t('modal.footer.saveDraft')}
                </Button>

                {isEdit && watchedStatus === 'archived' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={isSubmitting}
                    onClick={submitWithTargetStatus('archived')}
                    iconLeading={<span className="material-symbols-outlined text-[18px]">save</span>}
                  >
                    {t('modal.footer.saveChanges')}
                  </Button>
                )}

                <Button
                  type="submit"
                  form="owner-project-form"
                  variant="primary-gradient"
                  size="sm"
                  loading={isSubmitting}
                  iconLeading={
                    <span className="material-symbols-outlined material-symbols-filled text-[19px]">
                      rocket_launch
                    </span>
                  }
                >
                  {t('modal.footer.saveAndPublish')}
                </Button>
              </div>
            </div>
          </div>
        ) : null
      }
    >
      {isEdit && isLoadingProject ? (
        <div className="space-y-5 py-4" aria-busy="true">
          <p className="text-sm text-on-surface-variant">{t('modal.loadingDetails')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : isEdit && isLoadError ? (
        <ErrorState
          title={t('modal.loadError')}
          message={getApiErrorMessage(loadError)}
          onRetry={() => refetchProject()}
        />
      ) : (
        <form
          id="owner-project-form"
          onSubmit={submitWithTargetStatus('published')}
          noValidate
          className="flex flex-col gap-6"
        >
          {/* SECTION 1: BASICS */}
          {showSection('basics') && (
            <section className="space-y-5">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                <h3 className="text-sm font-semibold text-on-surface">
                  {t('modal.basics.heading')}
                </h3>
              </div>

              {/* Row 1: Titles (AR & EN) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  id="proj-title-ar"
                  label={t('modal.basics.titleArLabel')}
                  required
                  error={errors.title?.ar?.message}
                >
                  <Input
                    autoFocus={!isEdit}
                    placeholder={t('modal.basics.titleArPlaceholder')}
                    {...register('title.ar')}
                  />
                </FormField>

                <FormField
                  id="proj-title-en"
                  label={t('modal.basics.titleEnLabel')}
                  required
                  error={errors.title?.en?.message}
                >
                  <Input
                    dir="ltr"
                    className="text-start"
                    placeholder={t('modal.basics.titleEnPlaceholder')}
                    {...register('title.en')}
                  />
                </FormField>
              </div>

              {/* Row 2: Category & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  id="proj-category"
                  label={t('modal.basics.categoryLabel')}
                  required
                  error={errors.category?.message}
                >
                  <Select {...register('category')}>
                    <option value="">{t('modal.basics.categoryPlaceholder')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {localized(cat.name, lang)} ({cat.key})
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField
                  id="proj-slug"
                  label={t('modal.basics.slugLabel')}
                  hint={t('modal.basics.slugHint')}
                  error={errors.slug?.message}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <Input
                        id="proj-slug"
                        dir="ltr"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="font-mono text-start"
                        placeholder={t('modal.basics.slugPlaceholder')}
                        {...slugRegister}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        slugManuallyEditedRef.current = false;
                        setValue('slug', suggestProjectSlug(watchedTitleEn), {
                          shouldDirty: true,
                        });
                      }}
                      className="shrink-0 px-3"
                      title={t('modal.basics.autoSuggestSlug')}
                      iconLeading={
                        <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                      }
                    >
                      <span className="hidden sm:inline">{t('modal.basics.autoSuggestSlug')}</span>
                    </Button>
                  </div>
                </FormField>
              </div>

              {/* Row 3: Taglines (AR & EN) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  id="proj-tagline-ar"
                  label={t('modal.basics.taglineArLabel')}
                  required
                  error={errors.tagline?.ar?.message}
                >
                  <Input
                    placeholder={t('modal.basics.taglineArPlaceholder')}
                    {...register('tagline.ar')}
                  />
                </FormField>

                <FormField
                  id="proj-tagline-en"
                  label={t('modal.basics.taglineEnLabel')}
                  required
                  error={errors.tagline?.en?.message}
                >
                  <Input
                    dir="ltr"
                    className="text-start"
                    placeholder={t('modal.basics.taglineEnPlaceholder')}
                    {...register('tagline.en')}
                  />
                </FormField>
              </div>

              {/* Row 4: Descriptions (AR & EN) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  id="proj-desc-ar"
                  label={t('modal.basics.descriptionArLabel')}
                  required
                  error={errors.description?.ar?.message}
                >
                  <Textarea
                    rows={3}
                    className="!min-h-[120px]"
                    placeholder={t('modal.basics.descriptionArPlaceholder')}
                    {...register('description.ar')}
                  />
                </FormField>

                <FormField
                  id="proj-desc-en"
                  label={t('modal.basics.descriptionEnLabel')}
                  required
                  error={errors.description?.en?.message}
                >
                  <Textarea
                    rows={3}
                    dir="ltr"
                    className="!min-h-[120px] text-start"
                    placeholder={t('modal.basics.descriptionEnPlaceholder')}
                    {...register('description.en')}
                  />
                </FormField>
              </div>

              {/* Row 5: Status, Sort Order, Featured, Publish Immediately Switch Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  id="proj-status"
                  label={t('modal.basics.statusLabel')}
                  error={errors.status?.message}
                >
                  <Select {...register('status')}>
                    <option value="draft">{t('status.draft')}</option>
                    <option value="published">{t('status.published')}</option>
                    <option value="archived">{t('status.archived')}</option>
                  </Select>
                </FormField>

                <FormField
                  id="proj-sort"
                  label={t('modal.basics.sortOrderLabel')}
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

                <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/60 flex items-center">
                  <Controller
                    name="isFeatured"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="proj-featured"
                        label={t('modal.basics.featuredLabel')}
                        description={t('modal.basics.featuredDescription')}
                        checked={Boolean(field.value)}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-full"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Screen 7 Publish Switch Row */}
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[22px]">visibility</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-on-surface">
                      {t('modal.basics.publishToggleTitle')}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {t('modal.basics.publishToggleDescription')}
                    </p>
                  </div>
                </div>
                <Switch
                  id="proj-publish-toggle"
                  checked={watchedStatus === 'published'}
                  onChange={(e) =>
                    setValue('status', e.target.checked ? 'published' : 'draft', {
                      shouldDirty: true,
                    })
                  }
                  aria-label={t('modal.basics.publishToggleTitle')}
                />
              </div>
            </section>
          )}

          {/* SECTION 2: MEDIA (Thumbnail + Gallery) */}
          {showSection('media') && (
            <div className={clsx(activeSection === 'all' && 'pt-4 border-t border-outline-variant/60')}>
              <ProjectMediaSection
                thumbnail={watchedThumbnail}
                gallery={watchedGallery || []}
                errorMessage={errors.thumbnail?.message}
                onChangeMedia={({ thumbnail, gallery }) => {
                  setValue('thumbnail', thumbnail, { shouldDirty: true, shouldValidate: true });
                  setValue('gallery', gallery, { shouldDirty: true, shouldValidate: true });
                }}
              />
            </div>
          )}

          {/* SECTION 3: TECH STACK & FEATURES */}
          {showSection('techFeatures') && (
            <section
              className={clsx(
                'space-y-5',
                activeSection === 'all' && 'pt-4 border-t border-outline-variant/60'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <span>{t('modal.techFeatures.techLabel')}</span>
                  <span className="text-primary font-bold" aria-hidden="true">
                    *
                  </span>
                </h3>
                <span className="text-xs font-mono text-on-surface-variant">
                  {t('modal.techFeatures.techCount', {
                    count: formatNumber((watchedTechStack || []).length),
                  })}
                </span>
              </div>

              <FormField
                id="proj-tech-stack"
                hint={t('modal.techFeatures.techHint')}
                error={errors.techStack?.message}
              >
                <Controller
                  name="techStack"
                  control={control}
                  render={({ field }) => (
                    <TagInput
                      id="proj-tech-stack"
                      value={field.value || []}
                      onChange={field.onChange}
                      error={Boolean(errors.techStack)}
                      aria-label={t('modal.techFeatures.techHeading')}
                      aria-describedby={errors.techStack ? 'proj-tech-stack-error' : 'proj-tech-stack-hint'}
                      placeholder={t('modal.techFeatures.techPlaceholder')}
                    />
                  )}
                />
              </FormField>

              {/* Repeatable Project Features */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h4 className="text-sm font-semibold text-on-surface">
                    {t('modal.techFeatures.featuresHeading')}
                  </h4>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => appendFeature({ ar: '', en: '' })}
                    iconLeading={<span className="material-symbols-outlined text-[18px]">add</span>}
                  >
                    {t('modal.techFeatures.addFeature')}
                  </Button>
                </div>

                {featureFields.length === 0 ? (
                  <p className="text-xs text-on-surface-variant p-4 rounded-xl bg-surface-container border border-dashed border-outline-variant text-center">
                    {t('modal.techFeatures.noFeaturesHint')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {featureFields.map((feat, idx) => {
                      const rowErr =
                        errors.features?.[idx]?.ar?.message || errors.features?.[idx]?.en?.message;
                      return (
                        <div
                          key={feat.id}
                          className="p-3 rounded-xl bg-surface-container border border-outline-variant/70 space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                            <div className="flex-1 min-w-0">
                              <Input
                                aria-label={`${t('modal.techFeatures.featureArPlaceholder')} #${idx + 1}`}
                                placeholder={t('modal.techFeatures.featureArPlaceholder')}
                                error={Boolean(errors.features?.[idx]?.ar)}
                                {...register(`features.${idx}.ar`)}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Input
                                dir="ltr"
                                className="text-start"
                                aria-label={`${t('modal.techFeatures.featureEnPlaceholder')} #${idx + 1}`}
                                placeholder={t('modal.techFeatures.featureEnPlaceholder')}
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
                                aria-label={t('modal.techFeatures.moveFeatureUp')}
                                onClick={() => swapFeature(idx, idx - 1)}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  arrow_upward
                                </span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                disabled={idx === featureFields.length - 1}
                                aria-label={t('modal.techFeatures.moveFeatureDown')}
                                onClick={() => swapFeature(idx, idx + 1)}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  arrow_downward
                                </span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t('modal.techFeatures.removeFeature')}
                                onClick={() => removeFeature(idx)}
                                className="text-error hover:bg-error/10"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  delete
                                </span>
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
            </section>
          )}

          {/* SECTION 4: PACKAGES */}
          {showSection('packages') && (
            <div className={clsx(activeSection === 'all' && 'pt-4 border-t border-outline-variant/60')}>
              <ProjectPackagesSection
                control={control}
                register={register}
                watch={watch}
                errors={errors}
              />
            </div>
          )}

          {/* SECTION 5: LIVE PREVIEW */}
          {showSection('preview') && (
            <section
              className={clsx(
                'space-y-4',
                activeSection === 'all' && 'pt-4 border-t border-outline-variant/60'
              )}
            >
              <h3 className="text-sm font-semibold text-on-surface">
                {t('modal.preview.heading')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  id="proj-preview-url"
                  label={t('modal.preview.urlLabel')}
                  error={errors.preview?.url?.message}
                >
                  <Input
                    type="url"
                    dir="ltr"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="text-start"
                    placeholder={t('modal.preview.urlPlaceholder')}
                    iconTrailing={
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    }
                    {...register('preview.url')}
                  />
                </FormField>

                <FormField
                  id="proj-preview-mode"
                  label={t('modal.preview.modeLabel')}
                  error={errors.preview?.mode?.message}
                >
                  <Select {...register('preview.mode')}>
                    <option value="iframe">{t('modal.preview.modeIframe')}</option>
                    <option value="external">{t('modal.preview.modeExternal')}</option>
                  </Select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  id="proj-demo-note-ar"
                  label={t('modal.preview.demoNoteArLabel')}
                  error={errors.preview?.demoNote?.ar?.message}
                >
                  <Input
                    placeholder={t('modal.preview.demoNoteArPlaceholder')}
                    {...register('preview.demoNote.ar')}
                  />
                </FormField>

                <FormField
                  id="proj-demo-note-en"
                  label={t('modal.preview.demoNoteEnLabel')}
                  error={errors.preview?.demoNote?.en?.message}
                >
                  <Input
                    dir="ltr"
                    className="text-start"
                    placeholder={t('modal.preview.demoNoteEnPlaceholder')}
                    {...register('preview.demoNote.en')}
                  />
                </FormField>
              </div>

              <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/70 space-y-4">
                <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  {t('modal.preview.credentialsHeading')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    id="proj-cred-label"
                    label={t('modal.preview.credLabel')}
                    error={errors.preview?.demoCredentials?.label?.message}
                  >
                    <Input
                      placeholder={t('modal.preview.credLabelPlaceholder')}
                      {...register('preview.demoCredentials.label')}
                    />
                  </FormField>
                  <FormField
                    id="proj-cred-email"
                    label={t('modal.preview.credEmail')}
                    error={errors.preview?.demoCredentials?.email?.message}
                  >
                    <Input
                      dir="ltr"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="text-start"
                      placeholder={t('modal.preview.credEmailPlaceholder')}
                      {...register('preview.demoCredentials.email')}
                    />
                  </FormField>
                  <FormField
                    id="proj-cred-pass"
                    label={t('modal.preview.credPassword')}
                    error={errors.preview?.demoCredentials?.password?.message}
                  >
                    <Input
                      dir="ltr"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="text-start font-mono"
                      placeholder={t('modal.preview.credPasswordPlaceholder')}
                      {...register('preview.demoCredentials.password')}
                    />
                  </FormField>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 6: PRIVATE DELIVERY REPO */}
          {showSection('repo') && (
            <section
              className={clsx(
                'space-y-4',
                activeSection === 'all' && 'pt-4 border-t border-outline-variant/60'
              )}
            >
              <h3 className="text-sm font-semibold text-on-surface">{t('modal.repo.heading')}</h3>

              {/* Explicit Private / Never Public Security Banner */}
              <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/25 flex items-start gap-3">
                <span className="material-symbols-outlined text-warning text-[20px] shrink-0 mt-0.5">
                  lock
                </span>
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold text-on-surface">
                    {t('modal.repo.securityBannerTitle')}
                  </div>
                  <p className="text-on-surface-variant leading-relaxed">
                    {t('modal.repo.securityBannerDescription')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  id="proj-repo-provider"
                  label={t('modal.repo.providerLabel')}
                  error={errors.privateRepo?.provider?.message}
                >
                  <Select {...register('privateRepo.provider')}>
                    <option value="github">{t('modal.repo.providers.github')}</option>
                    <option value="gitlab">{t('modal.repo.providers.gitlab')}</option>
                    <option value="other">{t('modal.repo.providers.other')}</option>
                  </Select>
                </FormField>

                <FormField
                  id="proj-repo-owner"
                  label={t('modal.repo.ownerLabel')}
                  error={errors.privateRepo?.owner?.message}
                >
                  <Input
                    dir="ltr"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="text-start font-mono"
                    placeholder={t('modal.repo.ownerPlaceholder')}
                    {...register('privateRepo.owner')}
                  />
                </FormField>

                <FormField
                  id="proj-repo-name"
                  label={t('modal.repo.nameLabel')}
                  error={errors.privateRepo?.name?.message}
                >
                  <Input
                    dir="ltr"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="text-start font-mono"
                    placeholder={t('modal.repo.namePlaceholder')}
                    {...register('privateRepo.name')}
                  />
                </FormField>
              </div>

              <FormField
                id="proj-repo-url"
                label={t('modal.repo.urlLabel')}
                error={errors.privateRepo?.url?.message}
              >
                <Input
                  dir="ltr"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="text-start font-mono"
                  placeholder={t('modal.repo.urlPlaceholder')}
                  iconTrailing={<span className="material-symbols-outlined text-[18px]">lock</span>}
                  {...register('privateRepo.url')}
                />
              </FormField>
            </section>
          )}
        </form>
      )}
    </ProjectNativeDialog>
  );
}
