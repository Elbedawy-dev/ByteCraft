import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { useMeta } from '../../api/meta';
import { useCategories } from '../../api/projects';
import { useAuth } from '../../features/auth';
import { footerQuickLinks } from '../../config/nav';
import { ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';
import { localized } from '../../lib/localized';
import { BrandLogo } from '../shared/LogoMark';

export function Footer() {
  const { t } = useTranslation('common');
  const { lang } = useLang();
  const { data: meta } = useMeta();
  const { data: rawCategories = [] } = useCategories();
  const { isAuthenticated, isAdmin } = useAuth();

  const currentYear = new Date().getFullYear();
  const contact = meta?.contact || {};
  const socials = contact.socials || {};

  const categories = Array.isArray(rawCategories)
    ? rawCategories.filter((c) => c && c.isActive !== false).slice(0, 4)
    : [];

  const whatsappRaw = (contact.whatsapp || '').trim();
  const whatsappDigits = whatsappRaw.replace(/[^0-9]/g, '');
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : '';

  const githubUrl = (contact.github || socials.github || '').trim();
  const linkedinUrl = (contact.linkedin || socials.linkedin || '').trim();
  const twitterUrl = (contact.twitter || contact.x || socials.twitter || socials.x || '').trim();
  const facebookUrl = (contact.facebook || socials.facebook || '').trim();
  const instagramUrl = (contact.instagram || socials.instagram || '').trim();
  const email = (contact.email || '').trim();

  const socialItems = [
    whatsappHref && { key: 'whatsapp', href: whatsappHref, label: t('footer.channels.whatsapp', { defaultValue: 'WhatsApp' }), icon: 'chat', external: true },
    githubUrl && { key: 'github', href: githubUrl, label: t('footer.channels.github', { defaultValue: 'GitHub' }), icon: 'code', external: true },
    linkedinUrl && { key: 'linkedin', href: linkedinUrl, label: t('footer.channels.linkedin', { defaultValue: 'LinkedIn' }), icon: 'work', external: true },
    twitterUrl && { key: 'twitter', href: twitterUrl, label: t('footer.channels.twitter', { defaultValue: 'X / Twitter' }), icon: 'share', external: true },
    facebookUrl && { key: 'facebook', href: facebookUrl, label: t('footer.channels.facebook', { defaultValue: 'Facebook' }), icon: 'public', external: true },
    instagramUrl && { key: 'instagram', href: instagramUrl, label: 'Instagram', icon: 'photo_camera', external: true },
    email && { key: 'email', href: `mailto:${email}`, label: t('footer.channels.email', { defaultValue: 'Email' }), icon: 'mail', external: false },
  ].filter(Boolean);

  const hasCategories = categories.length > 0;
  const hasSocials = socialItems.length > 0;

  return (
    <footer className="relative w-full bg-navy text-navy-text overflow-hidden mt-auto">
      {/* Subtle angled translucent corner decorations like the reference */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -start-16 w-72 h-72 rotate-12 rounded-3xl bg-gradient-to-br from-[#2B72CF]/15 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -end-16 w-80 h-80 -rotate-12 rounded-3xl bg-gradient-to-tl from-[#5443A9]/20 to-transparent"
      />

      <div className="relative z-10 max-w-container mx-auto px-4 sm:px-6 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-10 border-b border-navy-border">
          {/* Col 1: BrandLogo tone="light" + Tagline */}
          <div className={hasCategories ? 'lg:col-span-4 space-y-4' : 'lg:col-span-5 space-y-4'}>
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center w-fit select-none"
              aria-label={`${BRAND.name} Home`}
            >
              <BrandLogo tone="light" size="md" />
            </Link>

            <p className="text-sm font-semibold text-white/95">
              {t('footer.tagline', {
                defaultValue: lang === 'ar' ? 'ابنِ بذكاء. انمُ بسرعة.' : 'Build Smarter. Grow Faster.',
              })}
            </p>

            <p className="text-sm text-navy-text max-w-sm leading-relaxed">
              {t('footer.description', {
                defaultValue:
                  'Custom web solutions & production-ready software platforms built with modern MERN architecture for maximum scalability.',
              })}
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className={hasCategories ? 'lg:col-span-2 space-y-3.5' : 'lg:col-span-3 space-y-3.5'}>
            <h2 className="text-sm font-bold text-white tracking-wide">
              {t('footer.quickLinks', { defaultValue: 'Quick Links' })}
            </h2>
            <ul className="space-y-2.5 text-sm">
              {footerQuickLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    to={link.to}
                    className="text-navy-text hover:text-white transition-colors duration-300 inline-flex items-center gap-1.5"
                  >
                    <span>
                      {t(link.labelKey || `nav.${link.key}`, {
                        defaultValue:
                          lang === 'ar' ? link.defaultLabel : 'Custom Build Request',
                      })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Dynamic Categories (hidden if empty) */}
          {hasCategories && (
            <div className="lg:col-span-3 space-y-3.5">
              <h2 className="text-sm font-bold text-white tracking-wide">
                {t('footer.services', {
                  defaultValue: lang === 'ar' ? 'الخدمات والتصنيفات' : 'Services & Platforms',
                })}
              </h2>
              <ul className="space-y-2.5 text-sm">
                {categories.map((cat) => (
                  <li key={cat._id || cat.key}>
                    <Link
                      to={`${ROUTES.PROJECTS}?category=${encodeURIComponent(cat.key)}`}
                      className="text-navy-text hover:text-white transition-colors duration-300 inline-flex items-center gap-1.5"
                    >
                      <span>{localized(cat.name, lang)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Col 4: Follow Us / Contact Channels */}
          <div className={hasCategories ? 'lg:col-span-3 space-y-4' : 'lg:col-span-4 space-y-4'}>
            <h2 className="text-sm font-bold text-white tracking-wide">
              {t('footer.followUs', {
                defaultValue: lang === 'ar' ? 'تابعنا وتواصل معنا' : 'Follow Us',
              })}
            </h2>
            <p className="text-sm text-navy-text leading-relaxed">
              {t('footer.contactNote', {
                defaultValue: 'Ready to turn your idea into production-grade software.',
              })}
            </p>

            {hasSocials && (
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {socialItems.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    aria-label={item.label}
                    className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-primary-gradient hover:border-transparent transition-all duration-300"
                  >
                    <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                      {item.icon}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar: Copyright & discreet Owner link */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-navy-text">
          <p>
            © {currentYear} {BRAND.wordmark}.{' '}
            {t('footer.copyright', {
              defaultValue: lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.',
            })}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-1">
            <Link to={ROUTES.ABOUT} className="min-h-[44px] inline-flex items-center hover:text-white transition-colors duration-300">
              {t('nav.about', { defaultValue: 'About' })}
            </Link>
            <span className="text-navy-text/50" aria-hidden="true">•</span>
            <Link to={ROUTES.CONTACT} className="min-h-[44px] inline-flex items-center hover:text-white transition-colors duration-300">
              {t('nav.contact', { defaultValue: 'Contact' })}
            </Link>
            <span className="text-navy-text/50" aria-hidden="true">•</span>
            {isAuthenticated ? (
              <>
                <Link
                  to={ROUTES.ACCOUNT}
                  className="min-h-[44px] inline-flex items-center text-xs text-navy-text hover:text-white transition-colors duration-300"
                >
                  {t('nav.userMenu.account', { defaultValue: 'My account' })}
                </Link>
                {isAdmin && (
                  <>
                    <span className="text-navy-text/50" aria-hidden="true">•</span>
                    <Link
                      to={ROUTES.OWNER_DASHBOARD}
                      className="min-h-[44px] inline-flex items-center text-xs text-navy-text hover:text-white transition-colors duration-300"
                    >
                      {t('nav.userMenu.dashboard', { defaultValue: 'Dashboard' })}
                    </Link>
                  </>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 min-h-[44px]">
                <Link
                  to={ROUTES.LOGIN}
                  className="min-h-[44px] inline-flex items-center text-xs text-navy-text hover:text-white transition-colors duration-300"
                >
                  {t('nav.login', { defaultValue: 'Login' })}
                </Link>
                <span className="text-navy-text/50" aria-hidden="true">/</span>
                <Link
                  to={ROUTES.REGISTER}
                  className="min-h-[44px] inline-flex items-center text-xs text-navy-text hover:text-white transition-colors duration-300"
                >
                  {t('nav.register', { defaultValue: 'Create account' })}
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
