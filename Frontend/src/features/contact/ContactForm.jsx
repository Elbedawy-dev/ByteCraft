import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  INQUIRY_BUDGET_RANGES,
  INQUIRY_PROJECT_TYPES,
  INQUIRY_TIMELINES,
  useCreateInquiry,
  usePrefillPlan,
  usePrefillProject,
} from '../../api/inquiries';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '../../api/client';
import { useLang, useToast } from '../../app/providers';
import { localized } from '../../lib/localized';
import { formatMoney } from '../../lib/money';
import { ROUTES } from '../../config/routes';
import {
  Button,
  FormField,
  HoneypotField,
  Input,
  RadioCard,
  Select,
  Skeleton,
  Textarea,
} from '../../components/ui';
import { AttachmentDropzone } from './AttachmentDropzone';

function normalizeProjectTypeParam(rawType) {
  if (!rawType) return '';
  const cleaned = String(rawType).trim().toLowerCase();
  const aliasMap = {
    lms: 'lms',
    educational: 'lms',
    education: 'lms',
    ecommerce: 'ecommerce',
    'e-commerce': 'ecommerce',
    store: 'ecommerce',
    custom_mern: 'custom_mern',
    'custom-mern': 'custom_mern',
    custom: 'custom_mern',
    consulting: 'consulting',
    audit: 'consulting',
    other: 'other',
  };
  return aliasMap[cleaned] || '';
}

function mapPlanGroupToProjectType(group) {
  const normalized = String(group || '').trim().toLowerCase();
  if (normalized === 'lms') return 'lms';
  if (normalized === 'ecommerce') return 'ecommerce';
  if (normalized === 'custom') return 'custom_mern';
  return 'other';
}

