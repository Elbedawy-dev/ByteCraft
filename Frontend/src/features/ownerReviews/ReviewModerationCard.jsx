import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang, useToast } from '@/app/providers';
import { getApiErrorMessage } from '@/api/client';
import { useDeleteOwnerReview, useModerateOwnerReview } from '@/api/owner/reviews';
import { projectDetailsPath } from '@/config/routes';
import { formatDateTime } from '@/lib/format';
import { localized } from '@/lib/localized';
import { Badge, Button, FormField, Switch, Textarea } from '@/components/ui';
import { Rating } from '@/components/shared';
import { OwnerConfirmDialog } from '@/features/ownerOrders/NativeDialog';

export function ReviewModerationCard({ review }) {
  const { t } = useTranslation(['ownerReviews', 'common']);
  const { lang } = useLang();
  const toast = useToast();

  const moderateMutation = useModerateOwnerReview();
  const deleteMutation = useDeleteOwnerReview();

  const [editingReply, setEditingReply] = useState(false);
  const [replyText, setReplyText] = useState(review.ownerResponse || '');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const id = review._id || review.id;
  const isPublished = Boolean(review.isPublished);
  const projectObj = review.project && typeof review.project === 'object' ? review.project : null;
  const projectTitle = projectObj ? localized(projectObj.title, lang) || projectObj.slug : '';
  const customerEmail = review.order?.customer?.email || '';

  useEffect(() => {
    setReplyText(review.ownerResponse || '');
  }, [review.ownerResponse]);

  const handleTogglePublished = async () => {
    const nextPublished = !isPublished;
    try {
      await moderateMutation.mutateAsync({ id, isPublished: nextPublished });
      toast.success(
        nextPublished
          ? t('ownerReviews:messages.published')
          : t('ownerReviews:messages.hidden')
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleSaveReply = async (e) => {
    e.preventDefault();
    try {
      await moderateMutation.mutateAsync({ id, ownerResponse: replyText.trim() });
      toast.success(t('ownerReviews:messages.responseSaved'));
      setEditingReply(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleClearReply = async () => {
    try {
      await moderateMutation.mutateAsync({ id, ownerResponse: '' });
      toast.success(t('ownerReviews:messages.responseSaved'));
      setReplyText('');
      setEditingReply(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t('ownerReviews:messages.deleted'));
      setDeleteOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <>
      <article
        className={clsx(
          'rounded-2xl border p-5 sm:p-6 space-y-4 bg-card border-card-border shadow-card transition-colors',
          !isPublished && 'opacity-90'
        )}
      >
        {/* Top Header: Reviewer, Rating, Publish Switch & Delete */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {(review.customerName || 'C').trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-on-surface break-words">
                    {review.customerName}
                  </h2>
                  <Badge variant="primary" size="sm">
                    <span className="material-symbols-outlined text-[13px] me-0.5">verified</span>
                    {t('ownerReviews:card.verifiedBuyer')}
                  </Badge>
                  <Badge variant={isPublished ? 'success' : 'neutral'} dot size="sm">
                    {isPublished
                      ? t('ownerReviews:card.publishedBadge')
                      : t('ownerReviews:card.hiddenBadge')}
                  </Badge>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap text-xs text-on-surface-variant mt-1">
                  <span className="font-mono">
                    {t('ownerReviews:card.orderNumber')}:{' '}
                    <bdi dir="ltr" className="text-on-surface font-medium">
                      {review.orderNumber || review.order?.orderNumber || '—'}
                    </bdi>
                  </span>
                  {customerEmail && (
                    <span className="truncate max-w-full">
                      • <bdi dir="ltr">{customerEmail}</bdi>
                    </span>
                  )}
                  <span className="font-mono">• {formatDateTime(review.createdAt, lang)}</span>
                </div>
              </div>
            </div>

            {/* Rating + Linked Project */}
            <div className="flex items-center gap-3 flex-wrap pt-1">
              <Rating rating={review.rating} showCount={false} size="md" />

              {projectObj?.slug ? (
                <Link
                  to={projectDetailsPath(projectObj.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant text-xs font-medium text-on-surface hover:border-primary/50 hover:text-primary transition-colors max-w-full"
                >
                  <span className="material-symbols-outlined text-[15px] text-primary shrink-0">
                    folder_code
                  </span>
                  <span className="truncate">{projectTitle}</span>
                  <span className="material-symbols-outlined text-[14px] shrink-0">
                    open_in_new
                  </span>
                </Link>
              ) : (
                <span className="text-xs text-on-surface-variant">
                  {t('ownerReviews:card.unknownProject')}
                </span>
              )}
            </div>
          </div>

          {/* Moderation Controls */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap lg:justify-end">
            <div className="px-3 rounded-xl bg-surface-container-low border border-outline-variant">
              <Switch
                id={`review-publish-${id}`}
                label={t('ownerReviews:card.visibilitySwitchLabel')}
                checked={isPublished}
                disabled={moderateMutation.isPending}
                onChange={handleTogglePublished}
              />
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteMutation.isPending}
              className="text-on-surface-variant hover:text-error hover:bg-error/10 border border-outline-variant"
              title={t('ownerReviews:card.delete')}
              aria-label={t('ownerReviews:card.delete')}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </Button>
          </div>
        </div>

        {/* Review Comment */}
        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words bg-surface rounded-xl p-4 border border-card-border">
          {review.comment}
        </p>

        {/* Owner Response Area */}
        <div className="space-y-3">
          {editingReply ? (
            <form
              onSubmit={handleSaveReply}
              className="rounded-xl border border-primary/30 bg-surface p-4 space-y-3"
            >
              <FormField
                id={`review-reply-${id}`}
                label={t('ownerReviews:card.ownerResponseTitle')}
                hint={t('ownerReviews:card.responseLimit', { count: replyText.length })}
              >
                <Textarea
                  rows={3}
                  maxLength={2000}
                  className="min-h-[100px]"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('ownerReviews:card.responsePlaceholder')}
                  disabled={moderateMutation.isPending}
                />
              </FormField>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                {review.ownerResponse ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearReply}
                    disabled={moderateMutation.isPending}
                    className="!text-error hover:!bg-error/10"
                  >
                    {t('ownerReviews:card.clearResponse')}
                  </Button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyText(review.ownerResponse || '');
                      setEditingReply(false);
                    }}
                    disabled={moderateMutation.isPending}
                  >
                    {t('common:actions.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary-gradient"
                    size="sm"
                    loading={moderateMutation.isPending}
                    iconLeading={<span className="material-symbols-outlined text-[17px]">save</span>}
                  >
                    {t('ownerReviews:card.saveResponse')}
                  </Button>
                </div>
              </div>
            </form>
          ) : review.ownerResponse ? (
            <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <span className="material-symbols-outlined text-[16px]">reply</span>
                  <span>{t('ownerReviews:card.ownerResponseTitle')}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingReply(true)}
                  iconLeading={<span className="material-symbols-outlined text-[16px]">edit</span>}
                >
                  {t('ownerReviews:card.editResponse')}
                </Button>
              </div>
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words">
                {review.ownerResponse}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
              <span className="text-xs font-mono text-on-surface-variant">
                {review.moderatedAt
                  ? t('ownerReviews:card.moderatedAt', {
                      date: formatDateTime(review.moderatedAt, lang),
                    })
                  : ''}
              </span>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingReply(true)}
                iconLeading={<span className="material-symbols-outlined text-[17px]">reply</span>}
              >
                {t('ownerReviews:card.addResponse')}
              </Button>
            </div>
          )}

          {!editingReply && review.ownerResponse && review.moderatedAt && (
            <div className="text-[11px] font-mono text-on-surface-variant">
              {t('ownerReviews:card.moderatedAt', {
                date: formatDateTime(review.moderatedAt, lang),
              })}
            </div>
          )}
        </div>
      </article>

      <OwnerConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        variant="danger"
        loading={deleteMutation.isPending}
        title={t('ownerReviews:deleteDialog.title')}
        message={t('ownerReviews:deleteDialog.message', { name: review.customerName || '' })}
        confirmText={t('ownerReviews:deleteDialog.confirm')}
        cancelText={t('common:actions.cancel')}
      />
    </>
  );
}
