import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { ROUTES } from '../../config/routes';
import { Badge, Card } from '../../components/ui';
import { MotionImage, Stagger, StaggerItem } from '../../components/ui/Motion';
import { EmptyState } from '../../components/shared';
import { localized } from '../../lib/localized';
import { formatNumber } from '../../lib/format';

function ProjectThumbnail({ thumbnail, alt }) {
  const [failed, setFailed] = useState(false);

  if (!thumbnail?.url || failed) {
    return (
      <div className="w-14 h-10 rounded-lg bg-surface-container-high border border-outline-variant/60 flex items-center justify-center text-on-surface-variant shrink-0">
        <span className="material-symbols-outlined text-[20px]">code</span>
      </div>
    );
  }

  return (
    <MotionImage
      src={thumbnail.url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-14 h-10 rounded-lg object-cover border border-outline-variant/60 bg-surface-container-high shrink-0"
    />
  );
}

export function TopProjectsCard({ topProjects = [] }) {
  const { t } = useTranslation('ownerDashboard');
  const { lang } = useLang();

  return (
    <Card variant="flat">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              workspace_premium
            </span>
            <span>{t('topProjects.title')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            {t('topProjects.subtitle')}
          </p>
        </div>

        <Link
          to={ROUTES.OWNER_PROJECTS}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-surface border border-card-border text-xs font-semibold text-primary hover:bg-card-hover hover:border-card-hover-border transition-colors"
        >
          <span>{t('topProjects.manageAll')}</span>
          <span className="material-symbols-outlined text-[15px] rtl:-scale-x-100">
            arrow_forward
          </span>
        </Link>
      </div>

      {topProjects.length === 0 ? (
        <EmptyState
          icon="folder_open"
          title={t('topProjects.emptyTitle')}
          description={t('topProjects.emptyDesc')}
        />
      ) : (
        <Stagger inView={false} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
          {topProjects.map((project, idx) => {
            const title = localized(project.title, lang) || project.slug;
            const categoryName =
              localized(project.category?.name, lang) ||
              t('topProjects.uncategorized');
            const purchases = project.stats?.purchases ?? 0;
            const views = project.stats?.views ?? 0;

            return (
              <StaggerItem key={project._id || project.id || project.slug || idx} className="flex">
                <Link
                  to={ROUTES.OWNER_PROJECTS}
                  className="group flex-1 rounded-xl bg-surface border border-card-border shadow-sm hover:bg-card-hover hover:border-card-hover-border hover:shadow-card-hover hover:-translate-y-0.5 p-3.5 flex flex-col justify-between gap-3 transition-[background-color,border-color,box-shadow,transform] duration-300 ease-nexus"
                >
                  <div className="flex items-start gap-3">
                    <ProjectThumbnail thumbnail={project.thumbnail} alt={title} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {title}
                      </h3>
                      <div className="mt-1.5">
                        <Badge size="sm" variant="neutral">
                          {categoryName}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-outline-variant/50 text-xs font-mono text-on-surface-variant">
                    <span className="inline-flex items-center gap-1 text-primary font-semibold">
                      <span className="material-symbols-outlined text-[15px]">
                        shopping_bag
                      </span>
                      {t('topProjects.purchases', {
                        count: formatNumber(purchases),
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">
                        visibility
                      </span>
                      {t('topProjects.views', { count: formatNumber(views) })}
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </Card>
  );
}
