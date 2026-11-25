import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../app/providers';
import { localized } from '../../../lib/localized';
import { formatMoney } from '../../../lib/money';
import { checkoutPath, contactPath } from '../../../config/routes';
import { Button } from '../../../components/ui/Button';
import { PriceTag } from '../../../components/shared/PriceTag';
import { AccessibleDialog } from './AccessibleDialog';
import { DemoCredentialsCard } from './DemoCredentialsCard';

function getDiscountPercent(price, compareAtPrice) {
  if (!compareAtPrice || compareAtPrice <= price || compareAtPrice <= 0) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

function PackageCardsList({ packages, selectedKey, onSelect, lang, t }) {
  return (
    <div
      role="radiogroup"
      aria-label={t('packages.selectPackageLabel')}
      className="space-y-2.5"
    >
      {packages.map((pkg) => {
        const isSelected = pkg.key === selectedKey;
        const pkgName = localized(pkg.name, lang) || pkg.key;
        const hasDiscount = pkg.compareAtPrice && pkg.compareAtPrice > pkg.price;
        const discountPercent = hasDiscount ? getDiscountPercent(pkg.price, pkg.compareAtPrice) : 0;
        const licenseLabel =
          pkg.licenseType === 'multi'
            ? t('packages.multiLicense')
            : t('packages.singleLicense');

        return (
          <button
            key={pkg.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(pkg.key)}
            className={clsx(
              'w-full text-start rounded-xl p-4 border transition-all duration-300 ease-nexus flex flex-col gap-2',
              isSelected
                ? 'bg-brand-soft/45 border-primary ring-2 ring-primary/25 shadow-sm'
                : 'bg-card border-card-border hover:border-card-hover-border hover:bg-section-band/60'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  aria-hidden="true"
                  className={clsx(
                    'mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors bg-input',
                    isSelected ? 'border-primary' : 'border-control-border'
                  )}
                >
                  {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-sm text-on-surface">{pkgName}</span>
                    {pkg.isPopular && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold btn-primary-gradient text-white">
                        {t('badges.popular')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-end shrink-0">
                <div className="font-mono font-extrabold text-sm sm:text-base text-primary whitespace-nowrap">
                  {formatMoney(pkg.price, lang)}
                </div>
                {hasDiscount && (
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="font-mono text-xs text-muted line-through whitespace-nowrap">
                      {formatMoney(pkg.compareAtPrice, lang)}
                    </span>
                    {discountPercent > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-soft text-brand-soft-text whitespace-nowrap">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 ps-7 text-[11px] text-on-surface-variant">
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary" aria-hidden="true">
                  verified_user
                </span>
                <span>{licenseLabel}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-secondary" aria-hidden="true">
                  support_agent
                </span>
                <span>{t('packages.supportBadge', { days: pkg.supportDays ?? 30 })}</span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SelectedPackageFeatures({ selectedPackage, lang, t }) {
  const pkgFeatures = Array.isArray(selectedPackage?.features)
    ? selectedPackage.features.map((f) => localized(f, lang)).filter(Boolean)
    : [];

  return (
    <div className="space-y-2.5">
      <span className="block text-xs font-bold text-on-surface-variant">
        {t('packages.includedFeatures')}
      </span>
      {pkgFeatures.length > 0 ? (
        <ul className="space-y-2">
          {pkgFeatures.map((feat, idx) => (
            <li key={`${idx}-${feat.slice(0, 12)}`} className="flex items-start gap-2 text-xs sm:text-sm text-on-surface">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5" aria-hidden="true">
                check_circle
              </span>
              <span className="leading-relaxed">{feat}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]" aria-hidden="true">
            check_circle
          </span>
          <span>{t('packages.noFeatures')}</span>
        </p>
      )}
    </div>
  );
}

export function PurchasePanel({
  project,
  packages,
  selectedPackage,
  onSelectPackage,
  onOpenLiveDemo,
  meta,
  mobileSheetOpen,
  onOpenMobileSheet,
  onCloseMobileSheet,
}) {
  const { t } = useTranslation('projectDetails');
  const { lang } = useLang();

  const hasPreview = Boolean(project?.preview?.url?.trim());
  const isExternalDemo = project?.preview?.mode === 'external';
  const guaranteeDays = selectedPackage?.supportDays ?? meta?.guaranteeDays ?? 30;
  const whatsappRaw = meta?.contact?.whatsapp || '';
  const whatsappDigits = whatsappRaw.replace(/[^0-9]/g, '');
  const selectedName = selectedPackage ? localized(selectedPackage.name, lang) : '';
  const hasCompareAt =
    selectedPackage?.compareAtPrice && selectedPackage.compareAtPrice > selectedPackage.price;

  const checkoutUrl = selectedPackage
    ? checkoutPath({ project: project.slug, packageKey: selectedPackage.key })
    : contactPath({ project: project.slug });

  return (
    <>
      {/* Desktop Sticky Sidebar Purchase Panel (>= lg) */}
      <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 space-y-4">
        <div className="rounded-2xl bg-card border border-card-border shadow-card p-6 sm:p-7 space-y-5">
          {/* Top Badges */}
          {selectedPackage && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full bg-brand-soft text-brand-soft-text border border-chip-mint-border text-xs font-bold">
                {selectedPackage.licenseType === 'multi'
                  ? t('packages.multiLicense')
                  : t('packages.singleLicense')}
              </span>
              <div className="flex items-center gap-1 text-muted font-mono text-xs">
                <span className="material-symbols-rounded text-[16px] text-primary" aria-hidden="true">
                  sync
                </span>
                <span>{t('packages.supportBadge', { days: selectedPackage.supportDays ?? 30 })}</span>
              </div>
            </div>
          )}

          {/* Package Selector Cards */}
          {packages.length > 0 ? (
            <>
              <div className="space-y-2.5">
                <span className="block text-xs font-semibold text-muted">
                  {t('packages.choosePackage')}
                </span>
                <PackageCardsList
                  packages={packages}
                  selectedKey={selectedPackage?.key}
                  onSelect={onSelectPackage}
                  lang={lang}
                  t={t}
                />
              </div>

              {/* Active Price Summary Soft Band */}
              {selectedPackage && (
                <div className="p-4 rounded-xl bg-section-band border border-card-border flex items-baseline justify-between gap-3">
                  <span className="font-bold text-sm text-on-surface">{selectedName}</span>
                  <PriceTag
                    piasters={selectedPackage.price}
                    originalPiasters={hasCompareAt ? selectedPackage.compareAtPrice : undefined}
                    size="lg"
                  />
                </div>
              )}

              {/* Selected Package Features */}
              {selectedPackage && (
                <SelectedPackageFeatures
                  selectedPackage={selectedPackage}
                  lang={lang}
                  t={t}
                />
              )}
            </>
          ) : (
            <div className="p-4 rounded-xl bg-section-band text-sm text-muted text-center">
              {t('packages.unavailable')}
            </div>
          )}

          {/* Primary Actions: Gradient "Buy" & Outline "Live demo" */}
          <div className="space-y-2.5 pt-1">
            <Link to={checkoutUrl} className="block w-full">
              <Button
                variant="primary-gradient"
                size="lg"
                className="w-full"
                iconTrailing={
                  <span className="material-symbols-rounded text-[20px] rtl:-scale-x-100" aria-hidden="true">
                    arrow_forward
                  </span>
                }
              >
                {selectedPackage ? t('packages.buyNow') : t('supportCard.contactAction')}
              </Button>
            </Link>

            {hasPreview && (
              <Button
                variant="outline"
                size="md"
                onClick={onOpenLiveDemo}
                className="w-full"
                iconLeading={
                  <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                    {isExternalDemo ? 'open_in_new' : 'desktop_windows'}
                  </span>
                }
              >
                {isExternalDemo ? t('packages.openExternalDemo') : t('packages.liveDemo')}
              </Button>
            )}
          </div>

          {/* Demo Credentials (shown only when preview URL + credentials/note exist) */}
          <DemoCredentialsCard preview={project.preview} />

          {/* Trust Bullets */}
          <div className="p-3.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/50 space-y-2.5">
            <div className="flex items-start gap-2 text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0" aria-hidden="true">
                verified
              </span>
              <span>{t('trust.guarantee', { days: guaranteeDays })}</span>
            </div>
            <div className="flex items-start gap-2 text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-secondary text-[18px] shrink-0" aria-hidden="true">
                code
              </span>
              <span>{t('trust.cleanCode')}</span>
            </div>
            <div className="flex items-start gap-2 text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0" aria-hidden="true">
                headset_mic
              </span>
              <span>{t('trust.consultation')}</span>
            </div>
          </div>

          {/* Custom Modification Link */}
          <div className="pt-1 text-center">
            <Link
              to={contactPath({ project: project.slug })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>{t('trust.customPrompt')}</span>
              <span className="material-symbols-outlined text-[16px] rtl:-scale-x-100" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>

        {/* Direct Technical Support Mini-Card */}
        <div className="p-4 rounded-xl bg-card border border-card-border shadow-card flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-badge-green-bg border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              contact_support
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-on-surface">{t('supportCard.title')}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              {t('supportCard.description')}
            </p>
            {whatsappDigits ? (
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs font-bold hover:underline inline-flex items-center gap-1 mt-2"
              >
                <span>{t('supportCard.whatsappAction')}</span>
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                  open_in_new
                </span>
              </a>
            ) : (
              <Link
                to={contactPath({ project: project.slug })}
                className="text-primary text-xs font-bold hover:underline inline-flex items-center gap-1 mt-2"
              >
                <span>{t('supportCard.contactAction')}</span>
                <span className="material-symbols-outlined text-[14px] rtl:-scale-x-100" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile/Tablet Quick Demo + Credentials Inline Strip (< lg) */}
      {(hasPreview || packages.length > 0) && (
        <div className="lg:hidden space-y-3">
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/70 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-[11px] text-on-surface-variant">
                  {t('packages.choosePackage')}
                </span>
                <span className="block font-bold text-sm text-on-surface truncate">
                  {selectedName || t('packages.unavailable')}
                </span>
              </div>
              {selectedPackage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenMobileSheet}
                  iconTrailing={
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                      expand_more
                    </span>
                  }
                >
                  {packages.length > 1 ? t('packages.changePackage') : t('packages.includedFeatures')}
                </Button>
              )}
            </div>

            {hasPreview && (
              <Button
                variant="secondary"
                size="md"
                onClick={onOpenLiveDemo}
                className="w-full"
                iconLeading={
                  <span className="material-symbols-outlined text-primary text-[18px]" aria-hidden="true">
                    {isExternalDemo ? 'open_in_new' : 'desktop_windows'}
                  </span>
                }
              >
                {isExternalDemo ? t('packages.openExternalDemo') : t('packages.liveDemo')}
              </Button>
            )}

            <DemoCredentialsCard preview={project.preview} />
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Bar (< lg) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-xl border-t border-outline-variant shadow-sticky-bar px-3 sm:px-6 py-2.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onOpenMobileSheet}
            disabled={packages.length === 0}
            className="min-w-0 flex-1 text-start rounded-xl px-2 py-1.5 hover:bg-surface-container transition-colors flex flex-col justify-center min-h-[44px]"
          >
            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
              <span className="truncate">{selectedName || t('packages.unavailable')}</span>
              {packages.length > 0 && (
                <span className="material-symbols-outlined text-[15px] text-primary shrink-0" aria-hidden="true">
                  keyboard_arrow_up
                </span>
              )}
            </div>
            {selectedPackage && (
              <div className="flex items-baseline gap-1.5 whitespace-nowrap overflow-hidden">
                <span className="font-mono font-extrabold text-sm sm:text-base text-primary">
                  {formatMoney(selectedPackage.price, lang)}
                </span>
                {hasCompareAt && (
                  <span className="font-mono text-[11px] text-on-surface-variant line-through">
                    {formatMoney(selectedPackage.compareAtPrice, lang)}
                  </span>
                )}
              </div>
            )}
          </button>

          <Link to={checkoutUrl} className="shrink-0">
            <Button
              variant="primary-gradient"
              size="md"
              className="px-4 sm:px-6 min-h-[44px] whitespace-nowrap"
              iconLeading={
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  shopping_cart_checkout
                </span>
              }
            >
              {t('common:actions.buyNow')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Packages Bottom Sheet (< lg) */}
      <AccessibleDialog
        isOpen={mobileSheetOpen}
        onClose={onCloseMobileSheet}
        variant="bottom-sheet"
        labelledBy="mobile-packages-sheet-title"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-outline-variant shrink-0">
          <h2 id="mobile-packages-sheet-title" className="text-base font-bold text-on-surface">
            {t('packages.sheetTitle')}
          </h2>
          <button
            type="button"
            onClick={onCloseMobileSheet}
            aria-label={t('common:actions.close')}
            className="min-w-[44px] min-h-[44px] rounded-xl inline-flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="p-4 space-y-5 bc-scroll flex-1">
          {packages.length > 0 ? (
            <>
              <PackageCardsList
                packages={packages}
                selectedKey={selectedPackage?.key}
                onSelect={onSelectPackage}
                lang={lang}
                t={t}
              />

              {selectedPackage && (
                <SelectedPackageFeatures
                  selectedPackage={selectedPackage}
                  lang={lang}
                  t={t}
                />
              )}
            </>
          ) : (
            <p className="text-sm text-on-surface-variant text-center py-4">
              {t('packages.unavailable')}
            </p>
          )}

          {hasPreview && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                onCloseMobileSheet();
                onOpenLiveDemo();
              }}
              className="w-full"
              iconLeading={
                <span className="material-symbols-outlined text-primary text-[18px]" aria-hidden="true">
                  {isExternalDemo ? 'open_in_new' : 'desktop_windows'}
                </span>
              }
            >
              {isExternalDemo ? t('packages.openExternalDemo') : t('packages.liveDemo')}
            </Button>
          )}

          <DemoCredentialsCard preview={project.preview} />
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-low flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="block text-[11px] text-on-surface-variant truncate">{selectedName}</span>
            {selectedPackage && (
              <PriceTag
                piasters={selectedPackage.price}
                originalPiasters={hasCompareAt ? selectedPackage.compareAtPrice : undefined}
                size="md"
              />
            )}
          </div>

          <Link to={checkoutUrl} onClick={onCloseMobileSheet} className="shrink-0">
            <Button
              variant="primary-gradient"
              size="md"
              className="px-5"
              iconLeading={
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  shopping_cart_checkout
                </span>
              }
            >
              {t('packages.buyNow')}
            </Button>
          </Link>
        </div>
      </AccessibleDialog>
    </>
  );
}
