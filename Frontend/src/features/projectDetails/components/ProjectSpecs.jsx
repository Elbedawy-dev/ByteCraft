import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../app/providers';
import { localized } from '../../../lib/localized';

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
  return 'terminal';
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
      {/* Operational Features & Specs */}
      {features.length > 0 && (
        <section className="p-5 sm:p-6 rounded-xl bg-surface-container-low border border-outline-variant/60 space-y-5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                checklist
              </span>
            </div>
            <div>
              <h2 className="text-lg sm:text-headline-lg font-bold text-on-surface">
                {t('sections.featuresTitle')}
              </h2>
              <p className="text-xs sm:text-body-sm text-on-surface-variant">
                {t('sections.featuresSubtitle')}
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((featureText, idx) => (
              <li
                key={`${idx}-${featureText.slice(0, 16)}`}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container border border-outline-variant/40 hover:border-primary/30 transition-colors"
              >
                <span
                  className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </span>
                <span className="text-sm text-on-surface leading-relaxed">{featureText}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tech Stack Architecture Chips */}
      {techStack.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg sm:text-headline-lg font-bold text-on-surface">
            {t('sections.techStackTitle')}
          </h2>

          <ul className="flex flex-wrap items-center gap-2.5">
            {techStack.map((tech, idx) => (
              <li
                key={`${tech}-${idx}`}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/70 shadow-sm"
              >
                <span
                  className="material-symbols-outlined text-primary text-[18px]"
                  aria-hidden="true"
                >
                  {getTechIcon(tech)}
                </span>
                <bdi dir="ltr" className="font-label-code text-xs sm:text-sm font-semibold text-on-surface">
                  {tech}
                </bdi>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
