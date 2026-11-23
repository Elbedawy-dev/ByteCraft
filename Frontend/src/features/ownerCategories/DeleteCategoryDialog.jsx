import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError, getApiErrorMessage } from '@/api/client';
import { useDeleteOwnerCategory, useUpdateOwnerCategory } from '@/api/owner/categories';
import { useLang, useToast } from '@/app/providers';
import { localized } from '@/lib/localized';
import { Button } from '@/components/ui';
import { CategoryNativeDialog } from './CategoryNativeDialog';

export function DeleteCategoryDialog({ category, onClose }) {
  const { t } = useTranslation('ownerCategories');
  const { lang } = useLang();
  const toast = useToast();

  const deleteMutation = useDeleteOwnerCategory();
  const updateMutation = useUpdateOwnerCategory();
  const [blockedInUse, setBlockedInUse] = useState(false);

  useEffect(() => {
    setBlockedInUse(false);
  }, [category?.id]);

  const isOpen = Boolean(category);
  const categoryName = localized(category?.name, lang) || category?.key || '';
  const isBusy = deleteMutation.isPending || updateMutation.isPending;

  const handleConfirmDelete = async () => {
    if (!category?.id) return;
    try {
      await deleteMutation.mutateAsync(category.id);
      toast.success(t('toasts.deleted'));
      onClose?.();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CATEGORY_IN_USE') {
        setBlockedInUse(true);
        return;
      }
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDeactivateInstead = async () => {
    if (!category?.id) return;
    try {
      await updateMutation.mutateAsync({ id: category.id, isActive: false });
      toast.success(t('toasts.deactivated'));
      onClose?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <CategoryNativeDialog
      isOpen={isOpen}
      onClose={isBusy ? undefined : onClose}
      preventClose={isBusy}
      size="sm"
      title={blockedInUse ? t('deleteDialog.inUseTitle') : t('deleteDialog.title')}
      closeLabel={t('modal.closeLabel')}
      footer={
        blockedInUse ? (
          <div className="flex items-center justify-end gap-2.5 flex-wrap">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isBusy} autoFocus>
              {t('deleteDialog.close')}
            </Button>
            {category?.isActive && (
              <Button
                variant="secondary"
                size="sm"
                loading={updateMutation.isPending}
                onClick={handleDeactivateInstead}
                iconLeading={<span className="material-symbols-outlined text-[18px]">visibility_off</span>}
              >
                {t('deleteDialog.deactivateInstead')}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2.5 flex-wrap">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isBusy} autoFocus>
              {t('deleteDialog.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={handleConfirmDelete}
              iconLeading={<span className="material-symbols-outlined text-[18px]">delete</span>}
            >
              {t('deleteDialog.confirm')}
            </Button>
          </div>
        )
      }
    >
      {blockedInUse ? (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30"
        >
          <span className="material-symbols-outlined text-warning text-[22px] shrink-0 mt-0.5">
            warning
          </span>
          <p className="text-sm text-on-surface leading-relaxed">
            {t('deleteDialog.inUseMessage', { name: categoryName })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {t('deleteDialog.message', { name: categoryName })}
        </p>
      )}
    </CategoryNativeDialog>
  );
}
