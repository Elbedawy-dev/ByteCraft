import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang } from '@/app/providers';
import { useMeta } from '@/api/meta';
import { localized } from '@/lib/localized';
import { ROUTES } from '@/config/routes';
import { OwnerAvatar } from './OwnerAvatar';

const ACCENT_ICON_TEXT = {
  primary: 'text-chip-mint-fg',
  secondary: 'text-chip-sky-fg',
  tertiary: 'text-chip-violet-fg',
};

function sanitizeExternalUrl(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return '';
}

function buildContactChannels(contact, t) {
  if (!contact || typeof contact !== 'object') return [];
  const socials = contact.socials || {};
  const channels = [];

  const whatsappDigits = typeof contact.whatsapp === 'string'
    ? contact.whatsapp.replace(/[^0-9]/g, '')
    : '';

  if (whatsappDigits) {
    channels.push({
      key: 'whatsapp',
      href: `https://wa.me/${whatsappDigits}`,
      external: true,
      icon: 'chat',
      label: t('owner.channels.whatsapp'),
    });
  }

  const githubUrl = sanitizeExternalUrl(socials.github);
  if (githubUrl) {
    channels.push({
      key: 'github',
      href: githubUrl,
      external: true,
      icon: 'code',
      label: t('owner.channels.github'),
    });
  }

  const linkedinUrl = sanitizeExternalUrl(socials.linkedin);
  if (linkedinUrl) {
    channels.push({
      key: 'linkedin',
      href: linkedinUrl,
      external: true,
      icon: 'work',
      label: t('owner.channels.linkedin'),
    });
  }

  const twitterUrl = sanitizeExternalUrl(socials.twitter);
  if (twitterUrl) {
    channels.push({
      key: 'twitter',
      href: twitterUrl,
      external: true,
      icon: 'alternate_email',
      label: t('owner.channels.twitter'),
    });
  }

  const facebookUrl = sanitizeExternalUrl(socials.facebook);
  if (facebookUrl) {
    channels.push({
      key: 'facebook',
      href: facebookUrl,
      external: true,
      icon: 'public',
      label: t('owner.channels.facebook'),
    });
  }

  if (typeof contact.email === 'string' && contact.email.trim()) {
    channels.push({
      key: 'email',
      href: `mailto:${contact.email.trim()}`,
      external: false,
      icon: 'mail',
      label: t('owner.channels.email'),
    });
  }

  if (typeof contact.phone === 'string' && contact.phone.trim()) {
    channels.push({
      key: 'phone',
      href: `tel:${contact.phone.trim().replace(/\s+/g, '')}`,
      external: false,
      icon: 'call',
      label: t('owner.channels.phone'),
    });
  }

  return channels;
}

