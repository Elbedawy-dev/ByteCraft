import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMeta } from '../../api/meta';
import { useLang } from '../../app/providers';
import { localized } from '../../lib/localized';
import { formatMoney } from '../../lib/money';
import { projectDetailsPath, ROUTES } from '../../config/routes';
import { Badge, Button, Card } from '../../components/ui';

export function OrderSummarySidebar({ order }) {
  const { t } = useTranslation('orders');
  const { lang } = useLang();
  const { data: meta } = useMeta();

  const snapshot = order?.snapshot || {};
  const pricing = order?.pricing || {};
  const whatsappRaw = (meta?.contact?.whatsapp || '').trim();
  const whatsappDigits = whatsappRaw.replace(/[^0-9]/g, '');
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : '';

  const licenseLabel =
    snapshot.licenseType === 'multi'
      ? t('tracking.summary.licenseMulti')
      : t('tracking.summary.licenseSingle');

  return (
    <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
      <Card variant="flat" padding="md" className="space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[22px]">
            shopping_bag
          </span>
          <h2 className="text-lg font-bold text-on-surface">
            {t('tracking.summary.title')}
          </h2>
        </div>

        {/* Project & Package Snapshot */}
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/70 space-y-2.5">
          <div>
            <span className="text-[11px] text-on-surface-variant block">
              {t('tracking.summary.projectLabel')}
            </span>
            {snapshot.slug ? (
              <Link
                to={projectDetailsPath(snapshot.slug)}
                className="text-sm sm:text-base font-bold text-on-surface hover:text-primary transition-colors block mt-0.5"
              >
                {localized(snapshot.title, lang)}
              </Link>
            ) : (
              <span className="text-sm sm:text-base font-bold text-on-surface block mt-0.5">
                {localized(snapshot.title, lang)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-outline-variant/50">
            <div>
              <span className="text-[11px] text-on-surface-variant block">
                {t('tracking.summary.packageLabel')}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-on-surface">
                {localized(snapshot.packageName, lang)}
              </span>
            </div>
            <Badge variant="neutral" size="sm">
              {licenseLabel}
            </Badge>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-2 text-on-surface-variant">
            <span>{t('tracking.summary.subtotal')}</span>
            <span className="font-mono font-semibold text-on-surface">
              {formatMoney(pricing.subtotal || 0, lang)}
            </span>
          </div>

          {(pricing.discount > 0 || pricing.couponCode) && (
            <div className="flex items-center justify-between gap-2 text-primary">
              <span>
                {pricing.couponCode
                  ? t('tracking.summary.discount', { code: pricing.couponCode })
                  : t('tracking.summary.discountNoCode')}
              </span>
              <span className="font-mono font-semibold">
                -{formatMoney(pricing.discount || 0, lang)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 text-on-surface-variant">
            <span>{t('tracking.summary.taxFree')}</span>
            <span className="text-primary font-medium">
              {t('tracking.summary.taxFreeValue')}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-outline-variant/70">
            <span className="text-base font-bold text-on-surface">
              {t('tracking.summary.total')}
            </span>
            <span className="font-mono text-2xl font-extrabold text-primary">
              {formatMoney(pricing.total || 0, lang)}
            </span>
          </div>
        </div>
      </Card>

      {/* Support Box */}
      <Card variant="flat" padding="sm" className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">
              support_agent
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface">
              {t('tracking.summary.supportTitle')}
            </p>
            <p className="text-xs text-on-surface-variant">
              {t('tracking.summary.supportSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="secondary" size="sm" className="w-full">
                {t('tracking.summary.whatsapp')}
              </Button>
            </a>
          )}
          <Link to={ROUTES.CONTACT} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              {t('tracking.summary.contact')}
            </Button>
          </Link>
        </div>
      </Card>
    </aside>
  );
}
