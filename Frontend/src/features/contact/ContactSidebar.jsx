import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMeta } from '../../api/meta';
import { useLang } from '../../app/providers';
import { localized } from '../../lib/localized';
import { Skeleton } from '../../components/ui';

export function ContactSidebar() {
  const { t } = useTranslation('contact');
  const { lang } = useLang();
  const { data: meta, isLoading } = useMeta();

  const contact = meta?.contact || {};
  const socials = contact.socials || {};

  const whatsappRaw = (contact.whatsapp || '').trim();
  const whatsappDigits = whatsappRaw.replace(/[^0-9]/g, '');
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : '';

  const email = (contact.email || '').trim();
  const phone = (contact.phone || '').trim();
  const showSeparatePhone = Boolean(phone && phone !== whatsappRaw);

  const locationText =
    localized(contact.location, lang) || t('sidebar.defaultLocation');

  return (
    <aside className="lg:col-span-5 space-y-5 order-2 lg:order-1">
      {/* Instant Support Channels */}
      <div className="bg-card border border-card-border shadow-card rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold text-primary tracking-wider uppercase">
            {t('sidebar.channelsEyebrow')}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-badge-green-text bg-badge-green-bg border border-primary/25 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
            <span>{t('sidebar.availableNow')}</span>
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3" aria-hidden="true">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* WhatsApp */}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 p-4 rounded-xl bg-surface border border-card-border shadow-sm hover:border-card-hover-border hover:bg-card-hover hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl btn-primary-gradient flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[26px]">chat</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                      {t('sidebar.whatsappTitle')}
                    </span>
                    <span className="material-symbols-outlined text-primary text-[18px] rtl:-scale-x-100">
                      arrow_outward
                    </span>
                  </div>
                  <span className="font-mono text-sm text-on-surface mt-0.5 truncate">
                    <bdi dir="ltr">{whatsappRaw}</bdi>
                  </span>
                  <span className="text-xs text-secondary mt-1">
                    {t('sidebar.whatsappNote')}
                  </span>
                </div>
              </a>
            )}

            {/* Official Email */}
            {email && (
              <a
                href={`mailto:${email}`}
                className="group flex items-start gap-4 p-4 rounded-xl bg-surface border border-card-border shadow-sm hover:border-card-hover-border hover:bg-card-hover hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bc-chip-mint border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">mail</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                      {t('sidebar.emailTitle')}
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px] rtl:-scale-x-100">
                      arrow_outward
                    </span>
                  </div>
                  <span className="font-mono text-sm text-on-surface mt-0.5 truncate">
                    <bdi dir="ltr">{email}</bdi>
                  </span>
                  <span className="text-xs text-on-surface-variant mt-1">
                    {t('sidebar.emailNote')}
                  </span>
                </div>
              </a>
            )}

            {/* Optional separate Phone card when distinct from WhatsApp */}
            {showSeparatePhone && (
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="group flex items-start gap-4 p-4 rounded-xl bg-surface border border-card-border shadow-sm hover:border-card-hover-border hover:bg-card-hover hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bc-chip-sky border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">call</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                    {t('sidebar.phoneTitle')}
                  </span>
                  <span className="font-mono text-sm text-on-surface mt-0.5 truncate">
                    <bdi dir="ltr">{phone}</bdi>
                  </span>
                  <span className="text-xs text-on-surface-variant mt-1">
                    {t('sidebar.phoneNote')}
                  </span>
                </div>
              </a>
            )}

            {/* GitHub & LinkedIn Cards */}
            {(socials.github || socials.linkedin) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {socials.github && (
                  <a
                    href={socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-xl bg-surface border border-card-border shadow-sm hover:border-card-hover-border hover:bg-card-hover hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col justify-between transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="material-symbols-outlined text-primary text-[22px]">
                        terminal
                      </span>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[16px] rtl:-scale-x-100">
                        north_east
                      </span>
                    </div>
                    <div className="mt-3">
                      <span className="text-sm font-bold text-on-surface block">
                        {t('sidebar.githubTitle')}
                      </span>
                      <span className="text-xs text-on-surface-variant mt-0.5 block">
                        {t('sidebar.githubSubtitle')}
                      </span>
                    </div>
                  </a>
                )}

                {socials.linkedin && (
                  <a
                    href={socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-xl bg-surface border border-card-border shadow-sm hover:border-card-hover-border hover:bg-card-hover hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col justify-between transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="material-symbols-outlined text-secondary text-[22px]">
                        work
                      </span>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary text-[16px] rtl:-scale-x-100">
                        north_east
                      </span>
                    </div>
                    <div className="mt-3">
                      <span className="text-sm font-bold text-on-surface block">
                        {t('sidebar.linkedinTitle')}
                      </span>
                      <span className="text-xs text-on-surface-variant mt-0.5 block">
                        {t('sidebar.linkedinSubtitle')}
                      </span>
                    </div>
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location & Availability */}
      <div className="bg-card border border-card-border shadow-card rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-badge-green-bg border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[22px]">location_on</span>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-on-surface-variant block">
              {t('sidebar.locationLabel')}
            </span>
            {isLoading ? (
              <Skeleton className="h-5 w-40 mt-1" />
            ) : (
              <span className="text-sm sm:text-base text-on-surface font-bold block truncate">
                {locationText}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-surface border border-card-border text-primary text-xs sm:text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
          <span>{t('sidebar.availabilityNote')}</span>
        </div>

        {/* Neutral Architectural Studio Visual (Zero hotlinked images) */}
        <div
          className="relative h-36 rounded-xl overflow-hidden bg-surface border border-card-border flex flex-col justify-between p-4"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgb(var(--bc-outline-variant)) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--bc-outline-variant)) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute -bottom-8 -end-8 w-36 h-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-badge-green-bg border border-primary/25 font-mono text-[11px] text-badge-green-text">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <bdi dir="ltr">{t('sidebar.gridTag')}</bdi>
            </span>
            <span className="material-symbols-outlined text-primary text-[22px]" aria-hidden="true">
              hub
            </span>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-xs text-on-surface-variant font-mono">
            <span className="material-symbols-outlined text-[16px] text-primary">
              public
            </span>
            <span>{locationText}</span>
          </div>
        </div>
      </div>

      {/* NDA / IP Protection Card */}
      <div className="bg-card border border-card-border shadow-card rounded-xl p-5 sm:p-6 space-y-2.5">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-[22px]">verified_user</span>
          <h3 className="text-sm sm:text-base font-bold text-on-surface">
            {t('sidebar.ndaTitle')}
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          {t('sidebar.ndaBody')}
        </p>
      </div>
    </aside>
  );
}
