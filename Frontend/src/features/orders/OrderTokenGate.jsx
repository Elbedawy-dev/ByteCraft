import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, FormField, Input } from '../../components/ui';

export function OrderTokenGate({
  orderNumber,
  initialToken = '',
  errorMessage = '',
  isRateLimited = false,
  isSubmitting = false,
  onSubmitToken,
}) {
  const { t } = useTranslation('orders');
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [localError, setLocalError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleaned = tokenInput.trim();
    if (!cleaned) {
      setLocalError(t('tracking.tokenGate.requiredError'));
      return;
    }
    setLocalError('');
    onSubmitToken?.(cleaned);
  };

  const displayedError = localError || errorMessage;

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12">
      <Card variant="flat" padding="lg" className="space-y-6">
        <div className="space-y-3 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/25 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">vpn_key</span>
          </div>

          <div className="flex justify-center">
            <Badge variant="primary" size="sm">
              {t('tracking.tokenGate.badge')}
            </Badge>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
            {t('tracking.tokenGate.title')}
          </h1>

          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t('tracking.tokenGate.subtitle', { orderNumber })}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <FormField
            id="order-access-token"
            label={t('tracking.tokenGate.tokenLabel')}
            required
            error={displayedError}
            hint={!displayedError ? t('tracking.tokenGate.tokenHint') : undefined}
          >
            <Input
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                if (localError) setLocalError('');
              }}
              dir="ltr"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              disabled={isRateLimited || isSubmitting}
              placeholder={t('tracking.tokenGate.tokenPlaceholder')}
              className="font-mono text-xs sm:text-sm"
              iconLeading={
                <span className="material-symbols-outlined text-[20px]">key</span>
              }
            />
          </FormField>

          <Button
            type="submit"
            variant="primary-gradient"
            size="lg"
            loading={isSubmitting}
            disabled={isRateLimited}
            className="w-full"
            iconTrailing={
              <span className="material-symbols-outlined text-[20px] rtl:-scale-x-100">
                arrow_forward
              </span>
            }
          >
            {t('tracking.tokenGate.submit')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
