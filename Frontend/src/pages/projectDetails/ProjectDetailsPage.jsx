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
import { Reveal } from '../../components/ui/Motion';
import { ProjectTitleBar } from '../../features/projectDetails/components/ProjectHeader';
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
          <span className="material-symbols-rounded text-[16px]" aria-hidden="true">
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
    <div className="relative w-full overflow-x-clip pb-20 lg:pb-0">
      <div className="w-full bc-hero-wash pt-8 lg:pt-12 pb-8 border-b border-outline-variant">
        <div className="max-w-container mx-auto px-4 sm:px-6 space-y-5">
          <Breadcrumbs items={breadcrumbItems} />
          <ProjectTitleBar project={project} />
        </div>
      </div>

      <div className="max-w-container mx-auto px-4 sm:px-6 py-10 lg:py-14 space-y-12">
        {/* Main 8 / 4 Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Primary Content Column */}
          <div className="lg:col-span-8 flex flex-col gap-10 min-w-0">
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

            <Reveal>
              <DeliveryFaq />
            </Reveal>

            <Reveal>
              <ProjectReviews
                slug={project.slug}
                reviewsSummary={project.reviewsSummary}
              />
            </Reveal>
          </div>

          {/* Sticky Purchase Panel */}
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

        {/* Related Projects */}
        <RelatedProjects
          categoryKey={categoryKey}
          currentSlug={project.slug}
        />
      </div>

      {/* Closing CTA Band */}
      <CtaBanner
        title={t('projectDetails:cta.title')}
        description={t('projectDetails:cta.description')}
        primaryAction={{
          label: t('projectDetails:cta.primaryAction'),
          to: contactPath({ project: project.slug }),
          icon: 'arrow_forward',
        }}
        secondaryAction={{
          label: t('projectDetails:cta.secondaryAction'),
          to: ROUTES.PROJECTS,
        }}
        features={ctaBullets}
      />

      {/* Live Preview Modal */}
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
