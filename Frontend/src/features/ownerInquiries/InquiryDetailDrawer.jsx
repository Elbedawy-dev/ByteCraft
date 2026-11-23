import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang, useToast } from '@/app/providers';
import { getApiErrorMessage } from '@/api/client';
import {
  useDeleteOwnerInquiry,
  useOwnerInquiry,
  useUpdateOwnerInquiry,
} from '@/api/owner/inquiries';
import { projectDetailsPath } from '@/config/routes';
import { formatDateTime, formatFileSize } from '@/lib/format';
import { localized } from '@/lib/localized';
import {
  Badge,
  Button,
  CopyButton,
  FormField,
  Select,
  Skeleton,
  Textarea,
} from '@/components/ui';
import { ErrorState } from '@/components/shared';
import { OwnerConfirmDialog, OwnerDrawer } from '@/features/ownerOrders/NativeDialog';
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_BADGE_VARIANT,
  TIMELINE_BADGE_VARIANT,
  buildMailtoUrl,
  buildWhatsAppUrl,
  isImageAttachment,
} from './inquiryMeta';

export function InquiryDetailDrawer({ inquiryId, initialInquiry = null, onClose }) {
  const { t } = useTranslation(['ownerInquiries', 'common']);
  const { lang } = useLang();
  const toast = useToast();

  const {
    data: fetchedInquiry,
    isLoading,
    isError,
    error,
    refetch,
  } = useOwnerInquiry(inquiryId);

  const inquiry = fetchedInquiry || initialInquiry;

  const updateMutation = useUpdateOwnerInquiry();
  const deleteMutation = useDeleteOwnerInquiry();

  const [notes, setNotes] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const inquiryKey = inquiry?._id || inquiry?.id;
  const inquiryOwnerNotes = inquiry?.ownerNotes;

  useEffect(() => {
    if (inquiryKey) {
      setNotes(inquiryOwnerNotes || '');
    }
  }, [inquiryKey, inquiryOwnerNotes]);

  useEffect(() => {
    setDeleteOpen(false);
  }, [inquiryId]);

  const handleStatusChange = async (nextStatus) => {
    if (!inquiry || !nextStatus || nextStatus === inquiry.status) return;
    const id = inquiry._id || inquiry.id;
    try {
      await updateMutation.mutateAsync({ id, status: nextStatus });
      toast.success(t('ownerInquiries:messages.statusUpdated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!inquiry) return;
    const id = inquiry._id || inquiry.id;
    try {
      await updateMutation.mutateAsync({ id, ownerNotes: notes });
      toast.success(t('ownerInquiries:messages.notesSaved'));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!inquiry) return;
    const id = inquiry._id || inquiry.id;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t('ownerInquiries:messages.deleted'));
      setDeleteOpen(false);
      onClose?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const mailtoUrl = inquiry ? buildMailtoUrl(inquiry.email, inquiry.subject) : null;
  const whatsappText = inquiry
    ? t('ownerInquiries:drawer.whatsappPrefill', {
        name: inquiry.name || '',
        subject: inquiry.subject || '',
      })
    : '';
  const whatsappUrl = inquiry ? buildWhatsAppUrl(inquiry.phone, whatsappText) : null;
  const statusVariant = INQUIRY_STATUS_BADGE_VARIANT[inquiry?.status] || 'neutral';
  const attachments = Array.isArray(inquiry?.attachments) ? inquiry.attachments : [];

  return (
    <>
      <OwnerDrawer
        isOpen={Boolean(inquiryId)}
        onClose={onClose}
        size="lg"
        closeLabel={t('ownerInquiries:drawer.close')}
        title={inquiry?.subject || t('ownerInquiries:drawer.title')}
        headerBadge={
          inquiry?.status ? (
            <Badge variant={statusVariant} dot size="sm">
              {t(`ownerInquiries:status.${inquiry.status}`, { defaultValue: inquiry.status })}
            </Badge>
          ) : null
        }
        subtitle={
          inquiry?.createdAt ? (
            <span className="text-xs font-mono">
              {t('ownerInquiries:drawer.fields.createdAt')}: {formatDateTime(inquiry.createdAt, lang)}
            </span>
          ) : null
        }
        footer={
          inquiry ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                disabled={updateMutation.isPending || deleteMutation.isPending}
                iconLeading={<span className="material-symbols-outlined text-[18px]">delete</span>}
              >
                {t('ownerInquiries:table.delete')}
              </Button>

              <div className="flex items-center gap-2 flex-wrap">
                {mailtoUrl && (
                  <a
                    href={mailtoUrl}
                    className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-lg text-xs font-medium border border-outline-variant bg-surface-container text-on-surface hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[17px]">mail</span>
                    <span>{t('ownerInquiries:drawer.replyByEmail')}</span>
                  </a>
                )}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-lg text-xs font-semibold btn-primary-gradient"
                  >
                    <span className="material-symbols-outlined text-[17px]">chat</span>
                    <span>{t('ownerInquiries:drawer.replyByWhatsApp')}</span>
                  </a>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {isLoading && !inquiry ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : isError && !inquiry ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />
        ) : inquiry ? (
          <div className="space-y-6">
            {/* 1. Contact Info */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  contact_mail
                </span>
                <span>{t('ownerInquiries:drawer.sections.contact')}</span>
              </h3>

              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="min-w-0">
                  <div className="text-xs text-on-surface-variant">
                    {t('ownerInquiries:drawer.fields.name')}
                  </div>
                  <div className="font-semibold text-on-surface mt-0.5 break-words">
                    {inquiry.name || '—'}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-xs text-on-surface-variant">
                    {t('ownerInquiries:drawer.fields.locale')}
                  </div>
                  <div className="font-medium text-on-surface mt-0.5 uppercase font-mono text-xs">
                    {inquiry.locale || 'ar'}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-xs text-on-surface-variant">
                    {t('ownerInquiries:drawer.fields.email')}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                    <a
                      href={mailtoUrl || '#'}
                      className="text-primary hover:underline truncate text-xs sm:text-sm"
                    >
                      <bdi dir="ltr">{inquiry.email || '—'}</bdi>
                    </a>
                    {inquiry.email && (
                      <CopyButton
                        text={inquiry.email}
                        size="icon-sm"
                        className="!w-8 !h-8 shrink-0"
                        copiedLabel={t('common:actions.copied')}
                      />
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-xs text-on-surface-variant">
                    {t('ownerInquiries:drawer.fields.phone')}
                  </div>
                  {inquiry.phone ? (
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      <bdi dir="ltr" className="font-mono text-xs sm:text-sm text-on-surface truncate">
                        {inquiry.phone}
                      </bdi>
                      <CopyButton
                        text={inquiry.phone}
                        size="icon-sm"
                        className="!w-8 !h-8 shrink-0"
                        copiedLabel={t('common:actions.copied')}
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-on-surface-variant mt-0.5">
                      {t('ownerInquiries:drawer.fields.noPhone')}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Project Scope & Links */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">hub</span>
                <span>{t('ownerInquiries:drawer.sections.scope')}</span>
              </h3>

              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-surface-container p-3 border border-outline-variant/60">
                  <div className="text-[11px] text-on-surface-variant">
                    {t('ownerInquiries:drawer.fields.projectType')}
                  </div>
                  <div className="font-semibold text-on-surface mt-1">
                    {t(`ownerInquiries:projectType.${inquiry.projectType || 'other'}`, {
                      defaultValue: inquiry.projectType || 'other',
                    })}
                  </div>
                </div>

                <div className="rounded-lg bg-surface-container p-3 border border-outline-variant/60">
                  <div className="text-[11px] text-on-surface-variant">
                    {t('ownerInquiries:drawer.fields.budget')}
                  </div>
                  <div className="font-semibold text-primary mt-1">
                    {t(`ownerInquiries:budgetRange.${inquiry.budgetRange || 'undecided'}`, {
                      defaultValue: inquiry.budgetRange || 'undecided',
                    })}
                  </div>
                </div>

                <div className="rounded-lg bg-surface-container p-3 border border-outline-variant/60">
                  <div className="text-[11px] text-on-surface-variant">
                    {t('ownerInquiries:drawer.fields.timeline')}
                  </div>
                  <div className="mt-1">
                    <Badge
                      variant={TIMELINE_BADGE_VARIANT[inquiry.timeline] || 'neutral'}
                      size="sm"
                    >
                      {t(`ownerInquiries:timeline.${inquiry.timeline || 'standard'}`, {
                        defaultValue: inquiry.timeline || 'standard',
                      })}
                    </Badge>
                  </div>
                </div>

                {inquiry.project && typeof inquiry.project === 'object' && (
                  <div className="sm:col-span-3 rounded-lg bg-surface-container p-3 border border-outline-variant/60 flex items-center justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="text-[11px] text-on-surface-variant">
                        {t('ownerInquiries:drawer.fields.linkedProject')}
                      </div>
                      <div className="font-semibold text-on-surface mt-0.5 truncate">
                        {localized(inquiry.project.title, lang) || inquiry.project.slug}
                      </div>
                    </div>
                    {inquiry.project.slug && (
                      <Link
                        to={projectDetailsPath(inquiry.project.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <bdi dir="ltr">/{inquiry.project.slug}</bdi>
                        <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                      </Link>
                    )}
                  </div>
                )}

                {inquiry.servicePlan && typeof inquiry.servicePlan === 'object' && (
                  <div className="sm:col-span-3 rounded-lg bg-surface-container p-3 border border-outline-variant/60 flex items-center justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="text-[11px] text-on-surface-variant">
                        {t('ownerInquiries:drawer.fields.linkedPlan')}
                      </div>
                      <div className="font-semibold text-on-surface mt-0.5 truncate">
                        {localized(inquiry.servicePlan.name, lang)}
                      </div>
                    </div>
                    {inquiry.servicePlan.deliveryDays && (
                      <Badge variant="neutral" size="sm">
                        {t('ownerInquiries:drawer.fields.deliveryDays', {
                          days: inquiry.servicePlan.deliveryDays,
                        })}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* 3. Message Body */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  description
                </span>
                <span>{t('ownerInquiries:drawer.sections.message')}</span>
              </h3>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words">
                {inquiry.message}
              </div>
            </section>

            {/* 4. Attachments */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  attach_file
                </span>
                <span>
                  {t('ownerInquiries:drawer.sections.attachments', { count: attachments.length })}
                </span>
              </h3>

              {attachments.length === 0 ? (
                <p className="text-xs text-on-surface-variant rounded-xl border border-dashed border-outline-variant bg-surface-container-low/40 p-3.5">
                  {t('ownerInquiries:drawer.fields.noAttachments')}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {attachments.map((att, idx) => {
                    const isImg = isImageAttachment(att);
                    return (
                      <div
                        key={att.publicId || att.url || idx}
                        className="rounded-xl border border-outline-variant bg-surface-container-low p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isImg && att.url ? (
                            <img
                              src={att.url}
                              alt={att.originalName || 'Attachment'}
                              loading="lazy"
                              className="w-12 h-12 rounded-lg object-cover border border-outline-variant shrink-0 bg-surface-container"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[24px]">
                                picture_as_pdf
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div
                              className="text-sm font-medium text-on-surface truncate"
                              title={att.originalName}
                            >
                              <bdi dir="ltr">{att.originalName || `attachment-${idx + 1}`}</bdi>
                            </div>
                            <div className="text-xs text-on-surface-variant font-mono mt-0.5 flex items-center gap-2">
                              <span>{formatFileSize(att.size || 0, lang)}</span>
                              {att.mimeType && <span>• {att.mimeType}</span>}
                            </div>
                          </div>
                        </div>

                        {att.url && (
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-lg text-xs font-medium bg-surface-container border border-outline-variant text-on-surface hover:border-primary/50 hover:text-primary transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                open_in_new
                              </span>
                              <span>{t('ownerInquiries:drawer.fields.openAttachment')}</span>
                            </a>
                            <a
                              href={att.url}
                              download={att.originalName || true}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-lg text-xs font-medium bg-surface-container-high border border-outline-variant text-on-surface hover:border-primary/50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                download
                              </span>
                              <span>{t('ownerInquiries:drawer.fields.downloadAttachment')}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 5. Status & Private Owner Notes */}
            <section className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  edit_note
                </span>
                <span>{t('ownerInquiries:drawer.sections.management')}</span>
              </h3>

              <FormField
                id="inquiry-detail-status"
                label={t('ownerInquiries:drawer.fields.statusLabel')}
              >
                <Select
                  value={inquiry.status || 'new'}
                  disabled={updateMutation.isPending}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  {INQUIRY_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {t(`ownerInquiries:status.${st}`)}
                    </option>
                  ))}
                </Select>
              </FormField>

              <form onSubmit={handleSaveNotes} className="space-y-3">
                <FormField
                  id="inquiry-owner-notes"
                  label={t('ownerInquiries:drawer.fields.ownerNotes')}
                  hint={t('ownerInquiries:drawer.fields.notesLimit', { count: notes.length })}
                >
                  <Textarea
                    rows={4}
                    maxLength={2000}
                    className="min-h-[120px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('ownerInquiries:drawer.fields.ownerNotesPlaceholder')}
                    disabled={updateMutation.isPending}
                  />
                </FormField>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary-gradient"
                    size="sm"
                    loading={updateMutation.isPending}
                    iconLeading={<span className="material-symbols-outlined text-[18px]">save</span>}
                  >
                    {t('ownerInquiries:drawer.fields.saveNotes')}
                  </Button>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </OwnerDrawer>

      <OwnerConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        variant="danger"
        loading={deleteMutation.isPending}
        title={t('ownerInquiries:deleteDialog.title')}
        message={t('ownerInquiries:deleteDialog.message', { name: inquiry?.name || '' })}
        confirmText={t('ownerInquiries:deleteDialog.confirm')}
        cancelText={t('common:actions.cancel')}
      />
    </>
  );
}
