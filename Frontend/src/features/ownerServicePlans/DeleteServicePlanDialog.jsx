import React from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/api/client';
import { useDeleteOwnerServicePlan } from '@/api/owner/servicePlans';
import { useLang, useToast } from '@/app/providers';
import { localized } from '@/lib/localized';
import { Button } from '@/components/ui';
import { ServicePlanNativeDialog } from './ServicePlanNativeDialog';

export function DeleteServicePlanDialog({ plan, onClose }) {
  const { t } = useTranslation('ownerServicePlans');
  const { lang } = useLang();
  const toast = useToast();

  const deleteMutation = useDeleteOwnerServicePlan();
  const isOpen = Boolean(plan);
  const planName = localized(plan?.name, lang) || plan?.group || '';

  const handleConfirm = async () => {
    if (!plan?.id) return;
    try {
      await deleteMutation.mutateAsync(plan.id);
      toast.success(t('toasts.deleted'));
      onClose?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <ServicePlanNativeDialog
      isOpen={isOpen}
      onClose={deleteMutation.isPending ? undefined : onClose}
      preventClose={deleteMutation.isPending}
      size="sm"
      title={t('deleteDialog.title')}
      closeLabel={t('modal.closeLabel')}
      footer={
        <div className="flex items-center justify-end gap-2.5 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            autoFocus
          >
            {t('deleteDialog.cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleteMutation.isPending}
            onClick={handleConfirm}
            iconLeading={<span className="material-symbols-outlined text-[18px]">delete</span>}
          >
            {t('deleteDialog.confirm')}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-on-surface-variant leading-relaxed">
        {t('deleteDialog.message', { name: planName })}
      </p>
    </ServicePlanNativeDialog>
  );
}
