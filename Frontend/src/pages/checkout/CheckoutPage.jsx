import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Skeleton } from '@/components/ui';
import { Breadcrumbs, EmptyState, ErrorState } from '@/components/shared';
import { useLang, useToast } from '@/app/providers';
import { useMeta } from '@/api/meta';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '@/api/client';
import { useCheckoutProject, useCreateOrder, useValidateCoupon } from '@/api/checkout';
import { ROUTES, orderTrackingPath, projectDetailsPath } from '@/config/routes';
import { localized } from '@/lib/localized';
import { formatMoney } from '@/lib/money';
import { setOrderToken } from '@/lib/storage';
import {
  CHECKOUT_FIELD_MAP,
  PAYMENT_METHOD_ORDER,
  createCheckoutSchema,
  getCouponErrorMessage,
} from '@/features/checkout/checkoutSchema';
import { CustomerInfoSection } from '@/features/checkout/CustomerInfoSection';
import { PaymentMethodSection } from '@/features/checkout/PaymentMethodSection';
import { OrderSummaryContent } from '@/features/checkout/OrderSummaryContent';
import { TrustBadges } from '@/features/checkout/TrustBadges';
import { CheckoutSkeleton } from '@/features/checkout/CheckoutSkeleton';

const COUPON_ERROR_CODES = new Set([
  'INVALID_COUPON',
  'COUPON_INACTIVE',
  'COUPON_EXPIRED',
  'COUPON_MAX_USES_REACHED',
  'COUPON_NOT_APPLICABLE',
]);

