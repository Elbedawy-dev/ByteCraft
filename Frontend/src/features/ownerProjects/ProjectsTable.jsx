import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang } from '@/app/providers';
import { localized } from '@/lib/localized';
import { formatMoney } from '@/lib/money';
import { formatNumber } from '@/lib/format';
import { projectDetailsPath } from '@/config/routes';
import { Badge, Button, Card } from '@/components/ui';
import { getCheapestPackagePrice } from './projectUtils';

const STATUS_BADGE_VARIANT = {
  published: 'success',
  draft: 'neutral',
  archived: 'warning',
};

function ProjectActionsBar({
  project,
  busyStatusId,
  onEdit,
  onChangeStatus,
  onDelete,
  t,
}) {
  const isBusy = busyStatusId === project.id;
  const isPublished = project.status === 'published';
  const isDraft = project.status === 'draft';
  const isArchived = project.status === 'archived';

  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      {isPublished ? (
        <a
          href={projectDetailsPath(project.slug)}
          target="_blank"
          rel="noopener noreferrer"
          title={t('actions.openPublic')}
          aria-label={t('actions.openPublic')}
          className="w-10 h-10 rounded-lg bg-surface-container-high/70 text-on-surface-variant hover:text-primary hover:bg-surface-container-high flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
        </a>
      ) : (
        <span title={t('actions.openPublicDisabled')}>
          <button
            type="button"
            disabled
            aria-label={t('actions.openPublicDisabled')}
            className="w-10 h-10 rounded-lg bg-surface-container-high/30 text-on-surface-variant/40 flex items-center justify-center cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </button>
        </span>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onEdit(project)}
        aria-label={t('actions.edit')}
        title={t('actions.edit')}
      >
        <span className="material-symbols-outlined text-[18px]">edit</span>
      </Button>

      {(isDraft || isArchived) && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          loading={isBusy}
          onClick={() => onChangeStatus(project, 'published')}
          aria-label={t('actions.publish')}
          title={t('actions.publish')}
          className="text-primary hover:bg-primary/10"
        >
          <span className="material-symbols-outlined text-[18px]">publish</span>
        </Button>
      )}

      {isPublished && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          loading={isBusy}
          onClick={() => onChangeStatus(project, 'draft')}
          aria-label={t('actions.unpublish')}
          title={t('actions.unpublish')}
        >
          <span className="material-symbols-outlined text-[18px]">unpublished</span>
        </Button>
      )}

      {isArchived ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          loading={isBusy}
          onClick={() => onChangeStatus(project, 'draft')}
          aria-label={t('actions.restoreDraft')}
          title={t('actions.restoreDraft')}
        >
          <span className="material-symbols-outlined text-[18px]">unarchive</span>
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          loading={isBusy}
          onClick={() => onChangeStatus(project, 'archived')}
          aria-label={t('actions.archive')}
          title={t('actions.archive')}
          className="hover:text-amber-400 hover:bg-amber-500/10"
        >
          <span className="material-symbols-outlined text-[18px]">archive</span>
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onDelete(project)}
        aria-label={t('actions.delete')}
        title={t('actions.delete')}
        className="hover:text-error hover:bg-error/10"
      >
        <span className="material-symbols-outlined text-[18px]">delete</span>
      </Button>
    </div>
  );
}