export function ContactForm() {
  const { t } = useTranslation('contact');
  const { lang } = useLang();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const planParam = searchParams.get('plan') || '';
  const projectParam = searchParams.get('project') || '';
  const typeParam = normalizeProjectTypeParam(searchParams.get('type'));

  const [linkedPlanId, setLinkedPlanId] = useState(planParam);
  const [linkedProjectSlug, setLinkedProjectSlug] = useState(projectParam);
  const [attachments, setAttachments] = useState([]);
  const [submittedInquiry, setSubmittedInquiry] = useState(null);
  const [serverAlert, setServerAlert] = useState(null);
  const hasAutoSelectedTypeRef = useRef(false);

  useEffect(() => {
    setLinkedPlanId(planParam);
  }, [planParam]);

  useEffect(() => {
    setLinkedProjectSlug(projectParam);
  }, [projectParam]);

  const { data: prefillPlan, isLoading: isPlanLoading } = usePrefillPlan(linkedPlanId);
  const { data: prefillProject, isLoading: isProjectLoading } = usePrefillProject(linkedProjectSlug);

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(2, t('form.errors.nameRequired'))
          .max(100, t('form.errors.nameMax')),
        phone: z
          .string()
          .trim()
          .min(6, t('form.errors.phoneRequired'))
          .max(30, t('form.errors.phoneMax')),
        email: z
          .string()
          .trim()
          .email(t('form.errors.emailRequired')),
        projectType: z.enum(INQUIRY_PROJECT_TYPES, {
          errorMap: () => ({ message: t('form.errors.projectTypeRequired') }),
        }),
        budgetRange: z.enum(INQUIRY_BUDGET_RANGES).default('undecided'),
        timeline: z.enum(INQUIRY_TIMELINES).default('standard'),
        message: z
          .string()
          .trim()
          .min(10, t('form.errors.messageMin'))
          .max(5000, t('form.errors.messageMax')),
        website: z.string().optional().default(''),
      }),
    [t]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      projectType: typeParam || '',
      budgetRange: 'undecided',
      timeline: 'standard',
      message: '',
      website: '',
    },
  });

  // Prefill projectType from ?type= or resolved ?plan=
  useEffect(() => {
    if (dirtyFields.projectType) return;

    if (typeParam) {
      setValue('projectType', typeParam, { shouldValidate: false });
      hasAutoSelectedTypeRef.current = true;
      return;
    }

    if (prefillPlan && !hasAutoSelectedTypeRef.current) {
      setValue('projectType', mapPlanGroupToProjectType(prefillPlan.group), {
        shouldValidate: false,
      });
      hasAutoSelectedTypeRef.current = true;
    }
  }, [typeParam, prefillPlan, dirtyFields.projectType, setValue]);

  const createInquiryMutation = useCreateInquiry();

  const clearPrefill = (key) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    setSearchParams(next, { replace: true });
    if (key === 'plan') setLinkedPlanId('');
    if (key === 'project') setLinkedProjectSlug('');
  };

  const onSubmit = async (values) => {
    setServerAlert(null);

    try {
      const inquiry = await createInquiryMutation.mutateAsync({
        payload: {
          ...values,
          locale: lang,
          projectSlug: linkedProjectSlug || undefined,
          servicePlanId: linkedPlanId || undefined,
        },
        files: attachments,
      });

      setSubmittedInquiry(inquiry || { name: values.name, email: values.email });
      setAttachments([]);
      toast.success(t('form.success.title'));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isRateLimited) {
          setServerAlert({
            type: 'rate-limit',
            message: t('form.errors.rateLimited'),
          });
          toast.error(t('form.errors.rateLimited'));
          return;
        }

        const mapped = applyApiErrorsToForm(err, setError);
        const msg = getApiErrorMessage(err, t);
        if (!mapped) {
          setServerAlert({ type: 'error', message: msg });
        }
        toast.error(msg);
        return;
      }

      const fallbackMsg = getApiErrorMessage(err, t);
      setServerAlert({ type: 'error', message: fallbackMsg });
      toast.error(fallbackMsg);
    }
  };

  const handleResetSuccess = () => {
    setSubmittedInquiry(null);
    setServerAlert(null);
    setAttachments([]);
    reset({
      name: '',
      phone: '',
      email: '',
      projectType: typeParam || '',
      budgetRange: 'undecided',
      timeline: 'standard',
      message: '',
      website: '',
    });
  };

  const nextSteps = t('form.success.nextSteps', { returnObjects: true });

  return (
    <section
      aria-labelledby="contact-form-heading"
      className="lg:col-span-7 bg-card border border-card-border shadow-card rounded-2xl p-6 sm:p-8 order-1 lg:order-2 space-y-6"
    >
      {/* Card Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="px-3.5 py-1 rounded-full bg-brand-soft text-brand-soft-text text-xs font-semibold">
            {t('form.eyebrow')}
          </span>
          <span className="text-xs font-medium text-muted bg-section-band border border-card-border px-3 py-1 rounded-full">
            {t('form.responseBadge')}
          </span>
        </div>

        <h2
          id="contact-form-heading"
          className="text-xl sm:text-2xl font-extrabold text-on-surface"
        >
          {t('form.title')}
        </h2>
        <p className="text-sm sm:text-base text-muted leading-relaxed">
          {t('form.subtitle')}
        </p>
      </div>

      {/* Prefill Context Banners */}
      {(linkedPlanId || linkedProjectSlug) && !submittedInquiry && (
        <div className="space-y-2.5">
          {linkedPlanId && (
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-between gap-3">
              {isPlanLoading ? (
                <Skeleton className="h-5 w-60" />
              ) : prefillPlan ? (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-primary">
                    {t('form.prefill.planLabel')}{' '}
                    <span className="text-on-surface">{localized(prefillPlan.name, lang)}</span>
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {t('form.prefill.planMeta', {
                      days: prefillPlan.deliveryDays,
                      price: formatMoney(prefillPlan.startingPrice, lang),
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant font-mono truncate">
                  {t('form.prefill.planLabel')} <bdi dir="ltr">{linkedPlanId}</bdi>
                </p>
              )}

              <button
                type="button"
                onClick={() => clearPrefill('plan')}
                className="text-xs font-medium text-on-surface-variant hover:text-error px-2 py-1 rounded-lg hover:bg-surface-container transition-colors shrink-0"
              >
                {t('form.prefill.clear')}
              </button>
            </div>
          )}

          {linkedProjectSlug && (
            <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/80 flex items-center justify-between gap-3">
              {isProjectLoading ? (
                <Skeleton className="h-5 w-52" />
              ) : (
                <p className="text-xs font-semibold text-primary truncate">
                  {t('form.prefill.projectLabel')}{' '}
                  <span className="text-on-surface">
                    {prefillProject
                      ? localized(prefillProject.title, lang)
                      : linkedProjectSlug}
                  </span>
                </p>
              )}

              <button
                type="button"
                onClick={() => clearPrefill('project')}
                className="text-xs font-medium text-on-surface-variant hover:text-error px-2 py-1 rounded-lg hover:bg-surface-container-high transition-colors shrink-0"
              >
                {t('form.prefill.clear')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {submittedInquiry ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl bg-surface-container border border-primary/35 p-6 space-y-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">task_alt</span>
            </div>
            <div className="space-y-1">
              <span className="inline-block text-xs font-semibold text-primary">
                {t('form.success.badge')}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-on-surface">
                {t('form.success.title')}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {t('form.success.message', { name: submittedInquiry.name })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant/70 text-xs sm:text-sm">
            {submittedInquiry.subject && (
              <div>
                <span className="text-on-surface-variant block">
                  {t('form.success.subjectLabel')}
                </span>
                <span className="font-semibold text-on-surface mt-0.5 block">
                  {submittedInquiry.subject}
                </span>
              </div>
            )}
            <div>
              <span className="text-on-surface-variant block">
                {t('form.success.emailLabel')}
              </span>
              <span className="font-mono font-semibold text-primary mt-0.5 block truncate">
                <bdi dir="ltr">{submittedInquiry.email}</bdi>
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-sm font-bold text-on-surface">
              {t('form.success.nextStepsTitle')}
            </h4>
            <ol className="space-y-2 text-xs sm:text-sm text-on-surface-variant">
              {Array.isArray(nextSteps) &&
                nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="button" variant="primary-gradient" onClick={handleResetSuccess}>
              {t('form.success.sendAnother')}
            </Button>
            <Button to={ROUTES.PROJECTS} variant="outline">
                {t('form.success.browseProjects')}
              </Button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-labelledby="contact-form-heading"
          className="space-y-5"
        >
          <HoneypotField register={register} />

          {/* Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              id="contact-name"
              label={t('form.fields.name.label')}
              required
              error={errors.name?.message}
            >
              <Input
                {...register('name')}
                autoComplete="name"
                enterKeyHint="next"
                placeholder={t('form.fields.name.placeholder')}
                iconLeading={
                  <span className="material-symbols-outlined text-[20px]">person</span>
                }
              />
            </FormField>

            <FormField
              id="contact-phone"
              label={t('form.fields.phone.label')}
              required
              error={errors.phone?.message}
            >
              <Input
                {...register('phone')}
                type="tel"
                dir="ltr"
                autoComplete="tel"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="next"
                placeholder={t('form.fields.phone.placeholder')}
                iconLeading={
                  <span className="material-symbols-outlined text-[20px]">call</span>
                }
              />
            </FormField>
          </div>

          {/* Email */}
          <FormField
            id="contact-email"
            label={t('form.fields.email.label')}
            required
            error={errors.email?.message}
          >
            <Input
              {...register('email')}
              type="email"
              dir="ltr"
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              placeholder={t('form.fields.email.placeholder')}
              iconLeading={
                <span className="material-symbols-outlined text-[20px]">
                  alternate_email
                </span>
              }
            />
          </FormField>

          {/* Project Type & Budget Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              id="contact-project-type"
              label={t('form.fields.projectType.label')}
              required
              error={errors.projectType?.message}
            >
              <Select
                {...register('projectType')}
                iconLeading={
                  <span className="material-symbols-outlined text-[20px]">layers</span>
                }
              >
                <option value="">{t('form.fields.projectType.placeholder')}</option>
                {INQUIRY_PROJECT_TYPES.map((typeKey) => (
                  <option key={typeKey} value={typeKey}>
                    {t(`form.fields.projectType.options.${typeKey}`)}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              id="contact-budget-range"
              label={t('form.fields.budgetRange.label')}
              error={errors.budgetRange?.message}
            >
              <Select
                {...register('budgetRange')}
                iconLeading={
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                }
              >
                {INQUIRY_BUDGET_RANGES.map((rangeKey) => (
                  <option key={rangeKey} value={rangeKey}>
                    {t(`form.fields.budgetRange.options.${rangeKey}`)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* Timeline Radio Cards */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-on-surface flex items-center gap-1.5 select-none">
              <span className="material-symbols-outlined text-primary text-[18px]">
                schedule
              </span>
              <span>{t('form.fields.timeline.label')}</span>
            </legend>

            <Controller
              name="timeline"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {INQUIRY_TIMELINES.map((timelineKey) => (
                    <RadioCard
                      key={timelineKey}
                      name="timeline"
                      value={timelineKey}
                      checked={field.value === timelineKey}
                      onChange={() => field.onChange(timelineKey)}
                      header={t(`form.fields.timeline.options.${timelineKey}.label`)}
                      description={t(
                        `form.fields.timeline.options.${timelineKey}.description`
                      )}
                      className="p-3.5 sm:p-4"
                    />
                  ))}
                </div>
              )}
            />
          </fieldset>

          {/* Details Textarea */}
          <FormField
            id="contact-message"
            label={t('form.fields.message.label')}
            required
            error={errors.message?.message}
            hint={t('form.fields.message.hint')}
          >
            <Textarea
              {...register('message')}
              rows={5}
              placeholder={t('form.fields.message.placeholder')}
            />
          </FormField>

          {/* Optional File Attachments Dropzone */}
          <AttachmentDropzone
            files={attachments}
            onChange={setAttachments}
            disabled={createInquiryMutation.isPending}
          />

          {/* Server / 429 Error Banner */}
          {serverAlert && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm flex items-start gap-2.5"
            >
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                {serverAlert.type === 'rate-limit' ? 'hourglass_top' : 'error'}
              </span>
              <span className="leading-relaxed">{serverAlert.message}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-1 space-y-3">
            <Button
              type="submit"
              variant="primary-gradient"
              size="lg"
              loading={createInquiryMutation.isPending}
              className="w-full"
              iconTrailing={
                <span className="material-symbols-rounded text-[20px] rtl:-scale-x-100" aria-hidden="true">
                  arrow_forward
                </span>
              }
            >
              {createInquiryMutation.isPending
                ? t('form.submitting')
                : t('form.submit')}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted text-center">
              <span className="material-symbols-rounded icon-gradient text-[18px] shrink-0" aria-hidden="true">
                lock
              </span>
              <span>{t('form.securityNote')}</span>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
