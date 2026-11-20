import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AboutHero } from '@/features/about/AboutHero';
import { AboutStats } from '@/features/about/AboutStats';
import { SkillsMatrix } from '@/features/about/SkillsMatrix';
import { DevelopmentLifecycle } from '@/features/about/DevelopmentLifecycle';

export default function AboutPage() {
  const { t } = useTranslation('about');

  useEffect(() => {
    document.title = t('meta.title');
  }, [t]);

  return (
    <div className="flex flex-col w-full bg-surface-container-lowest">
      <AboutHero />
      <AboutStats />
      <SkillsMatrix />
      <DevelopmentLifecycle />
    </div>
  );
}
