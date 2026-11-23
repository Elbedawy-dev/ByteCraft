import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { useMeta } from '../../api/meta';
import { useProjectDetails, recordPreviewViewOnce } from '../../api/projectDetails';
import { getApiErrorMessage } from '../../api/client';
import { localized } from '../../lib/localized';
import { ROUTES, contactPath } from '../../config/routes';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs';
import { CtaBanner } from '../../components/shared/CtaBanner';
import { ErrorState } from '../../components/shared/ErrorState';
import {
  ProjectGallery,
  ProjectHeader,
  ProjectSpecs,
  DeliveryFaq,
  ProjectReviews,
  RelatedProjects,
  PurchasePanel,
  LivePreviewModal,
  ProjectDetailsSkeleton,
  ProjectNotFound,
} from '../../features/projectDetails';

function pickDefaultPackageKey(activePackages, requestedKey) {
  if (!Array.isArray(activePackages) || activePackages.length === 0) return '';
  if (requestedKey) {
    const requested = activePackages.find(
      (pkg) => String(pkg.key).toLowerCase() === String(requestedKey).toLowerCase()
    );
    if (requested) return requested.key;
  }
  const popular = activePackages.find((pkg) => pkg.isPopular);
  if (popular) return popular.key;
  const cheapest = [...activePackages].sort((a, b) => (a.price || 0) - (b.price || 0))[0];
  return cheapest?.key || activePackages[0].key;
}

export default function ProjectDetailsPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const requestedPkgKey = searchParams.get('package');

  const { t } = useTranslation(['projectDetails', 'common']);
  const { lang } = useLang();

  const { data: meta } = useMeta();
  const { data: project, isLoading, isError, error, refetch } = useProjectDetails(slug);

  const [selectedPackageKey, setSelectedPackageKey] = useState('');
  const [livePreviewOpen, setLivePreviewOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const activePackages = useMemo(() => {
    if (!Array.isArray(project?.packages)) return [];
    return project.packages.filter((pkg) => pkg.isActive !== false);
  }, [project]);

  useEffect(() => {
    setLivePreviewOpen(false);
    setMobileSheetOpen(false);
  }, [slug]);

  useEffect(() => {
    if (!project) {
      setSelectedPackageKey('');
      return;
    }
    setSelectedPackageKey(pickDefaultPackageKey(activePackages, requestedPkgKey));
  }, [project, activePackages, requestedPkgKey]);

  const selectedPackage = useMemo(() => {
    if (activePackages.length === 0) return null;
    return (
      activePackages.find((pkg) => pkg.key === selectedPackageKey) ||
      activePackages[0]
    );
  }, [activePackages, selectedPackageKey]);

  const isNotFound =
    (isError && (error?.status === 404 || error?.code === 'NOT_FOUND')) ||
    (!isLoading && !isError && !project);

  const handleOpenLiveDemo = useCallback(() => {
    const previewUrl = project?.preview?.url?.trim();
    if (!previewUrl) return;

    recordPreviewViewOnce(project.slug);

    if (project.preview.mode === 'external') {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setLivePreviewOpen(true);
  }, [project]);

  if (isLoading) {
    return <ProjectDetailsSkeleton />;
  }

  if (isNotFound) {
    return <ProjectNotFound />;
  }

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <ErrorState
          message={getApiErrorMessage(error, t)}
          onRetry={refetch}
        />
      </div>
    );
  }

  const projectTitle = localized(project.title, lang);
  const categoryKey = project.category?.key || '';
  const guaranteeDays = meta?.guaranteeDays ?? 30;
  const rawBullets = t('common:cta.bullets', { returnObjects: true });
  const ctaBullets = Array.isArray(rawBullets) ? rawBullets : [];

  const breadcrumbItems = [
    {
      label: (
        <span className="inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            home
          </span>
          <span>{t('common:nav.home')}</span>
        </span>
      ),
      href: ROUTES.HOME,
    },
    {
      label: t('common:nav.projects'),
      href: ROUTES.PROJECTS,
    },
    {
      label: projectTitle,
    },
  ];

  return (
    <div className="relative w-full bc-hero-wash overflow-x-clip py-6 lg:py-10 pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 lg:space-y-8">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Main 8 / 4 Asymmetric Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Primary Content Column */}
          <div className="lg:col-span-8 flex flex-col gap-8 lg:gap-10 min-w-0">
            <ProjectGallery
              project={project}
              onOpenLiveDemo={project.preview?.url?.trim() ? handleOpenLiveDemo : undefined}
            />

            <ProjectHeader
              project={project}
              selectedPackage={selectedPackage}
              guaranteeDays={guaranteeDays}
            />

            <ProjectSpecs project={project} />

            <DeliveryFaq />

            <ProjectReviews
              slug={project.slug}
              reviewsSummary={project.reviewsSummary}
            />
          </div>

          {/* Sticky Purchase Panel (Desktop Aside + Mobile Sticky Bottom Bar & Sheet) */}
          <PurchasePanel
            project={project}
            packages={activePackages}
            selectedPackage={selectedPackage}
            onSelectPackage={setSelectedPackageKey}
            onOpenLiveDemo={handleOpenLiveDemo}
            meta={meta}
            mobileSheetOpen={mobileSheetOpen}
            onOpenMobileSheet={() => setMobileSheetOpen(true)}
            onCloseMobileSheet={() => setMobileSheetOpen(false)}
          />
        </div>

        {/* Related Projects (Same Category) */}
        <RelatedProjects
          categoryKey={categoryKey}
          currentSlug={project.slug}
        />

        {/* Closing CTA Banner */}
        <CtaBanner
          title={t('projectDetails:cta.title')}
          description={t('projectDetails:cta.description')}
          primaryAction={{
            label: t('projectDetails:cta.primaryAction'),
            to: contactPath({ project: project.slug }),
            icon: 'rocket_launch',
          }}
          secondaryAction={{
            label: t('projectDetails:cta.secondaryAction'),
            to: ROUTES.PROJECTS,
            icon: 'grid_view',
          }}
          features={ctaBullets}
          className="pt-4"
        />
      </div>

      {/* Live Preview Modal (when preview.mode === 'iframe') */}
      {project.preview?.url?.trim() && project.preview?.mode !== 'external' && (
        <LivePreviewModal
          isOpen={livePreviewOpen}
          onClose={() => setLivePreviewOpen(false)}
          project={project}
        />
      )}
    </div>
  );
}
