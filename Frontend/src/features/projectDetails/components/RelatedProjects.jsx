import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRelatedProjects } from '../../../api/projectDetails';
import { normalizeProjectForCard } from '../../../api/home';
import { ROUTES } from '../../../config/routes';
import { ProjectCard, SectionHeader } from '../../../components/shared';
import { Button } from '../../../components/ui/Button';
import { Reveal, Stagger, StaggerItem } from '../../../components/ui/Motion';
import { Skeleton } from '../../../components/ui/Skeleton';

export function RelatedProjects({ categoryKey, currentSlug }) {
  const { t } = useTranslation('projectDetails');
  const { data: related = [], isLoading } = useRelatedProjects(categoryKey, currentSlug, {
    enabled: Boolean(categoryKey),
  });

  if (!categoryKey) return null;
  if (!isLoading && related.length === 0) return null;

  return (
    <section aria-labelledby="related-projects-heading" className="pt-10 lg:pt-14 space-y-8 border-t border-outline-variant">
      <Reveal className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div id="related-projects-heading">
          <SectionHeader
            align="start"
            badge={t('sections.relatedEyebrow')}
            title={t('sections.relatedTitle')}
          />
        </div>

        <Button
          to={ROUTES.PROJECTS}
          variant="outline"
          size="sm"
          iconTrailing={
              <span className="material-symbols-rounded text-[16px] rtl:-scale-x-100" aria-hidden="true">
                arrow_forward
              </span>
            }
        >
            {t('sections.browseAllProjects')}
          </Button>
      </Reveal>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton.Card key={i} />
          ))}
        </div>
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {related.map((item) => (
            <StaggerItem key={item.id || item._id || item.slug} className="flex">
              <ProjectCard
                project={normalizeProjectForCard(item)}
                className="w-full"
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}
