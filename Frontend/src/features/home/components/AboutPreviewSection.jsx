import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
import { BRAND } from '@/config/brand';
import { useLang } from '@/app/providers';
import { useFeaturedProjects, usePublicStats } from '@/api/home';
import { useMeta } from '@/api/meta';
import { formatNumber } from '@/lib/format';
import { slideFromEnd } from '@/lib/motion';
import { Button } from '@/components/ui';
import { MotionImage, Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';
import { SectionHeader, HeroCubes } from '@/components/shared';

export function AboutPreviewSection() {
  const { t } = useTranslation('home');
  const { dir } = useLang();
  const { data: featuredData } = useFeaturedProjects();
  const { data: meta } = useMeta();
  const { data: stats } = usePublicStats();
  const [imgFailed, setImgFailed] = useState(false);

  // Real image source priority: featured project thumbnail -> owner photo -> HeroCubes (never stock photo)
  const visualImage = useMemo(() => {
    const projects = featuredData?.projects || [];
    const withThumb = projects.find((p) => p?.thumbnailUrl && String(p.thumbnailUrl).trim());
    if (withThumb) {
      return {
        url: withThumb.thumbnailUrl.trim(),
        alt: BRAND.name,
      };
    }

    const ownerPhoto = (
      meta?.owner?.avatarUrl ||
      meta?.owner?.photoUrl ||
      meta?.ownerAvatar ||
      ''
    ).trim();

    if (ownerPhoto) {
      return {
        url: ownerPhoto,
        alt: BRAND.name,
      };
    }

    return null;
  }, [featuredData, meta]);

  // Real stats strip: hide any zero stat, hide entire strip if none > 0
  const visibleStats = useMemo(() => {
    if (!stats || typeof stats !== 'object') return [];
    const items = [];

    if (Number(stats.publishedProjects) > 0) {
      items.push({
        key: 'publishedProjects',
        icon: 'deployed_code',
        value: formatNumber(stats.publishedProjects),
        label: t('stats.publishedProjects'),
      });
    }

    if (Number(stats.deliveredOrders) > 0) {
      items.push({
        key: 'deliveredOrders',
        icon: 'verified',
        value: formatNumber(stats.deliveredOrders),
        label: t('stats.deliveredOrders'),
      });
    }

    if (Number(stats.reviewsCount) > 0) {
      items.push({
        key: 'reviewsCount',
        icon: 'forum',
        value: formatNumber(stats.reviewsCount),
        label: t('stats.reviewsCount'),
      });
    }

    if (Number(stats.reviewsAverage) > 0 && Number(stats.reviewsCount) > 0) {
      items.push({
        key: 'reviewsAverage',
        icon: 'workspace_premium',
        value: `${Number(stats.reviewsAverage).toFixed(1)}/5`,
        label: t('stats.reviewsAverage'),
      });
    }

    return items;
  }, [stats, t]);

  const statsGridCols = {
    1: 'sm:grid-cols-1 max-w-sm mx-auto',
    2: 'sm:grid-cols-2 max-w-2xl mx-auto',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[visibleStats.length] || 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section
      aria-labelledby="home-about-heading"
      className="w-full py-16 lg:py-24"
    >
      <div className="max-w-container mx-auto px-4 sm:px-6 space-y-14 lg:space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Start Column: Copy + CTA */}
          <Reveal className="lg:col-span-6 flex flex-col items-start text-start gap-5">
            <div id="home-about-heading">
              <SectionHeader
                align="start"
                badge={t('about.eyebrow')}
                title={t('about.title')}
                accent={t('about.titleAccent')}
                subtitle={t('about.description')}
              />
            </div>

            <p className="text-body-md text-on-surface-variant max-w-[540px]">
              {t('about.secondary')}
            </p>

            <div className="pt-1">
              <Link to={ROUTES.ABOUT}>
                <Button
                  variant="primary-gradient"
                  size="lg"
                  iconTrailing={
                    <span
                      className="material-symbols-rounded text-[19px] rtl:-scale-x-100"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  }
                >
                  {t('about.cta')}
                </Button>
              </Link>
            </div>
          </Reveal>

          {/* End Column: Angled-Cut Rounded Frame */}
          <Reveal variants={slideFromEnd} custom={dir} className="lg:col-span-6">
            <div className="relative mx-auto max-w-[540px]">
              {/* Translucent angled backing accent */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-3.5 -end-3.5 inset-4 rounded-3xl bg-gradient-to-br from-[#2B72CF]/18 to-[#5443A9]/22 dark:from-[#2B72CF]/20 dark:to-[#5443A9]/25"
              />

              <div className="relative aspect-[4/3] w-full rounded-3xl bc-angled-frame overflow-hidden border border-card-border bg-section-band shadow-card">
                {visualImage && !imgFailed ? (
                  <MotionImage
                    src={visualImage.url}
                    alt={visualImage.alt}
                    loading="lazy"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-section-band via-brand-soft/65 to-section-band p-6 sm:p-10">
                    <HeroCubes className="w-full max-w-[360px] h-auto rtl:-scale-x-100 select-none pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Real Stats Strip (hidden automatically when all stats are 0 or unavailable) */}
        {visibleStats.length > 0 && (
          <Reveal className="rounded-2xl bg-section-band border border-card-border p-6 sm:p-8">
            <Stagger
              className={clsx(
                'grid grid-cols-1 gap-6',
                statsGridCols
              )}
            >
              {visibleStats.map((stat) => (
                <StaggerItem
                  key={stat.key}
                  className="flex items-center gap-4 justify-start sm:justify-center"
                >
                  <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                    <span
                      className="material-symbols-rounded icon-gradient text-[26px]"
                      aria-hidden="true"
                    >
                      {stat.icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div
                      dir="ltr"
                      className="text-2xl sm:text-3xl font-extrabold font-mono text-on-surface leading-tight text-start"
                    >
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-muted mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
        )}
      </div>
    </section>
  );
}
