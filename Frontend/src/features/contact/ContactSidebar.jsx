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
  const githubUrl = (contact.github || socials.github || '').trim();
  const linkedinUrl = (contact.linkedin || socials.linkedin || '').trim();

  const locationText =
    localized(contact.location, lang) || t('sidebar.defaultLocation');

  const hasAnyChannel = Boolean(
    whatsappHref || email || showSeparatePhone || githubUrl || linkedinUrl
  );

  return (
    <aside className="lg:col-span-5 space-y-6 order-2 lg:order-1">
      {/* Soft Info Card with Contact Channels (hide empty ones) */}
      <div className="bg-section-band border border-card-border rounded-2xl p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="px-3.5 py-1 rounded-full bg-brand-soft text-brand-soft-text text-xs font-semibold">
            {t('sidebar.channelsEyebrow')}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
            <span>{t('sidebar.availableNow')}</span>
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3" aria-hidden="true">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* WhatsApp */}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group bc-card-hover flex items-start gap-4 p-4 rounded-xl"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
                    chat
                  </span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-sm sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                      {t('sidebar.whatsappTitle')}
                    </span>
                    <span className="material-symbols-rounded text-primary text-[18px] rtl:-scale-x-100" aria-hidden="true">
                      arrow_outward
                    </span>
                  </div>
                  <span className="font-mono text-sm text-on-surface mt-0.5 truncate">
                    <bdi dir="ltr">{whatsappRaw}</bdi>
                  </span>
                  <span className="text-xs text-muted mt-1">
                    {t('sidebar.whatsappNote')}
                  </span>
                </div>
              </a>
            )}

            {/* Official Email */}
            {email && (
              <a
                href={`mailto:${email}`}
                className="group bc-card-hover flex items-start gap-4 p-4 rounded-xl"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
                    mail
                  </span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-sm sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                      {t('sidebar.emailTitle')}
                    </span>
                    <span className="material-symbols-rounded text-muted text-[18px] rtl:-scale-x-100" aria-hidden="true">
                      arrow_outward
                    </span>
                  </div>
                  <span className="font-mono text-sm text-on-surface mt-0.5 truncate">
                    <bdi dir="ltr">{email}</bdi>
                  </span>
                  <span className="text-xs text-muted mt-1">
                    {t('sidebar.emailNote')}
                  </span>
                </div>
              </a>
            )}

            {/* Separate Phone */}
            {showSeparatePhone && (
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="group bc-card-hover flex items-start gap-4 p-4 rounded-xl"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
                    call
                  </span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                    {t('sidebar.phoneTitle')}
                  </span>
                  <span className="font-mono text-sm text-on-surface mt-0.5 truncate">
                    <bdi dir="ltr">{phone}</bdi>
                  </span>
                  <span className="text-xs text-muted mt-1">
                    {t('sidebar.phoneNote')}
                  </span>
                </div>
              </a>
            )}

            {/* GitHub & LinkedIn */}
            {(githubUrl || linkedinUrl) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-xl bc-card-hover flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center">
                        <span className="material-symbols-rounded icon-gradient text-[20px]" aria-hidden="true">
                          code_blocks
                        </span>
                      </div>
                      <span className="material-symbols-rounded text-muted group-hover:text-primary text-[16px] rtl:-scale-x-100" aria-hidden="true">
                        north_east
                      </span>
                    </div>
                    <div className="mt-3">
                      <span className="text-sm font-bold text-on-surface block">
                        {t('sidebar.githubTitle')}
                      </span>
                      <span className="text-xs text-muted mt-0.5 block">
                        {t('sidebar.githubSubtitle')}
                      </span>
                    </div>
                  </a>
                )}

                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-xl bc-card-hover flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center">
                        <span className="material-symbols-rounded icon-gradient text-[20px]" aria-hidden="true">
                          work
                        </span>
                      </div>
                      <span className="material-symbols-rounded text-muted group-hover:text-primary text-[16px] rtl:-scale-x-100" aria-hidden="true">
                        north_east
                      </span>
                    </div>
                    <div className="mt-3">
                      <span className="text-sm font-bold text-on-surface block">
                        {t('sidebar.linkedinTitle')}
                      </span>
                      <span className="text-xs text-muted mt-0.5 block">
                        {t('sidebar.linkedinSubtitle')}
                      </span>
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Location row inside soft info card */}
            <div className={hasAnyChannel ? 'pt-4 border-t border-outline-variant space-y-3' : 'space-y-3'}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
                    location_on
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-muted block">
                    {t('sidebar.locationLabel')}
                  </span>
                  <span className="text-sm sm:text-base text-on-surface font-bold block truncate">
                    {locationText}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-card-border text-xs sm:text-sm text-on-surface-variant flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
                <span>{t('sidebar.availabilityNote')}</span>
              </div>
            </div>
          </div>
        )}

        {/* NDA / IP Protection Note */}
        <div className="pt-4 border-t border-outline-variant space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-rounded icon-gradient text-[20px]" aria-hidden="true">
              verified_user
            </span>
            <h3 className="text-sm font-bold text-on-surface">
              {t('sidebar.ndaTitle')}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            {t('sidebar.ndaBody')}
          </p>
        </div>
      </div>
    </aside>
  );
}