// Ambient glow kept clipped within container so mobile widths (360px/375px) never overflow
function AmbientGlow() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none -z-10"
      aria-hidden="true"
    >
      <div className="absolute -top-12 end-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 start-4 w-72 h-72 bg-secondary-container/10 rounded-full blur-3xl" />
    </div>
  );
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const projectSlug = (searchParams.get('project') || '').trim();
  const packageKey = (searchParams.get('package') || '').trim().toLowerCase();

  const navigate = useNavigate();
  const { t } = useTranslation(['checkout', 'common']);
  const { lang } = useLang();
  const toast = useToast();

  const { data: meta, isLoading: isMetaLoading } = useMeta();
  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
    error: projectError,
    refetch: refetchProject,
  } = useCheckoutProject(projectSlug);

  const validateCouponMutation = useValidateCoupon();
  const createOrderMutation = useCreateOrder();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedPricing, setAppliedPricing] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [submitBannerError, setSubmitBannerError] = useState('');
  const [isRedirectingPayment, setIsRedirectingPayment] = useState(false);

  const submittingRef = useRef(false);

  const schema = useMemo(() => createCheckoutSchema(t), [t]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      gitProvider: 'github',
      gitUsername: '',
      organization: '',
      paymentMethod: '',
      website: '',
    },
  });

  const selectedPaymentMethod = watch('paymentMethod');
  const selectedGitProvider = watch('gitProvider');

  const selectedPackage = useMemo(() => {
    if (!project || !Array.isArray(project.packages) || !packageKey) return null;
    return (
      project.packages.find(
        (pkg) => pkg.key?.toLowerCase() === packageKey && pkg.isActive !== false
      ) || null
    );
  }, [project, packageKey]);

  const enabledPaymentMethods = useMemo(
    () =>
      PAYMENT_METHOD_ORDER.filter((key) => Boolean(meta?.paymentMethods?.[key]?.enabled)),
    [meta?.paymentMethods]
  );

  // Set page document title
  useEffect(() => {
    const brandName = t('common:brand.name');
    const pageTitle = t('common:titles.checkout');
    const projectTitle = project ? localized(project.title, lang) : '';
    document.title = projectTitle
      ? `${pageTitle} — ${projectTitle} | ${brandName}`
      : `${pageTitle} | ${brandName}`;
  }, [t, project, lang]);

  // Reset coupon & banner errors if URL target project/package changes
  useEffect(() => {
    setCouponCodeInput('');
    setAppliedPricing(null);
    setCouponError('');
    setSubmitBannerError('');
  }, [projectSlug, packageKey]);

  const effectivePricing = useMemo(() => {
    if (appliedPricing) return appliedPricing;
    return {
      currency: 'EGP',
      subtotal: selectedPackage?.price ?? 0,
      couponCode: null,
      discount: 0,
      total: selectedPackage?.price ?? 0,
    };
  }, [appliedPricing, selectedPackage]);

  const isFreeOrder = Boolean(selectedPackage) && effectivePricing.total === 0;

  // Auto-select first enabled payment method (or fallback enum on 100% free orders)
  useEffect(() => {
    if (enabledPaymentMethods.length > 0) {
      if (!selectedPaymentMethod || !enabledPaymentMethods.includes(selectedPaymentMethod)) {
        setValue('paymentMethod', enabledPaymentMethods[0], { shouldValidate: false });
      }
    } else if (isFreeOrder && !selectedPaymentMethod) {
      setValue('paymentMethod', 'vodafone_cash', { shouldValidate: false });
    }
  }, [enabledPaymentMethods, selectedPaymentMethod, isFreeOrder, setValue]);

  const guaranteeDays = meta?.guaranteeDays ?? 30;
  const isSubmitting =
    submittingRef.current || createOrderMutation.isPending || isRedirectingPayment;

  const formattedTotal = useMemo(() => {
    if (effectivePricing.total === 0) return t('checkout:summary.freeValue');
    return formatMoney(effectivePricing.total, lang);
  }, [effectivePricing.total, lang, t]);

  const handleCouponInputChange = (value) => {
    setCouponCodeInput(value);
    if (couponError) setCouponError('');
  };

  const handleApplyCoupon = async () => {
    const trimmed = couponCodeInput.trim();
    if (!trimmed) {
      setCouponError(t('checkout:coupon.emptyError'));
      return;
    }
    if (!projectSlug || !selectedPackage) return;

    setCouponError('');
    try {
      const pricing = await validateCouponMutation.mutateAsync({
        code: trimmed.toUpperCase(),
        projectSlug,
        packageKey: selectedPackage.key,
      });
      setAppliedPricing(pricing);
      setCouponCodeInput(pricing.couponCode || trimmed.toUpperCase());
      toast.success(t('checkout:coupon.appliedSuccess', { code: pricing.couponCode || trimmed.toUpperCase() }));
    } catch (err) {
      setAppliedPricing(null);
      const msg = getCouponErrorMessage(err, t);
      setCouponError(msg);
      toast.error(msg);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedPricing(null);
    setCouponCodeInput('');
    setCouponError('');
  };

  const onSubmit = async (values) => {
    if (submittingRef.current || !selectedPackage) return;
    if (!isFreeOrder && enabledPaymentMethods.length === 0) {
      toast.error(t('checkout:payment.noMethodsTitle'));
      return;
    }

    submittingRef.current = true;
    setSubmitBannerError('');

    const payload = {
      projectSlug,
      packageKey: selectedPackage.key,
      paymentMethod: values.paymentMethod,
      locale: lang === 'en' ? 'en' : 'ar',
      customer: {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        gitProvider: values.gitProvider,
        gitUsername: values.gitUsername.trim().replace(/^@+/, ''),
        organization: values.organization ? values.organization.trim() : '',
      },
      ...(appliedPricing?.couponCode ? { couponCode: appliedPricing.couponCode } : {}),
      website: values.website || '',
    };

    try {
      const order = await createOrderMutation.mutateAsync(payload);

      // Persist one-time guest access token per contract section 6
      if (order?.orderNumber && order?.publicToken) {
        setOrderToken(order.orderNumber, order.publicToken);
      }

      if (order?.isFreeOrder) {
        navigate(orderTrackingPath(order.orderNumber), {
          replace: true,
          state: { order },
        });
        return;
      }

      if (order?.paymentMethod === 'card' && order?.paymentUrl) {
        setIsRedirectingPayment(true);
        window.location.assign(order.paymentUrl);
        return;
      }

      // Manual (vodafone_cash / instapay) and Fawry navigate to tracking with router state fallback
      navigate(orderTrackingPath(order.orderNumber), {
        replace: true,
        state: { order },
      });
    } catch (err) {
      submittingRef.current = false;
      setIsRedirectingPayment(false);

      if (err instanceof ApiError) {
        // Map server validation errors to fields if present
        const mappedFields = applyApiErrorsToForm(err, setError, {
          fieldMap: CHECKOUT_FIELD_MAP,
        });

        // Coupon state invalidated concurrently before submit
        if (COUPON_ERROR_CODES.has(err.code)) {
          setAppliedPricing(null);
          const couponMsg = getCouponErrorMessage(err, t);
          setCouponError(couponMsg);
          setSubmitBannerError(couponMsg);
          toast.error(couponMsg);
          return;
        }

        if (err.code === 'PAYMENT_FAILED') {
          const paymentMsg = t('checkout:errors.paymentFailed');
          setSubmitBannerError(paymentMsg);
          toast.error(paymentMsg);
          return;
        }

        const friendlyMsg =
          err.status === 429
            ? t('common:errors.rateLimited')
            : getApiErrorMessage(err, t) || t('checkout:errors.submitFailedGeneric');

        setSubmitBannerError(friendlyMsg);
        toast.error(
          mappedFields ? t('common:errors.validationFailed') : friendlyMsg
        );
        return;
      }

      const fallbackMsg = t('checkout:errors.submitFailedGeneric');
      setSubmitBannerError(fallbackMsg);
      toast.error(fallbackMsg);
    }
  };

  // 1. Missing query parameters (?project=...&package=...)
  if (!projectSlug || !packageKey) {
    return (
      <div className="relative w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin py-10 sm:py-16">
        <AmbientGlow />
        <Breadcrumbs
          className="mb-8"
          items={[
            { label: t('common:nav.home'), href: ROUTES.HOME },
            { label: t('common:nav.projects'), href: ROUTES.PROJECTS },
            { label: t('checkout:breadcrumbs.current') },
          ]}
        />
        <EmptyState
          icon="shopping_cart_off"
          title={t('checkout:errors.missingParamsTitle')}
          description={t('checkout:errors.missingParamsDescription')}
          action={
            <Link to={ROUTES.PROJECTS}>
              <Button variant="primary-gradient">{t('checkout:errors.browseProjects')}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // 2. Loading Project
  if (isProjectLoading) {
    return (
      <div className="relative w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin pt-6 pb-16">
        <AmbientGlow />
        <div className="mb-6">
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="space-y-3 mb-8">
          <Skeleton className="h-7 w-60 rounded-full" />
          <Skeleton className="h-10 w-96 max-w-full" />
          <Skeleton className="h-5 w-[32rem] max-w-full" />
        </div>
        <CheckoutSkeleton />
      </div>
    );
  }

  // 3. Project Load Error or 404
  if (isProjectError || !project) {
    const isNotFound =
      !project ||
      (projectError instanceof ApiError &&
        (projectError.status === 404 || projectError.code === 'NOT_FOUND'));

    return (
      <div className="relative w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin py-10 sm:py-16">
        <AmbientGlow />
        <Breadcrumbs
          className="mb-8"
          items={[
            { label: t('common:nav.home'), href: ROUTES.HOME },
            { label: t('common:nav.projects'), href: ROUTES.PROJECTS },
            { label: t('checkout:breadcrumbs.current') },
          ]}
        />
        {isNotFound ? (
          <EmptyState
            icon="search_off"
            title={t('checkout:errors.projectNotFoundTitle')}
            description={t('checkout:errors.projectNotFoundDescription')}
            action={
              <Link to={ROUTES.PROJECTS}>
                <Button variant="primary-gradient">{t('checkout:errors.browseProjects')}</Button>
              </Link>
            }
          />
        ) : (
          <ErrorState
            title={t('checkout:errors.loadFailedTitle')}
            message={getApiErrorMessage(projectError, t) || t('checkout:errors.loadFailedDescription')}
            onRetry={() => refetchProject()}
          />
        )}
      </div>
    );
  }

  // 4. Invalid or Inactive Package
  if (!selectedPackage) {
    return (
      <div className="relative w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin py-10 sm:py-16">
        <AmbientGlow />
        <Breadcrumbs
          className="mb-8"
          items={[
            { label: t('common:nav.home'), href: ROUTES.HOME },
            { label: t('common:nav.projects'), href: ROUTES.PROJECTS },
            { label: localized(project.title, lang), href: projectDetailsPath(project.slug) },
            { label: t('checkout:breadcrumbs.current') },
          ]}
        />
        <EmptyState
          icon="inventory_2"
          title={t('checkout:errors.invalidPackageTitle')}
          description={t('checkout:errors.invalidPackageDescription')}
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to={projectDetailsPath(project.slug)}>
                <Button variant="primary-gradient">{t('checkout:errors.viewProject')}</Button>
              </Link>
              <Link to={ROUTES.PROJECTS}>
                <Button variant="outline">{t('checkout:errors.browseProjects')}</Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const projectTitle = localized(project.title, lang);
  const licenseBadge = t(
    `checkout:summary.licenseBadges.${selectedPackage.licenseType === 'multi' ? 'multi' : 'single'}`
  );
  const submitDisabled = isSubmitting || (!isFreeOrder && enabledPaymentMethods.length === 0);
  const submitLabel = isRedirectingPayment
    ? t('checkout:actions.redirectingPayment')
    : isSubmitting
      ? t('checkout:actions.submitting')
      : isFreeOrder
        ? t('checkout:actions.submitFree', { total: formattedTotal })
        : t('checkout:actions.submitWithTotal', { total: formattedTotal });

  return (
    <div className="relative w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin pt-6 pb-28 lg:pb-16">
      <AmbientGlow />

      {/* Breadcrumbs */}
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: t('common:nav.home'), href: ROUTES.HOME },
          { label: t('common:nav.projects'), href: ROUTES.PROJECTS },
          { label: projectTitle, href: projectDetailsPath(project.slug) },
          { label: t('checkout:breadcrumbs.current') },
        ]}
      />

      {/* Page Header */}
      <header className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/60 text-primary text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" aria-hidden="true" />
          <span>{t('checkout:badge')}</span>
        </div>

        <h1 className="font-headline-xl-mobile sm:font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface font-extrabold tracking-tight">
          {t('checkout:title')}
        </h1>

        <p className="font-body-md sm:font-body-lg text-body-md sm:text-body-lg text-on-surface-variant max-w-2xl">
          {t('checkout:subtitle')}
        </p>
      </header>

      {/* Mobile Collapsible Order Summary (Top of 1-column mobile flow) */}
      <div className="lg:hidden mb-6">
        <details className="bc-accordion-item group bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none min-h-[56px] hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0" aria-hidden="true">
                shopping_bag
              </span>
              <span className="text-sm font-bold text-on-surface truncate">
                {t('checkout:summary.mobileToggle')}
              </span>
              <span className="text-xs text-primary font-medium group-open:hidden">
                ({t('checkout:summary.mobileShow')})
              </span>
              <span className="text-xs text-on-surface-variant font-medium hidden group-open:inline">
                ({t('checkout:summary.mobileHide')})
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-base font-extrabold text-primary">{formattedTotal}</span>
              <span
                className="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              >
                expand_more
              </span>
            </div>
          </summary>

          <div className="p-4 pt-2 border-t border-outline-variant/60">
            <OrderSummaryContent
              idPrefix="mobile"
              project={project}
              selectedPackage={selectedPackage}
              pricing={effectivePricing}
              couponCodeInput={couponCodeInput}
              onCouponInputChange={handleCouponInputChange}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              isApplyingCoupon={validateCouponMutation.isPending}
              couponError={couponError}
              appliedPricing={appliedPricing}
              contactMeta={meta?.contact}
            />
          </div>
        </details>
      </div>

      {/* Main Two-Column Desktop / Single-Column Mobile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form + Payment Column (7 cols on desktop, mirrored automatically in RTL) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <form
            id="checkout-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-6"
          >
            <CustomerInfoSection
              register={register}
              errors={errors}
              watch={watch}
              disabled={isSubmitting}
            />

            <PaymentMethodSection
              paymentMethodsMeta={meta?.paymentMethods}
              isMetaLoading={isMetaLoading}
              selectedMethod={selectedPaymentMethod}
              onSelectMethod={(method) =>
                setValue('paymentMethod', method, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              error={errors.paymentMethod?.message}
              isFreeOrder={isFreeOrder}
              gitProvider={selectedGitProvider}
              supportDays={selectedPackage.supportDays ?? 30}
              projectSlug={project.slug}
              disabled={isSubmitting}
            />

            {submitBannerError && (
              <div
                role="alert"
                className="p-4 rounded-xl border border-error/40 bg-error/10 text-sm text-on-surface flex items-start gap-3"
              >
                <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5" aria-hidden="true">
                  error
                </span>
                <span>{submitBannerError}</span>
              </div>
            )}

            {/* Desktop Primary Submit CTA */}
            <div className="hidden lg:flex flex-col gap-4">
              <Button
                type="submit"
                variant="primary-gradient"
                size="lg"
                loading={isSubmitting}
                disabled={submitDisabled}
                className="w-full h-14 text-base font-bold"
                iconTrailing={
                  <span
                    className="material-symbols-outlined text-[22px] rtl:-scale-x-100"
                    aria-hidden="true"
                  >
                    arrow_forward
                  </span>
                }
              >
                {submitLabel}
              </Button>
            </div>
          </form>

          <TrustBadges guaranteeDays={guaranteeDays} />
        </div>

        {/* Desktop Sticky Order Summary Column (5 cols) */}
        <aside
          aria-label={t('checkout:aria.orderSummaryRegion')}
          className="hidden lg:flex lg:col-span-5 flex-col gap-4 lg:sticky lg:top-24"
        >
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-md flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-primary text-[22px] shrink-0" aria-hidden="true">
                  shopping_bag
                </span>
                <h2 className="font-headline-md text-xl text-on-surface font-bold truncate">
                  {t('checkout:summary.title')}
                </h2>
              </div>

              <Badge variant="neutral" size="sm">
                {licenseBadge}
              </Badge>
            </div>

            <OrderSummaryContent
              idPrefix="desktop"
              project={project}
              selectedPackage={selectedPackage}
              pricing={effectivePricing}
              couponCodeInput={couponCodeInput}
              onCouponInputChange={handleCouponInputChange}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              isApplyingCoupon={validateCouponMutation.isPending}
              couponError={couponError}
              appliedPricing={appliedPricing}
              contactMeta={meta?.contact}
            />
          </div>
        </aside>
      </div>

      {/* Mobile Sticky Bottom Total + Submit Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-outline-variant px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.35)]">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-on-surface-variant truncate">
              {t('checkout:summary.totalLabel')}
            </span>
            <span className="text-lg font-black text-primary leading-tight truncate">
              {formattedTotal}
            </span>
          </div>

          <Button
            type="submit"
            form="checkout-form"
            variant="primary-gradient"
            size="md"
            loading={isSubmitting}
            disabled={submitDisabled}
            className="shrink-0 px-5 font-bold"
            iconTrailing={
              <span
                className="material-symbols-outlined text-[20px] rtl:-scale-x-100"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            }
          >
            {isRedirectingPayment
              ? t('checkout:actions.redirectingPayment')
              : isSubmitting
                ? t('checkout:actions.submitting')
                : t('checkout:actions.submitMobile')}
          </Button>
        </div>
      </div>
    </div>
  );
}