export function ProjectsTable({
  projects = [],
  busyStatusId,
  onEdit,
  onChangeStatus,
  onDelete,
}) {
  const { t } = useTranslation('ownerProjects');
  const { lang } = useLang();

  return (
    <>
      {/* Desktop Responsive Table */}
      <Card padding="none" className="hidden lg:block overflow-hidden">
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="projects-page-heading"
          className="overflow-x-auto"
        >
          <table className="w-full text-start border-collapse text-sm">
            <caption className="visually-hidden">{t('table.caption')}</caption>
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low/80 text-on-surface-variant text-xs font-semibold">
                <th scope="col" className="py-3.5 px-4 text-start">
                  {t('table.project')}
                </th>
                <th scope="col" className="py-3.5 px-4 text-start">
                  {t('table.category')}
                </th>
                <th scope="col" className="py-3.5 px-4 text-start">
                  {t('table.startingPrice')}
                </th>
                <th scope="col" className="py-3.5 px-4 text-start">
                  {t('table.stats')}
                </th>
                <th scope="col" className="py-3.5 px-4 text-center">
                  {t('table.status')}
                </th>
                <th scope="col" className="py-3.5 px-4 text-end">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {projects.map((project) => {
                const cheapestPrice = getCheapestPackagePrice(project.packages);
                const activeCount = (project.packages || []).filter(
                  (p) => p.isActive !== false
                ).length;
                const totalCount = (project.packages || []).length;

                return (
                  <tr
                    key={project.id}
                    className="hover:bg-surface-container-high/40 transition-colors"
                  >
                    <th scope="row" className="py-3.5 px-4 text-start max-w-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-20 aspect-video rounded-lg bg-surface-container-high overflow-hidden shrink-0 border border-outline-variant/60 flex items-center justify-center">
                          {project.thumbnail?.url ? (
                            <img
                              src={project.thumbnail.url}
                              alt={localized(project.title, lang)}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                              code
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {project.isFeatured && (
                              <span
                                title={t('featured')}
                                aria-label={t('featured')}
                                className="inline-flex text-primary shrink-0"
                              >
                                <span className="material-symbols-outlined material-symbols-filled text-[16px]">
                                  star
                                </span>
                              </span>
                            )}
                            <span className="font-semibold text-on-surface break-words">
                              {project.title?.ar}
                            </span>
                          </div>
                          <div className="text-xs text-on-surface-variant break-words">
                            <bdi dir="ltr">{project.title?.en}</bdi>
                          </div>
                          <div className="text-[11px] font-mono text-on-surface-variant/80 truncate">
                            <bdi dir="ltr">{project.slug}</bdi>
                          </div>
                        </div>
                      </div>
                    </th>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-xs">
                        {project.category
                          ? localized(project.category.name, lang)
                          : t('table.noCategory')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-primary">
                        {cheapestPrice !== null
                          ? formatMoney(cheapestPrice, lang)
                          : t('table.noPrice')}
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">
                        {t('table.packagesCount', {
                          active: formatNumber(activeCount),
                          total: formatNumber(totalCount),
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 text-xs text-on-surface-variant font-mono">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-primary">
                            visibility
                          </span>
                          <span>
                            {t('table.views', { count: formatNumber(project.stats?.views ?? 0) })}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-secondary">
                            play_circle
                          </span>
                          <span>
                            {t('table.previews', {
                              count: formatNumber(project.stats?.previewViews ?? 0),
                            })}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-primary">
                            shopping_bag
                          </span>
                          <span>
                            {t('table.purchases', {
                              count: formatNumber(project.stats?.purchases ?? 0),
                            })}
                          </span>
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Badge
                        variant={STATUS_BADGE_VARIANT[project.status] || 'neutral'}
                        dot
                        size="sm"
                      >
                        {t(`status.${project.status}`, { defaultValue: project.status })}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <ProjectActionsBar
                        project={project}
                        busyStatusId={busyStatusId}
                        onEdit={onEdit}
                        onChangeStatus={onChangeStatus}
                        onDelete={onDelete}
                        t={t}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile & Tablet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {projects.map((project) => {
          const cheapestPrice = getCheapestPackagePrice(project.packages);
          const activeCount = (project.packages || []).filter((p) => p.isActive !== false).length;
          const totalCount = (project.packages || []).length;

          return (
            <Card key={project.id} padding="sm" className="space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Thumbnail + Status + Featured */}
                <div className="relative aspect-video w-full rounded-xl bg-surface-container-high overflow-hidden border border-outline-variant/60 flex items-center justify-center">
                  {project.thumbnail?.url ? (
                    <img
                      src={project.thumbnail.url}
                      alt={localized(project.title, lang)}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[30px] text-on-surface-variant">
                      code
                    </span>
                  )}

                  <div className="absolute top-2 start-2 flex items-center gap-1.5">
                    <Badge
                      variant={STATUS_BADGE_VARIANT[project.status] || 'neutral'}
                      dot
                      size="sm"
                      className="backdrop-blur-md bg-surface-container/90"
                    >
                      {t(`status.${project.status}`, { defaultValue: project.status })}
                    </Badge>
                    {project.isFeatured && (
                      <Badge variant="primary" size="sm" className="bg-surface-container/90">
                        <span className="material-symbols-outlined material-symbols-filled text-[13px]">
                          star
                        </span>
                        <span>{t('featured')}</span>
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Titles + Category */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-on-surface break-words">
                      {project.title?.ar}
                    </h2>
                  </div>
                  <p className="text-xs text-on-surface-variant break-words">
                    <bdi dir="ltr">{project.title?.en}</bdi>
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-xs text-on-surface">
                      {project.category
                        ? localized(project.category.name, lang)
                        : t('table.noCategory')}
                    </span>
                    <span className="font-bold text-sm text-primary">
                      {cheapestPrice !== null
                        ? formatMoney(cheapestPrice, lang)
                        : t('table.noPrice')}
                    </span>
                  </div>
                </div>

                {/* Stats + Packages count */}
                <div
                  className={clsx(
                    'flex items-center justify-between gap-2 text-xs text-on-surface-variant font-mono pt-2 border-t border-outline-variant/50 flex-wrap'
                  )}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span>
                      {t('table.views', { count: formatNumber(project.stats?.views ?? 0) })}
                    </span>
                    <span>
                      {t('table.previews', {
                        count: formatNumber(project.stats?.previewViews ?? 0),
                      })}
                    </span>
                    <span>
                      {t('table.purchases', { count: formatNumber(project.stats?.purchases ?? 0) })}
                    </span>
                  </div>
                  <span>
                    {t('table.packagesCount', {
                      active: formatNumber(activeCount),
                      total: formatNumber(totalCount),
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-end">
                <ProjectActionsBar
                  project={project}
                  busyStatusId={busyStatusId}
                  onEdit={onEdit}
                  onChangeStatus={onChangeStatus}
                  onDelete={onDelete}
                  t={t}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
