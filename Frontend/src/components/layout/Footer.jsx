import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { useMeta } from '../../api/meta';
import { useCategories } from '../../api/projects';
import { useOwnerMe } from '../../api/owner/auth';
import { techBadges, footerQuickLinks } from '../../config/nav';
import { ROUTES } from '../../config/routes';
import { localized } from '../../lib/localized';

export function Footer() {
  const { t } = useTranslation('common');
  const { lang } = useLang();
  const { data: meta } = useMeta();
  const { data: rawCategories = [] } = useCategories();
  const { data: owner } = useOwnerMe();

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
  const email = (contact.email || '').trim();

  const hasCategories = categories.length > 0;

  return (
    <footer className="w-full bg-section-band border-t border-outline-variant text-on-surface-variant transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-outline-variant">
          {/* Col 1: Brand & Tech Badges */}
          <div className={hasCategories ? 'lg:col-span-4 space-y-4' : 'lg:col-span-5 space-y-4'}>
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-2.5 group w-fit select-none"
              aria-label="ByteCraft Home"
            >
              <div className="w-10 h-10 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[24px]">terminal</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-on-surface">
                  Byte<span className="text-primary">Craft</span>
                </span>
                <span className="text-[10px] font-mono tracking-wider text-on-surface-variant uppercase -mt-1">
                  Studio Engine
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm leading-relaxed">
              {t(
                'footer.description',
                { defaultValue: 'Custom web solutions & production-ready software platforms built with modern MERN architecture for maximum scalability.' }
              )}
            </p>

            {/* Tech Stack Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {techBadges.map((badge) => (
                <span
                  key={badge.name}
                  className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface border border-outline-variant text-on-surface-variant"
                >
                  {badge.name}
                </span>
              ))}
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className={hasCategories ? 'lg:col-span-2 space-y-3' : 'lg:col-span-3 space-y-3'}>
            <h4 className="text-sm font-semibold text-on-surface">
              {t('footer.quickLinks', { defaultValue: 'Quick Links' })}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {footerQuickLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    to={link.to}
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px] text-primary rtl:-scale-x-100" aria-hidden="true">
                      arrow_right_alt
                    </span>
                    <span>{t(`nav.${link.key}`, { defaultValue: link.defaultLabel })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Dynamic Service/Category Links (built from GET /api/categories, up to 4; hidden if none) */}
          {hasCategories && (
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-sm font-semibold text-on-surface">
                {t('footer.services', { defaultValue: lang === 'ar' ? 'الخدمات والتصنيفات' : 'Services & Platforms' })}
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                {categories.map((cat) => (
                  <li key={cat._id || cat.key}>
                    <Link
                      to={`${ROUTES.PROJECTS}?category=${encodeURIComponent(cat.key)}`}
                      className="hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px] text-primary rtl:-scale-x-100" aria-hidden="true">
                        arrow_right_alt
                      </span>
                      <span>{localized(cat.name, lang)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Col 4: Direct Contact & Availability */}
          <div className={hasCategories ? 'lg:col-span-3 space-y-4' : 'lg:col-span-4 space-y-4'}>
            <h4 className="text-sm font-semibold text-on-surface">
              {t('footer.contactChannels', { defaultValue: 'Direct Contact' })}
            </h4>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {t('footer.contactNote', { defaultValue: 'Ready to turn your idea into production-grade code.' })}
            </p>

            {/* Social & Contact channels - only rendered if value exists */}
            <div className="flex items-center gap-2">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-surface-container-high transition-all"
                  aria-label="WhatsApp"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </a>
              )}

              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-surface-container-high transition-all"
                  aria-label="GitHub"
                >
                  <span className="material-symbols-outlined text-[20px]">code</span>
                </a>
              )}

              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-surface-container-high transition-all"
                  aria-label="LinkedIn"
                >
                  <span className="material-symbols-outlined text-[20px]">work</span>
                </a>
              )}

              {email && (
                <a
                  href={`mailto:${email}`}
                  className="w-10 h-10 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-surface-container-high transition-all"
                  aria-label="Email"
                >
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </a>
              )}
            </div>

            {/* Availability Pill with pulsing dot */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface-variant">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span>{t('footer.available', { defaultValue: 'Available for new software projects' })}</span>
            </div>
          </div>
        </div>

        {/* Bottom bar: Copyright, public links & discreet owner entry */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
          <p>
            © {currentYear} {t('footer.copyright', { defaultValue: 'بايت كرافت (ByteCraft). جميع الحقوق محفوظة لمهندسي البرمجيات.' })}
          </p>

          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-primary transition-colors">
              {t('nav.about', { defaultValue: 'عن بايت كرافت' })}
            </Link>
            <span className="text-muted" aria-hidden="true">•</span>
            <Link to="/contact" className="hover:text-primary transition-colors">
              {t('nav.contact', { defaultValue: 'تواصل معنا' })}
            </Link>
            <span className="text-muted" aria-hidden="true">•</span>
            {/* Discreet Owner entry link with 44px touch target */}
            <Link
              to={owner ? ROUTES.OWNER : ROUTES.OWNER_LOGIN}
              className="min-h-[44px] min-w-[44px] inline-flex items-center text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              {owner
                ? (lang === 'ar' ? 'لوحة التحكم' : 'Dashboard')
                : (lang === 'ar' ? 'لوحة التحكم' : 'Owner login')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
