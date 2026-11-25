import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/app/providers';
import { fade, slideFromEnd } from '@/lib/motion';
import { Reveal } from '@/components/ui/Motion';
import { HeroCubes, TwoToneText } from '@/components/shared';

export function MarketplaceHeader() {
  const { t } = useTranslation('marketplace');
  const { dir } = useLang();

  return (
    <header className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
      <Reveal variants={fade} className="lg:col-span-8 space-y-3 min-w-0">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-soft border border-chip-mint-border text-brand-soft-text text-xs font-semibold max-w-full">
          <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
          <bdi dir="ltr" className="truncate">
            {t('header.eyebrow')}
          </bdi>
        </span>

        <h1 className="text-display-lg-mobile sm:text-headline-xl font-extrabold text-on-surface tracking-tight">
          <TwoToneText text={t('header.title')} />
        </h1>

        <p className="text-body-md text-muted max-w-[580px]">
          {t('header.subtitle')}
        </p>
      </Reveal>

      <Reveal variants={slideFromEnd} custom={dir} className="hidden lg:flex lg:col-span-4 justify-end">
        <HeroCubes className="w-56 xl:w-64 h-auto rtl:-scale-x-100 opacity-90 select-none pointer-events-none" />
      </Reveal>
    </header>
  );
}
