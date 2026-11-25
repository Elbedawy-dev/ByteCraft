import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/app/providers';
import { useMeta } from '@/api/meta';
import { localized } from '@/lib/localized';
import { ROUTES } from '@/config/routes';
import { slideFromEnd, fade } from '@/lib/motion';
import { Reveal } from '@/components/ui/Motion';
import { OwnerAvatar } from './OwnerAvatar';

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
  const { lang, dir } = useLang();
  const { data: meta } = useMeta();

  const contact = meta?.contact || {};
  const channels = buildContactChannels(contact, t);
  const locationText = localized(contact.location, lang) || t('owner.defaultLocation');

  const rawMethodItems = t('story.methodology.items', { returnObjects: true });
  const methodologyItems = Array.isArray(rawMethodItems) ? rawMethodItems : [];

  const rawOwnerTags = t('owner.tags', { returnObjects: true });
  const ownerTags = Array.isArray(rawOwnerTags) ? rawOwnerTags : [];

  return (
    <div className="relative w-full overflow-hidden bc-hero-wash py-14 lg:py-20 border-b border-outline-variant">
      <section className="max-w-container mx-auto px-4 sm:px-6 relative z-10">
        {/* Hero Eyebrow + Title (fade-only for immediate LCP) */}
        <Reveal variants={fade} viewport={{ once: true, amount: 0 }}>
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-soft border border-chip-mint-border text-brand-soft-text text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
              <span>{t('hero.eyebrow')}</span>
            </span>
          </div>

          {/* Two-tone Main H1 */}
          <h1 className="text-display-lg-mobile sm:text-headline-xl lg:text-display-lg font-extrabold text-on-surface max-w-4xl tracking-tight mb-12">
            {t('hero.titleBefore')}
            <span className="text-brand-gradient">
              {t('hero.titleHighlight')}
            </span>
            {t('hero.titleAfter')}
          </h1>
        </Reveal>

        {/* Split Layout: Story (7 cols) & Angled-Cut Founder Frame (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Start Column: Story, Mission & Methodology */}
          <Reveal className="lg:col-span-7 space-y-6">
            <article className="bg-card border border-card-border rounded-xl p-6 sm:p-7 shadow-card space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
                    code_blocks
                  </span>
                </div>
                <h2 className="text-headline-md font-bold text-on-surface">
                  {t('story.whoWeAre.title')}
                </h2>
              </div>
              <p className="text-body-md text-on-surface-variant">
                {t('story.whoWeAre.bodyBefore')}
                <bdi dir="ltr" className="font-mono text-primary font-semibold">
                  {t('story.whoWeAre.highlight')}
                </bdi>
                {t('story.whoWeAre.bodyAfter')}
              </p>
            </article>

            <article className="bg-card border border-card-border rounded-xl p-6 sm:p-7 shadow-card space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
                    rocket_launch
                  </span>
                </div>
                <h2 className="text-headline-md font-bold text-on-surface">
                  {t('story.mission.title')}
                </h2>
              </div>
              <p className="text-body-md text-on-surface-variant">
                {t('story.mission.body')}
              </p>
            </article>

            <article className="bg-card border border-card-border rounded-xl p-6 sm:p-7 shadow-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
                    verified
                  </span>
                </div>
                <h2 className="text-headline-md font-bold text-on-surface">
                  {t('story.methodology.title')}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {methodologyItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-section-band border border-card-border"
                  >
                    <span
                      className="material-symbols-rounded icon-gradient text-[24px] mb-2 block"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <h3 className="text-sm font-bold text-on-surface">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </Reveal>

          {/* End Column: Angled-Cut Frame + Founder Bio */}
          <Reveal as="aside" variants={slideFromEnd} custom={dir} className="lg:col-span-5 space-y-5">
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-3 -end-3 inset-4 rounded-3xl bg-gradient-to-br from-[#2B72CF]/18 to-[#5443A9]/22 dark:from-[#2B72CF]/20 dark:to-[#5443A9]/25"
              />
              <div className="group relative aspect-[4/3] w-full rounded-3xl bc-angled-frame overflow-hidden bg-section-band border border-card-border shadow-card">
                <OwnerAvatar
                  initials={t('owner.initials')}
                  alt={t('owner.photoAlt')}
                  variant="portrait"
                  badgeOffset
                />

                <div className="absolute top-3.5 start-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/95 backdrop-blur-md border border-card-border shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
                  <span className="text-xs text-primary font-semibold">
                    {t('owner.availabilityBadge')}
                  </span>
                </div>

                <div className="absolute bottom-3.5 inset-x-3.5 p-4 rounded-xl bg-card/95 backdrop-blur-md border border-card-border shadow-sm">
                  <h2 className="text-lg font-bold text-on-surface leading-snug">
                    {t('owner.name')}
                  </h2>
                  <p className="font-mono text-xs text-primary mt-0.5">
                    <bdi dir="ltr">{t('owner.role')}</bdi>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-rounded icon-gradient text-[22px]" aria-hidden="true">
                  military_tech
                </span>
                <span className="text-sm sm:text-base font-bold">
                  {t('owner.experience')}
                </span>
              </div>

              <p className="text-sm text-on-surface-variant leading-relaxed">
                {t('owner.bio')}
              </p>

              {ownerTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {ownerTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-brand-soft text-brand-soft-text font-mono text-xs font-semibold"
                    >
                      <bdi dir="ltr">{tag}</bdi>
                    </span>
                  ))}
                </div>
              )}

              {channels.length > 0 && (
                <div className="pt-3 border-t border-outline-variant">
                  <div className="text-xs font-semibold text-muted mb-2.5">
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
                        className="w-10 h-10 rounded-full bg-section-band border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-brand-soft transition-colors"
                      >
                        <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                          {ch.icon}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-outline-variant flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-xs text-muted">
                  {t('owner.locationPrefix')} {locationText}
                </span>

                <Link
                  to={ROUTES.CONTACT}
                  className="inline-flex items-center gap-1.5 min-h-[40px] text-sm font-bold text-primary hover:underline"
                >
                  <span>{t('owner.requestChat')}</span>
                  <span className="material-symbols-rounded text-[18px] rtl:-scale-x-100" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
