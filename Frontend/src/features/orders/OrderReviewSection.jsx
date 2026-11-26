import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  getStoredOrderReview,
  useSubmitOrderReview,
} from '../../api/orderTracking';
import { useSubmitAccountOrderReview } from '../../api/account';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '../../api/client';
import { useToast } from '../../app/providers';
import { projectDetailsPath } from '../../config/routes';
import { Button, Card, FormField, Input, Textarea } from '../../components/ui';
import { Rating } from '../../components/shared';

export function OrderReviewSection({ order, token, mode = 'guest' }) {
  const { t } = useTranslation('orders');
  const toast = useToast();

  const [savedReview, setSavedReview] = useState(() =>
    getStoredOrderReview(order?.orderNumber)
  );
  const [alreadyReviewed, setAlreadyReviewed] = useState(() =>
    Boolean(getStoredOrderReview(order?.orderNumber))
  );
  const [hoverRating, setHoverRating] = useState(0);

  const schema = useMemo(
    () =>
      z.object({
        rating: z.coerce
          .number()
          .int()
          .min(1, t('tracking.review.ratingRequired'))
          .max(5),
        customerName: z.string().trim().max(100).optional().default(''),
        comment: z
          .string()
          .trim()
          .min(5, t('tracking.review.commentMin'))
          .max(2000, t('tracking.review.commentMax')),
      }),
    [t]
  );

  const {
    register,
    watch,
    setValue,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      rating: 5,
      customerName: '',
      comment: '',
    },
  });

  const selectedRating = watch('rating');
  const guestSubmitReviewMutation = useSubmitOrderReview(order.orderNumber, token);
  const accountSubmitReviewMutation = useSubmitAccountOrderReview(order.orderNumber);
  const submitReviewMutation =
    mode === 'account' ? accountSubmitReviewMutation : guestSubmitReviewMutation;

  if (!['paid', 'delivered'].includes(order?.status)) {
    return null;
  }

  const onSubmit = async (values) => {
    try {
      const review = await submitReviewMutation.mutateAsync(values);
      setSavedReview(review || values);
      setAlreadyReviewed(true);
      toast.success(t('tracking.review.submitSuccess'));
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === 'ALREADY_EXISTS' || err.status === 409)
      ) {
        setAlreadyReviewed(true);
        toast.info(t('tracking.review.alreadyReviewed.title'));
        return;
      }

      if (err instanceof ApiError) {
        applyApiErrorsToForm(err, setError);
      }
      toast.error(getApiErrorMessage(err, t));
    }
  };

  if (alreadyReviewed) {
    return (
      <Card variant="flat" padding="md" className="space-y-4">
        <div
          role="status"
          className="p-5 rounded-xl bg-primary/10 border border-primary/30 flex items-start gap-3.5"
        >
          <span className="material-symbols-outlined text-primary text-[26px] shrink-0 mt-0.5">
            rate_review
          </span>
          <div className="space-y-2 flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-on-surface">
              {t('tracking.review.alreadyReviewed.title')}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {t('tracking.review.alreadyReviewed.description')}
            </p>

            {savedReview?.rating && (
              <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/70 space-y-1.5 mt-2">
                <Rating rating={savedReview.rating} showCount={false} />
                {savedReview.comment && (
                  <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
                    {savedReview.comment}
                  </p>
                )}
              </div>
            )}

            {order?.snapshot?.slug && (
              <div className="pt-1">
                <Button
                  to={projectDetailsPath(order.snapshot.slug)}
                  variant="outline"
                  size="sm"
                >
                    {t('tracking.review.alreadyReviewed.viewProject')}
                  </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const displayRating = hoverRating || Number(selectedRating) || 0;

  return (
    <Card variant="flat" padding="md" className="space-y-5">
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-outline-variant/70 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-[20px]">star</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-on-surface">
            {t('tracking.review.title')}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            {t('tracking.review.subtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Star Selector */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-on-surface block">
            {t('tracking.review.ratingLabel')}{' '}
            <span className="text-primary font-bold">*</span>
          </span>

          <div
            role="radiogroup"
            aria-label={t('tracking.review.ratingLabel')}
            className="inline-flex items-center gap-1.5 p-2 rounded-xl bg-surface-container border border-outline-variant/70"
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= displayRating;
              const isSelected = Number(selectedRating) === star;
              return (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={t('tracking.review.starLabel', { count: star })}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() =>
                    setValue('rating', star, { shouldValidate: true })
                  }
                  className="w-11 h-11 rounded-lg flex items-center justify-center transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-input-focus"
                >
                  <span
                    className={clsx(
                      'material-symbols-outlined text-[28px] transition-colors',
                      active ? 'text-star' : 'text-input-border'
                    )}
                    style={
                      active
                        ? { fontVariationSettings: "'FILL' 1" }
                        : undefined
                    }
                  >
                    star
                  </span>
                </button>
              );
            })}
          </div>

          {errors.rating?.message && (
            <p role="alert" className="text-xs text-error">
              {errors.rating.message}
            </p>
          )}
        </div>

        {/* Display Name (Optional) */}
        <FormField
          id="review-customer-name"
          label={t('tracking.review.nameLabel')}
          error={errors.customerName?.message}
          hint={t('tracking.review.nameHint')}
        >
          <Input
            {...register('customerName')}
            placeholder={t('tracking.review.namePlaceholder')}
          />
        </FormField>

        {/* Review Comment */}
        <FormField
          id="review-comment"
          label={t('tracking.review.commentLabel')}
          required
          error={errors.comment?.message}
        >
          <Textarea
            {...register('comment')}
            rows={4}
            placeholder={t('tracking.review.commentPlaceholder')}
          />
        </FormField>

        <Button
          type="submit"
          variant="primary-gradient"
          size="md"
          loading={submitReviewMutation.isPending}
          iconLeading={
            <span className="material-symbols-outlined text-[20px]">publish</span>
          }
        >
          {submitReviewMutation.isPending
            ? t('tracking.review.submitting')
            : t('tracking.review.submit')}
        </Button>
      </form>
    </Card>
  );
}
