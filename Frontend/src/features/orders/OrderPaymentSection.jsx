import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMeta } from '../../api/meta';
import { useSubmitPaymentProof } from '../../api/orderTracking';
import { useSubmitAccountPaymentProof } from '../../api/account';
import { getApiErrorMessage } from '../../api/client';
import { useLang, useToast } from '../../app/providers';
import { localized } from '../../lib/localized';
import { formatMoney, piastersToEgp } from '../../lib/money';
import { formatDateTime } from '../../lib/format';
import { projectDetailsPath, ROUTES } from '../../config/routes';
import { Button, Card, CopyButton, FormField, Input } from '../../components/ui';
import { ProofDropzone } from './ProofDropzone';

export function OrderPaymentSection({ order, token, bootstrap, mode = 'guest' }) {
  const { t } = useTranslation('orders');
  const { lang } = useLang();
  const toast = useToast();
  const { data: meta } = useMeta();

  const [proofFile, setProofFile] = useState(null);
  const [reference, setReference] = useState('');
  const [proofError, setProofError] = useState('');

  const guestSubmitProofMutation = useSubmitPaymentProof(order.orderNumber, token);
  const accountSubmitProofMutation = useSubmitAccountPaymentProof(order.orderNumber);
  const submitProofMutation =
    mode === 'account' ? accountSubmitProofMutation : guestSubmitProofMutation;

  const method = order.paymentMethod;
  const status = order.status;
  const isManualMethod = method === 'vodafone_cash' || method === 'instapay';
  const canUploadProof =
    isManualMethod && (status === 'pending_payment' || status === 'rejected');

  const effectiveInstructions =
    order.paymentInstructions || bootstrap?.paymentInstructions || null;
  const metaInstructions = meta?.paymentMethods?.[method]?.instructions;
  const instructionText =
    localized(effectiveInstructions?.instructions, lang) ||
    localized(metaInstructions, lang);

  const fawryRef =
    order.fawryReference ||
    order.payment?.fawryReference ||
    bootstrap?.fawryReference ||
    null;

  const exactEgpCopyValue = String(piastersToEgp(order.pricing?.total || 0));

  const handleProofSubmit = async (event) => {
    event.preventDefault();
    if (!proofFile) {
      setProofError(t('tracking.payment.manual.proofRequired'));
      return;
    }
    setProofError('');

    try {
      await submitProofMutation.mutateAsync({
        file: proofFile,
        reference,
      });
      setProofFile(null);
      setReference('');
      toast.success(t('tracking.payment.manual.uploadSuccess'));
    } catch (err) {
      const msg = getApiErrorMessage(err, t);
      setProofError(msg);
      toast.error(msg);
    }
  };

  return (
    <Card variant="flat" padding="md" className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-outline-variant/70 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">
              account_balance_wallet
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">
              {t('tracking.payment.title')}
            </h2>
            <p className="text-xs text-on-surface-variant">
              {t('tracking.payment.methodLabel')}{' '}
              <span className="font-semibold text-on-surface">
                {t(`common:paymentMethods.${method}`, { defaultValue: method })}
              </span>
            </p>
          </div>
        </div>

        {order.payment?.paidAt && (
          <span className="text-xs font-medium text-primary bg-primary/10 border border-primary/25 px-3 py-1 rounded-full">
            {t('tracking.payment.paidAt', {
              date: formatDateTime(order.payment.paidAt, lang),
            })}
          </span>
        )}
      </div>

      {/* Free Order */}
      {order.isFreeOrder && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/25 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">
            redeem
          </span>
          <div>
            <h3 className="text-sm font-bold text-on-surface">
              {t('tracking.payment.free.title')}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {t('tracking.payment.free.description')}
            </p>
          </div>
        </div>
      )}

      {/* Manual Payment Instructions (Vodafone Cash / InstaPay) */}
      {!order.isFreeOrder && isManualMethod && (canUploadProof || effectiveInstructions) && (
        <div className="space-y-4">
          {(effectiveInstructions || instructionText) && (
            <div className="p-4 sm:p-5 rounded-xl bg-surface-container border border-outline-variant/80 space-y-4">
              <div className="flex items-center gap-2 text-primary text-sm font-bold">
                <span className="material-symbols-outlined text-[20px]">
                  {method === 'instapay' ? 'bolt' : 'phone_iphone'}
                </span>
                <span>{t('tracking.payment.manual.instructionsTitle')}</span>
              </div>

              {instructionText && (
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {instructionText}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {effectiveInstructions?.destination && (
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/70 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[11px] text-on-surface-variant block">
                        {method === 'instapay'
                          ? t('tracking.payment.manual.ipaLabel')
                          : t('tracking.payment.manual.walletLabel')}
                      </span>
                      <span className="font-mono text-sm font-bold text-primary truncate block mt-0.5">
                        <bdi dir="ltr">{effectiveInstructions.destination}</bdi>
                      </span>
                    </div>
                    <CopyButton
                      text={effectiveInstructions.destination}
                      label={t('common:actions.copy')}
                      copiedLabel={t('common:actions.copied')}
                      size="sm"
                      variant="ghost"
                    />
                  </div>
                )}

                {effectiveInstructions?.accountName && (
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/70 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[11px] text-on-surface-variant block">
                        {t('tracking.payment.manual.accountNameLabel')}
                      </span>
                      <span className="text-sm font-semibold text-on-surface truncate block mt-0.5">
                        {effectiveInstructions.accountName}
                      </span>
                    </div>
                    <CopyButton
                      text={effectiveInstructions.accountName}
                      size="icon-sm"
                      variant="ghost"
                      copiedLabel={t('common:actions.copied')}
                    />
                  </div>
                )}

                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/70 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] text-on-surface-variant block">
                      {t('tracking.payment.manual.amountLabel')}
                    </span>
                    <span className="font-mono text-sm font-bold text-on-surface block mt-0.5">
                      {formatMoney(order.pricing?.total || 0, lang)}
                    </span>
                  </div>
                  <CopyButton
                    text={exactEgpCopyValue}
                    label={t('tracking.payment.manual.copyAmount')}
                    copiedLabel={t('common:actions.copied')}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Proof Upload Form (only allowed in pending_payment or rejected) */}
          {canUploadProof && (
            <form
              onSubmit={handleProofSubmit}
              className="p-4 sm:p-5 rounded-xl bg-surface-container border border-outline-variant/80 space-y-4"
            >
              <h3 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  upload_file
                </span>
                <span>
                  {status === 'rejected'
                    ? t('tracking.payment.manual.uploadRetryTitle')
                    : t('tracking.payment.manual.uploadTitle')}
                </span>
              </h3>

              <ProofDropzone
                file={proofFile}
                onChange={(selected) => {
                  setProofFile(selected);
                  if (proofError) setProofError('');
                }}
                disabled={submitProofMutation.isPending}
              />

              <FormField
                id="payment-proof-reference"
                label={t('tracking.payment.manual.referenceInputLabel')}
              >
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  dir="ltr"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={submitProofMutation.isPending}
                  placeholder={t('tracking.payment.manual.referenceInputPlaceholder')}
                  className="font-mono text-xs sm:text-sm"
                />
              </FormField>

              {proofError && (
                <p
                  role="alert"
                  className="text-xs sm:text-sm text-error flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0">
                    error
                  </span>
                  <span>{proofError}</span>
                </p>
              )}

              <Button
                type="submit"
                variant="primary-gradient"
                size="md"
                loading={submitProofMutation.isPending}
                className="w-full sm:w-auto"
                iconLeading={
                  <span className="material-symbols-outlined text-[20px]">
                    verified
                  </span>
                }
              >
                {submitProofMutation.isPending
                  ? t('tracking.payment.manual.submittingProof')
                  : t('tracking.payment.manual.submitProof')}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Proof Submitted State (awaiting_review) */}
      {!order.isFreeOrder && isManualMethod && status === 'awaiting_review' && (
        <div className="p-4 sm:p-5 rounded-xl bg-primary/10 border border-primary/30 flex items-start gap-3.5">
          <span className="material-symbols-outlined text-primary text-[24px] shrink-0 mt-0.5">
            hourglass_top
          </span>
          <div className="space-y-1.5 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-on-surface">
              {t('tracking.payment.manual.proofSubmittedTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {t('tracking.payment.manual.proofSubmittedDesc')}
            </p>
            {order.payment?.proof && (
              <div className="flex flex-wrap gap-4 pt-1 text-xs text-on-surface">
                {order.payment.proof.submittedAt && (
                  <span>
                    <strong className="text-on-surface-variant">
                      {t('tracking.payment.manual.submittedAtLabel')}{' '}
                    </strong>
                    {formatDateTime(order.payment.proof.submittedAt, lang)}
                  </span>
                )}
                {order.payment.proof.reference && (
                  <span>
                    <strong className="text-on-surface-variant">
                      {t('tracking.payment.manual.referenceLabel')}{' '}
                    </strong>
                    <span className="font-mono">
                      <bdi dir="ltr">{order.payment.proof.reference}</bdi>
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fawry Kiosk Reference */}
      {!order.isFreeOrder && method === 'fawry' && status === 'pending_payment' && (
        <div className="p-5 rounded-xl bg-surface-container border border-outline-variant/80 space-y-4">
          <div className="flex items-center gap-2 text-primary text-sm font-bold">
            <span className="material-symbols-outlined text-[20px]">local_atm</span>
            <span>{t('tracking.payment.fawry.title')}</span>
          </div>

          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {t('tracking.payment.fawry.instructions')}
          </p>

          {fawryRef ? (
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-primary/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-wider text-primary select-all">
                <bdi dir="ltr">{fawryRef}</bdi>
              </span>
              <CopyButton
                text={fawryRef}
                label={t('tracking.payment.fawry.copyReference')}
                copiedLabel={t('common:actions.copied')}
                size="md"
                variant="secondary"
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/70 text-xs sm:text-sm text-on-surface-variant">
              {t('tracking.payment.fawry.missingReference')}
            </div>
          )}

          <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">
              info
            </span>
            <span>{t('tracking.payment.fawry.pendingNote')}</span>
          </p>
        </div>
      )}

      {/* Bank Card (Pending — no API retry supported) */}
      {!order.isFreeOrder && method === 'card' && status === 'pending_payment' && (
        <div className="p-5 rounded-xl bg-surface-container border border-outline-variant/80 space-y-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-warning text-[24px] shrink-0 mt-0.5">
              credit_card
            </span>
            <div className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-on-surface">
                {t('tracking.payment.card.pendingTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {t('tracking.payment.card.pendingBody')}
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t('tracking.payment.card.noRetryNote')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to={ROUTES.CONTACT}>
              <Button variant="outline" size="sm">
                {t('tracking.payment.card.contactSupport')}
              </Button>
            </Link>
            <Link
              to={
                order?.snapshot?.slug
                  ? projectDetailsPath(order.snapshot.slug)
                  : ROUTES.PROJECTS
              }
            >
              <Button variant="secondary" size="sm">
                {t('tracking.payment.card.newOrder')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}
