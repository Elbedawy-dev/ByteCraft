import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMeta } from '../../api/meta';

export function ContactValueProps() {
  const { t } = useTranslation('contact');
  const { data: meta } = useMeta();
  const guaranteeDays = meta?.guaranteeDays ?? 30;

  const items = [
    {
      key: 'cleanCode',
      icon: 'code_blocks',
      accentClass: 'bc-chip-mint',
      title: t('valueProps.cleanCode.title'),
      description: t('valueProps.cleanCode.description'),
    },
    {
      key: 'speed',
      icon: 'speed',
      accentClass: 'bc-chip-sky',
      title: t('valueProps.speed.title'),
      description: t('valueProps.speed.description'),
    },
    {
      key: 'support',
      icon: 'support_agent',
      accentClass: 'bc-chip-violet',
      title: t('valueProps.support.title', { days: guaranteeDays }),
      description: t('valueProps.support.description'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-4">
      {items.map((item) => (
        <div
          key={item.key}
          className="bg-card border border-card-border shadow-card rounded-xl p-5 sm:p-6 flex items-start gap-4"
        >
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.accentClass}`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {item.icon}
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface">
              {item.title}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
