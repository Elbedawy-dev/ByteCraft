import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../app/providers';
import { localized } from '../../../lib/localized';
import { Reveal, Stagger, StaggerItem } from '../../../components/ui/Motion';

const TECH_ICON_MAP = {
  react: 'deployed_code',
  'react.js': 'deployed_code',
  nextjs: 'bolt',
  'next.js': 'bolt',
  node: 'dns',
  'node.js': 'dns',
  express: 'hub',
  'express.js': 'hub',
  mongodb: 'database',
  mongoose: 'database',
  tailwind: 'style',
  tailwindcss: 'style',
  typescript: 'code',
  javascript: 'javascript',
  redis: 'memory',
  docker: 'inventory_2',
  aws: 'cloud',
};

function getTechIcon(techName) {
  const normalized = String(techName || '').trim().toLowerCase();
  for (const [key, icon] of Object.entries(TECH_ICON_MAP)) {
    if (normalized.includes(key)) return icon;
  }
  return 'code_blocks';
}

export function ProjectSpecs({ project }) {
  const { t } = useTranslation('projectDetails');
  const { lang } = useLang();

  const features = Array.isArray(project?.features)
    ? project.features.map((f) => localized(f, lang)).filter(Boolean)
    : [];

  const techStack = Array.isArray(project?.techStack)
    ? project.techStack.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  return (
    <>
      {/* 2-Column Gradient-Check Feature List */}
      {features.length > 0 && (
        <Reveal as="section" className="p-6 sm:p-7 rounded-xl bg-card border border-card-border shadow-card space-y-6">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
              <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
                checklist
              </span>
            </div>
            <div>
              <h2 className="text-lg sm:text-headline-lg font-bold text-on-surface">
                {t('sections.featuresTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                {t('sections.featuresSubtitle')}
              </p>
            </div>
          </div>

          <Stagger as="ul" className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {features.map((featureText, idx) => (
              <StaggerItem
                as="li"
                key={`${idx}-${featureText.slice(0, 16)}`}
                className="flex items-start gap-3 p-4 rounded-xl bg-section-band border border-card-border"
              >
                <span
                  className="material-symbols-rounded icon-gradient text-[20px] shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  check_circle
                </span>
                <span className="text-sm text-on-surface leading-relaxed font-medium">{featureText}</span>
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>
      )}

      {/* Tech Stack as Brand-Soft Pills */}
      {techStack.length > 0 && (
        <Reveal as="section" className="space-y-4">
          <h2 className="text-lg sm:text-headline-lg font-bold text-on-surface">
            {t('sections.techStackTitle')}
          </h2>

          <Stagger as="ul" className="flex flex-wrap items-center gap-2.5">
            {techStack.map((tech, idx) => (
              <StaggerItem
                as="li"
                key={`${tech}-${idx}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-soft border border-chip-mint-border text-brand-soft-text"
              >
                <span
                  className="material-symbols-rounded icon-gradient text-[18px]"
                  aria-hidden="true"
                >
                  {getTechIcon(tech)}
                </span>
                <bdi dir="ltr" className="font-mono text-xs sm:text-sm font-semibold">
                  {tech}
                </bdi>
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>
      )}
    </>
  );
}
