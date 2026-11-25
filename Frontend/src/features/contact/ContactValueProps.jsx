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
      title: t('valueProps.cleanCode.title'),
      description: t('valueProps.cleanCode.description'),
    },
    {
      key: 'speed',
      icon: 'rocket_launch',
      title: t('valueProps.speed.title'),
      description: t('valueProps.speed.description'),
    },
    {
      key: 'support',
      icon: 'support_agent',
      title: t('valueProps.support.title', { days: guaranteeDays }),
      description: t('valueProps.support.description'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item) => (
        <div
          key={item.key}
          className="bg-card border border-card-border shadow-card rounded-xl p-6 flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
            <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
              {item.icon}
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface">
              {item.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
