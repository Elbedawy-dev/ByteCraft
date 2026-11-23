import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { ROUTES } from '../../config/routes';
import { Badge, Card } from '../../components/ui';
import { EmptyState } from '../../components/shared';
import { formatDate } from '../../lib/format';
import { OwnerStatusBadge } from './OwnerStatusBadge';

export function RecentInquiriesCard({ recentInquiries = [] }) {
  const { t } = useTranslation('ownerDashboard');
  const { lang } = useLang();

  return (
    <Card variant="flat" className="flex flex-col justify-between h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              mail
            </span>
            <span>{t('recentInquiries.title')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            {t('recentInquiries.subtitle')}
          </p>
        </div>

        <Link
          to={ROUTES.OWNER_INQUIRIES}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-surface border border-card-border text-xs font-semibold text-primary hover:bg-card-hover hover:border-card-hover-border transition-colors"
        >
          <span>{t('recentInquiries.viewAll')}</span>
          <span className="material-symbols-outlined text-[15px] rtl:-scale-x-100">
            arrow_forward
          </span>
        </Link>
      </div>

      {recentInquiries.length === 0 ? (
        <EmptyState
          icon="mark_email_read"
          title={t('recentInquiries.emptyTitle')}
          description={t('recentInquiries.emptyDesc')}
        />
      ) : (
        <>
          {/* Mobile Cards View (< sm) */}
          <div className="flex flex-col gap-3 sm:hidden">
            {recentInquiries.map((inq, idx) => (
              <div
                key={inq._id || inq.id || idx}
                className="rounded-xl bg-surface border border-card-border p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-on-surface truncate">
                      {inq.name}
                    </div>
                    <div className="text-[11px] font-mono text-on-surface-variant truncate">
                      <bdi dir="ltr">{inq.email}</bdi>
                    </div>
                  </div>
                  <OwnerStatusBadge type="inquiry" status={inq.status} />
                </div>

                <div className="text-xs font-medium text-on-surface line-clamp-2">
                  {inq.subject}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/50 text-[11px] text-on-surface-variant">
                  <span>
                    {t(`recentInquiries.budgetRanges.${inq.budgetRange}`, {
                      defaultValue: inq.budgetRange,
                    })}
                  </span>
                  <span>{formatDate(inq.createdAt, lang)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/Tablet Scrollable Table (>= sm) */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-card-border bg-surface">
            <table className="w-full text-start border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-card-border bg-surface-container-high text-on-surface-variant text-xs font-semibold">
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">
                    {t('recentInquiries.columns.client')}
                  </th>
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">
                    {t('recentInquiries.columns.subject')}
                  </th>
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">
                    {t('recentInquiries.columns.budget')}
                  </th>
                  <th className="py-3 px-3.5 text-end whitespace-nowrap">
                    {t('recentInquiries.columns.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {recentInquiries.map((inq, idx) => (
                  <tr
                    key={inq._id || inq.id || idx}
                    className="even:bg-section-band hover:bg-surface-container-high/60 transition-colors"
                  >
                    <td className="py-3 px-3.5 align-top">
                      <div className="font-semibold text-on-surface whitespace-nowrap">
                        {inq.name}
                      </div>
                      <div className="text-[11px] font-mono text-on-surface-variant mt-0.5 whitespace-nowrap">
                        <bdi dir="ltr">{inq.email}</bdi>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 align-top max-w-[200px]">
                      <div className="text-on-surface font-medium line-clamp-2">
                        {inq.subject}
                      </div>
                      <div className="mt-1">
                        <Badge size="sm" variant="neutral">
                          {t(`recentInquiries.projectTypes.${inq.projectType}`, {
                            defaultValue: inq.projectType,
                          })}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 align-top whitespace-nowrap">
                      <div className="text-xs font-semibold text-primary">
                        {t(`recentInquiries.budgetRanges.${inq.budgetRange}`, {
                          defaultValue: inq.budgetRange,
                        })}
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">
                        {t(`recentInquiries.timelines.${inq.timeline}`, {
                          defaultValue: inq.timeline,
                        })}{' '}
                        · {formatDate(inq.createdAt, lang)}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 align-top text-end whitespace-nowrap">
                      <OwnerStatusBadge type="inquiry" status={inq.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