export function AboutHero() {
  const { t } = useTranslation('about');
  const { lang } = useLang();
  const { data: meta } = useMeta();

  const contact = meta?.contact || {};
  const channels = buildContactChannels(contact, t);
  const locationText = localized(contact.location, lang) || t('owner.defaultLocation');

  const rawMethodItems = t('story.methodology.items', { returnObjects: true });
  const methodologyItems = Array.isArray(rawMethodItems) ? rawMethodItems : [];

  const rawOwnerTags = t('owner.tags', { returnObjects: true });
  const ownerTags = Array.isArray(rawOwnerTags) ? rawOwnerTags : [];

  return (
    <div className="relative w-full overflow-hidden bc-hero-wash">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
        {/* Eyebrow Pill + Hairline */}
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-card-border text-primary font-code text-label-code shadow-card">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span>{t('hero.eyebrow')}</span>
          </span>
          <span
            className="hidden sm:block h-px flex-1 max-w-xs bg-gradient-to-l from-primary/30 to-transparent"
            aria-hidden="true"
          />
        </div>

        {/* Main H1 */}
        <h1 className="text-display-lg-mobile sm:text-headline-xl lg:text-display-lg font-extrabold text-on-surface max-w-4xl tracking-tight mb-10 sm:mb-12">
          {t('hero.titleBefore')}
          <span className="text-primary dark:text-transparent dark:bg-clip-text dark:bg-primary-gradient">
            {t('hero.titleHighlight')}
          </span>
          {t('hero.titleAfter')}
        </h1>

        {/* Split Layout: Story (7 cols) & Founder Profile (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Start Column: Story, Mission & Methodology */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card: Who We Are */}
            <article className="bg-card border border-card-border rounded-xl p-6 sm:p-7 shadow-card relative overflow-hidden">
              <div
                className="absolute top-0 start-0 w-1.5 h-full bg-primary"
                aria-hidden="true"
              />
              <div className="flex items-center gap-2.5 mb-3 text-primary">
                <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                  terminal
                </span>
                <h2 className="text-headline-md font-bold text-on-surface">
                  {t('story.whoWeAre.title')}
                </h2>
              </div>
              <p className="text-body-md sm:text-body-lg text-on-surface-variant leading-relaxed">
                {t('story.whoWeAre.bodyBefore')}
                <bdi dir="ltr" className="font-code text-primary font-semibold">
                  {t('story.whoWeAre.highlight')}
                </bdi>
                {t('story.whoWeAre.bodyAfter')}
              </p>
            </article>

            {/* Card: Technical Mission */}
            <article className="bg-card border border-card-border rounded-xl p-6 sm:p-7 shadow-card relative overflow-hidden">
              <div
                className="absolute top-0 start-0 w-1.5 h-full bg-secondary"
                aria-hidden="true"
              />
              <div className="flex items-center gap-2.5 mb-3 text-secondary">
                <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                  rocket_launch
                </span>
                <h2 className="text-headline-md font-bold text-on-surface">
                  {t('story.mission.title')}
                </h2>
              </div>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {t('story.mission.body')}
              </p>
            </article>

            {/* Card: Methodology & Values */}
            <article className="bg-card border border-card-border rounded-xl p-6 sm:p-7 shadow-card">
              <h2 className="text-headline-md font-bold text-on-surface mb-5 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-tertiary text-[24px]" aria-hidden="true">
                  verified
                </span>
                <span>{t('story.methodology.title')}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {methodologyItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-surface border border-card-border"
                  >
                    <span
                      className={clsx(
                        'material-symbols-outlined text-[22px] mb-2 block',
                        ACCENT_ICON_TEXT[item.accent] || 'text-primary'
                      )}
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <h3 className="text-label-lg font-bold text-on-surface">
                      {item.title}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          {/* End Column: Founder Profile Card */}
          <aside className="lg:col-span-5">
            <div className="group relative bg-card border border-card-border rounded-xl p-4 sm:p-5 shadow-card transition-all duration-200 hover:bg-card-hover hover:border-card-hover-border hover:shadow-card-hover hover:-translate-y-0.5">
              {/* Square Portrait Frame */}
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-surface border border-card-border">
                <OwnerAvatar
                  initials={t('owner.initials')}
                  alt={t('owner.photoAlt')}
                  variant="portrait"
                  badgeOffset
                />

                {/* Floating Availability Pill */}
                <div className="absolute top-3 start-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/95 backdrop-blur-md border border-card-border shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" aria-hidden="true" />
                  <span className="text-label-md text-primary font-semibold">
                    {t('owner.availabilityBadge')}
                  </span>
                </div>

                {/* Overlay Nameplate */}
                <div className="absolute bottom-3 inset-x-3 p-3.5 rounded-lg bg-surface/95 backdrop-blur-md border border-card-border shadow-sm">
                  <h2 className="text-headline-md font-bold text-on-surface leading-snug">
                    {t('owner.name')}
                  </h2>
                  <p className="font-code text-label-code text-primary tracking-wide mt-0.5">
                    <bdi dir="ltr">{t('owner.role')}</bdi>
                  </p>
                </div>
              </div>

              {/* Bio Summary & Meta Contact Links */}
              <div className="mt-5 space-y-3.5 px-1">
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[20px]" aria-hidden="true">
                    military_tech
                  </span>
                  <span className="text-body-md font-semibold">
                    {t('owner.experience')}
                  </span>
                </div>

                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  {t('owner.bio')}
                </p>

                {/* Signature Tags */}
                {ownerTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ownerTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={clsx(
                          'px-2.5 py-1 rounded-full bg-surface border border-card-border font-code text-label-code',
                          idx === 1
                            ? 'text-secondary'
                            : idx === 2
                              ? 'text-primary'
                              : 'text-on-surface'
                        )}
                      >
                        <bdi dir="ltr">{tag}</bdi>
                      </span>
                    ))}
                  </div>
                )}

                {/* Contact & Social Channels from useMeta().contact */}
                {channels.length > 0 && (
                  <div className="pt-2 border-t border-card-border">
                    <div className="text-label-md text-on-surface-variant mb-2">
                      {t('owner.contactChannelsLabel')}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {channels.map((ch) => (
                        <a
                          key={ch.key}
                          href={ch.href}
                          target={ch.external ? '_blank' : undefined}
                          rel={ch.external ? 'noopener noreferrer' : undefined}
                          aria-label={ch.label}
                          className="w-11 h-11 rounded-xl bg-surface border border-card-border flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/60 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                            {ch.icon}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location & Request Chat Link */}
                <div className="pt-2 border-t border-outline-variant/40 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-code text-label-code text-on-surface-variant">
                    {t('owner.locationPrefix')} {locationText}
                  </span>

                  <Link
                    to={ROUTES.CONTACT}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-2 text-label-lg font-bold text-primary hover:text-secondary transition-colors"
                  >
                    <span>{t('owner.requestChat')}</span>
                    <span className="material-symbols-outlined text-[18px] rtl:-scale-x-100" aria-hidden="true">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
