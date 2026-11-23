import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang, useToast } from '@/app/providers';
import { useOwnerPageTitle } from '@/components/layout/OwnerLayout';
import { getApiErrorMessage } from '@/api/client';
import { useDeleteOwnerInquiry, useOwnerInquiries } from '@/api/owner/inquiries';
import { formatDateTime } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  Input,
  Pagination,
  Select,
  Skeleton,
} from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/shared';
import { OwnerConfirmDialog } from '@/features/ownerOrders/NativeDialog';
import { InquiryDetailDrawer } from '@/features/ownerInquiries/InquiryDetailDrawer';
import {
  INQUIRY_PROJECT_TYPES,
  INQUIRY_STATUSES,
  INQUIRY_STATUS_BADGE_VARIANT,
  TIMELINE_BADGE_VARIANT,
  buildMailtoUrl,
  buildWhatsAppUrl,
} from '@/features/ownerInquiries/inquiryMeta';

const PAGE_LIMIT = 15;

export default function OwnerInquiriesPage() {
  const { t } = useTranslation(['ownerInquiries', 'common']);
  const { lang } = useLang();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  useOwnerPageTitle(t('ownerInquiries:title'));

  const urlStatus = searchParams.get('status') || '';
  const initialStatus = INQUIRY_STATUSES.includes(urlStatus) ? urlStatus : '';
  const [status, setStatus] = useState(initialStatus);
  const [projectType, setProjectType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const nextUrlStatus = searchParams.get('status') || '';
    if (nextUrlStatus && INQUIRY_STATUSES.includes(nextUrlStatus) && nextUrlStatus !== status) {
      setStatus(nextUrlStatus);
      setPage(1);
    }
  }, [searchParams, status]);

  const handleStatusChange = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
    if (searchParams.has('status')) {
      const next = new URLSearchParams(searchParams);
      if (nextStatus) {
        next.set('status', nextStatus);
      } else {
        next.delete('status');
      }
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = {
    status: status || undefined,
    projectType: projectType || undefined,
    search: debouncedSearch || undefined,
    page,
    limit: PAGE_LIMIT,
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useOwnerInquiries(queryParams);
  const deleteMutation = useDeleteOwnerInquiry();

  const inquiries = data?.inquiries || [];
  const meta = data?.meta || { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 };
  const hasActiveFilters = Boolean(status || projectType || debouncedSearch);
  const unreadInPage = inquiries.filter((inq) => inq.status === 'new').length;

  const handleResetFilters = () => {
    handleStatusChange('');
    setProjectType('');
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id || deleteTarget.id;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t('ownerInquiries:messages.deleted'));
      setDeleteTarget(null);
      if ((selectedInquiry?._id || selectedInquiry?.id) === id) {
        setSelectedInquiry(null);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const rangeFrom = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const rangeTo = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-2xl border border-card-border bg-card shadow-card p-5 sm:p-6">
        <div
          className="pointer-events-none absolute -top-20 -end-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {t('ownerInquiries:title')}
              </h1>
              <Badge variant="neutral" size="md">
                <bdi dir="ltr" className="font-mono">
                  {meta.total}
                </bdi>
              </Badge>
              {unreadInPage > 0 && (
                <Badge variant="primary" dot size="md">
                  {t('ownerInquiries:stats.unreadBadge')}:{' '}
                  <bdi dir="ltr" className="font-mono font-bold">
                    {unreadInPage}
                  </bdi>
                </Badge>
              )}
            </div>
            <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl">
              {t('ownerInquiries:subtitle')}
            </p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <Card variant="flat" padding="sm" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="sm:col-span-2 lg:col-span-6">
            <label htmlFor="inquiries-search" className="sr-only">
              {t('ownerInquiries:filters.searchLabel')}
            </label>
            <Input
              id="inquiries-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('ownerInquiries:filters.searchPlaceholder')}
              iconLeading={<span className="material-symbols-outlined text-[20px]">search</span>}
            />
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="inquiries-status" className="sr-only">
              {t('ownerInquiries:filters.statusLabel')}
            </label>
            <Select
              id="inquiries-status"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="">{t('ownerInquiries:filters.allStatuses')}</option>
              {INQUIRY_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {t(`ownerInquiries:status.${st}`)}
                </option>
              ))}
            </Select>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="inquiries-type" className="sr-only">
              {t('ownerInquiries:filters.projectTypeLabel')}
            </label>
            <Select
              id="inquiries-type"
              value={projectType}
              onChange={(e) => {
                setProjectType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('ownerInquiries:filters.allProjectTypes')}</option>
              {INQUIRY_PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`ownerInquiries:projectType.${type}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { key: '', label: t('ownerInquiries:filters.allStatuses') },
              ...INQUIRY_STATUSES.map((st) => ({
                key: st,
                label: t(`ownerInquiries:status.${st}`),
              })),
            ].map((chip) => {
              const active = status === chip.key;
              return (
                <button
                  key={chip.key || 'all'}
                  type="button"
                  onClick={() => handleStatusChange(chip.key)}
                  className={clsx(
                    'px-3 h-9 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                    active
                      ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-transparent'
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              iconLeading={
                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
              }
            >
              {t('ownerInquiries:filters.clearFilters')}
            </Button>
          )}
        </div>
      </Card>

      {/* Content */}
      {isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />
      ) : isLoading ? (
        <Card padding="none" className="overflow-hidden">
          <div className="p-4 sm:p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      ) : inquiries.length === 0 ? (
        <EmptyState
          icon="mail"
          title={
            hasActiveFilters
              ? t('ownerInquiries:empty.title')
              : t('ownerInquiries:empty.noInquiriesTitle')
          }
          description={
            hasActiveFilters
              ? t('ownerInquiries:empty.description')
              : t('ownerInquiries:empty.noInquiriesDescription')
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                {t('ownerInquiries:filters.clearFilters')}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className={clsx('space-y-4 transition-opacity', isFetching && 'opacity-70')}>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-card-border bg-card shadow-card overflow-hidden">
            <div
              tabIndex={0}
              role="region"
              aria-label={t('ownerInquiries:table.regionLabel')}
              className="w-full overflow-x-auto"
            >
              <table className="w-full text-start border-collapse text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-surface-container-high text-on-surface-variant text-xs font-semibold">
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerInquiries:table.sender')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerInquiries:table.subjectType')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerInquiries:table.budgetTimeline')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerInquiries:table.status')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap">
                      {t('ownerInquiries:table.date')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-end whitespace-nowrap">
                      {t('ownerInquiries:table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {inquiries.map((inq) => {
                    const id = inq._id || inq.id;
                    const isUnread = inq.status === 'new';
                    const statusVariant = INQUIRY_STATUS_BADGE_VARIANT[inq.status] || 'neutral';
                    const attCount = Array.isArray(inq.attachments) ? inq.attachments.length : 0;
                    const mailtoUrl = buildMailtoUrl(inq.email, inq.subject);
                    const waUrl = buildWhatsAppUrl(
                      inq.phone,
                      t('ownerInquiries:drawer.whatsappPrefill', {
                        name: inq.name || '',
                        subject: inq.subject || '',
                      })
                    );

                    return (
                      <tr
                        key={id}
                        onClick={() => setSelectedInquiry(inq)}
                        className={clsx(
                          'transition-colors cursor-pointer group',
                          isUnread
                            ? 'bg-badge-green-bg/60 hover:bg-badge-green-bg'
                            : 'even:bg-surface-container-high/40 hover:bg-card-hover'
                        )}
                      >
                        <td
                          className={clsx(
                            'py-3.5 px-4 align-top max-w-[230px]',
                            isUnread && 'border-s-4 border-primary'
                          )}
                        >
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isUnread && (
                                <span
                                  className="w-2 h-2 rounded-full bg-primary shrink-0"
                                  aria-label={t('ownerInquiries:stats.unreadBadge')}
                                />
                              )}
                              <span
                                className={clsx(
                                  'truncate',
                                  isUnread
                                    ? 'font-bold text-on-surface'
                                    : 'font-semibold text-on-surface'
                                )}
                                title={inq.name}
                              >
                                {inq.name}
                              </span>
                            </div>
                            <span
                              className="text-xs text-on-surface-variant truncate mt-0.5"
                              title={inq.email}
                            >
                              <bdi dir="ltr">{inq.email}</bdi>
                            </span>
                            {inq.phone && (
                              <span className="text-[11px] font-mono text-on-surface-variant truncate">
                                <bdi dir="ltr">{inq.phone}</bdi>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top max-w-[260px]">
                          <div className="flex flex-col gap-1 min-w-0">
                            <span
                              className={clsx(
                                'truncate group-hover:text-primary transition-colors',
                                isUnread ? 'font-bold text-on-surface' : 'font-medium text-on-surface'
                              )}
                              title={inq.subject}
                            >
                              {inq.subject}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="neutral" size="sm">
                                {t(`ownerInquiries:projectType.${inq.projectType || 'other'}`, {
                                  defaultValue: inq.projectType || 'other',
                                })}
                              </Badge>
                              {attCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[14px]">
                                    attach_file
                                  </span>
                                  {attCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-primary">
                              {t(`ownerInquiries:budgetRange.${inq.budgetRange || 'undecided'}`, {
                                defaultValue: inq.budgetRange || 'undecided',
                              })}
                            </span>
                            <Badge
                              variant={TIMELINE_BADGE_VARIANT[inq.timeline] || 'neutral'}
                              size="sm"
                              className="w-fit"
                            >
                              {t(`ownerInquiries:timeline.${inq.timeline || 'standard'}`, {
                                defaultValue: inq.timeline || 'standard',
                              })}
                            </Badge>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <Badge variant={statusVariant} dot size="sm">
                            {t(`ownerInquiries:status.${inq.status}`, {
                              defaultValue: inq.status,
                            })}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap text-xs font-mono text-on-surface-variant">
                          {formatDateTime(inq.createdAt, lang)}
                        </td>

                        <td
                          className="py-3.5 px-4 align-top text-end whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg bg-surface-container-high text-primary hover:bg-badge-green-bg hover:text-badge-green-text flex items-center justify-center transition-colors"
                                title={t('ownerInquiries:table.replyWhatsApp')}
                                aria-label={t('ownerInquiries:table.replyWhatsApp')}
                              >
                                <span className="material-symbols-outlined text-[18px]">chat</span>
                              </a>
                            )}
                            {mailtoUrl && (
                              <a
                                href={mailtoUrl}
                                className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors"
                                title={t('ownerInquiries:table.replyEmail')}
                                aria-label={t('ownerInquiries:table.replyEmail')}
                              >
                                <span className="material-symbols-outlined text-[18px]">mail</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedInquiry(inq)}
                              className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                              title={t('ownerInquiries:table.viewDetails')}
                              aria-label={t('ownerInquiries:table.viewDetails')}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                visibility
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(inq)}
                              className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-error flex items-center justify-center transition-colors"
                              title={t('ownerInquiries:table.delete')}
                              aria-label={t('ownerInquiries:table.delete')}
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
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
            {inquiries.map((inq) => {
              const id = inq._id || inq.id;
              const isUnread = inq.status === 'new';
              const statusVariant = INQUIRY_STATUS_BADGE_VARIANT[inq.status] || 'neutral';
              const attCount = Array.isArray(inq.attachments) ? inq.attachments.length : 0;
              const mailtoUrl = buildMailtoUrl(inq.email, inq.subject);
              const waUrl = buildWhatsAppUrl(
                inq.phone,
                t('ownerInquiries:drawer.whatsappPrefill', {
                  name: inq.name || '',
                  subject: inq.subject || '',
                })
              );

              return (
                <article
                  key={id}
                  className={clsx(
                    'rounded-xl border p-4 space-y-3 transition-colors shadow-card',
                    isUnread
                      ? 'bg-card border-primary/50 border-s-4'
                      : 'bg-card border-card-border'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isUnread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        <span className="font-bold text-sm text-on-surface break-words">
                          {inq.name}
                        </span>
                      </div>
                      <div className="text-xs text-on-surface-variant break-all mt-0.5">
                        <bdi dir="ltr">{inq.email}</bdi>
                      </div>
                    </div>
                    <Badge variant={statusVariant} dot size="sm">
                      {t(`ownerInquiries:status.${inq.status}`, { defaultValue: inq.status })}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm font-semibold text-on-surface break-words">
                      {inq.subject}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="neutral" size="sm">
                        {t(`ownerInquiries:projectType.${inq.projectType || 'other'}`)}
                      </Badge>
                      <Badge variant="primary" size="sm">
                        {t(`ownerInquiries:budgetRange.${inq.budgetRange || 'undecided'}`)}
                      </Badge>
                      {attCount > 0 && (
                        <Badge variant="outline" size="sm">
                          <span className="material-symbols-outlined text-[13px] me-0.5">
                            attach_file
                          </span>
                          {attCount}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-on-surface-variant">
                      {formatDateTime(inq.createdAt, lang)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-outline-variant/60 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center"
                          aria-label={t('ownerInquiries:table.replyWhatsApp')}
                        >
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                        </a>
                      )}
                      {mailtoUrl && (
                        <a
                          href={mailtoUrl}
                          className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center"
                          aria-label={t('ownerInquiries:table.replyEmail')}
                        >
                          <span className="material-symbols-outlined text-[18px]">mail</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(inq)}
                        className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-error flex items-center justify-center"
                        aria-label={t('ownerInquiries:table.delete')}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedInquiry(inq)}
                      iconLeading={
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      }
                    >
                      {t('ownerInquiries:table.viewDetails')}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs font-mono text-on-surface-variant">
              {t('ownerInquiries:stats.showing', {
                from: rangeFrom,
                to: rangeTo,
                total: meta.total,
              })}
            </span>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(nextPage) => setPage(nextPage)}
            />
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <InquiryDetailDrawer
        inquiryId={selectedInquiry?._id || selectedInquiry?.id || null}
        initialInquiry={selectedInquiry}
        onClose={() => setSelectedInquiry(null)}
      />

      {/* Delete Confirm Dialog */}
      <OwnerConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        loading={deleteMutation.isPending}
        title={t('ownerInquiries:deleteDialog.title')}
        message={t('ownerInquiries:deleteDialog.message', { name: deleteTarget?.name || '' })}
        confirmText={t('ownerInquiries:deleteDialog.confirm')}
        cancelText={t('common:actions.cancel')}
      />
    </div>
  );
}
