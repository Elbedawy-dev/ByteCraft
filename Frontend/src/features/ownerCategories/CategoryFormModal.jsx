import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '@/api/client';
import { useCreateOwnerCategory, useUpdateOwnerCategory } from '@/api/owner/categories';
import { useToast } from '@/app/providers';
import { Button, FormField, Input, Switch } from '@/components/ui';
import { CategoryNativeDialog } from './CategoryNativeDialog';
import { suggestCategoryKey } from './categoryUtils';

export function CategoryFormModal({ isOpen, onClose, category = null }) {
  const { t } = useTranslation('ownerCategories');
  const toast = useToast();
  const isEdit = Boolean(category?.id);

  const createMutation = useCreateOwnerCategory();
  const updateMutation = useUpdateOwnerCategory();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const keyManuallyEditedRef = useRef(false);
  const [showUnsavedGuard, setShowUnsavedGuard] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z.object({
          ar: z.string().trim().min(2, t('validation.nameArMin')),
          en: z.string().trim().min(2, t('validation.nameEnMin')),
        }),
        key: z
          .string()
          .trim()
          .refine(
            (val) => val === '' || (val.length >= 2 && /^[a-z0-9-]+$/.test(val)),
            t('validation.keyInvalid')
          ),
        order: z.coerce
          .number({ invalid_type_error: t('validation.orderInt') })
          .int(t('validation.orderInt')),
        isActive: z.boolean(),
      }),
    [t]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: { ar: '', en: '' },
      key: '',
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setShowUnsavedGuard(false);
    keyManuallyEditedRef.current = Boolean(category?.id);

    reset({
      name: {
        ar: category?.name?.ar || '',
        en: category?.name?.en || '',
      },
      key: category?.key || '',
      order: category?.order ?? 0,
      isActive: category?.isActive ?? true,
    });
  }, [isOpen, category, reset]);

  const watchedNameEn = watch('name.en');
  useEffect(() => {
    if (!isOpen || isEdit || keyManuallyEditedRef.current) return;
    const suggested = suggestCategoryKey(watchedNameEn);
    setValue('key', suggested, { shouldDirty: false });
  }, [watchedNameEn, isOpen, isEdit, setValue]);

  const handleRequestClose = () => {
    if (isSubmitting) return;
    if (isDirty) {
      setShowUnsavedGuard(true);
      return;
    }
    onClose?.();
  };

  const handleAutoSuggestKey = () => {
    const suggested = suggestCategoryKey(watchedNameEn);
    keyManuallyEditedRef.current = false;
    setValue('key', suggested, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = async (values) => {
    const payload = {
      name: {
        ar: values.name.ar.trim(),
        en: values.name.en.trim(),
      },
      order: Number.isFinite(Number(values.order)) ? Math.trunc(Number(values.order)) : 0,
      isActive: Boolean(values.isActive),
    };

    const trimmedKey = values.key.trim().toLowerCase();
    if (trimmedKey) {
      payload.key = trimmedKey;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: category.id, ...payload });
        toast.success(t('toasts.updated'));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t('toasts.created'));
      }
      onClose?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('key', { type: 'server', message: t('validation.duplicateKey') });
        return;
      }
      if (err instanceof ApiError && err.details?.length) {
        const mapped = applyApiErrorsToForm(err, setError);
        if (mapped) return;
      }
      toast.error(getApiErrorMessage(err));
    }
  };

  const keyRegister = register('key', {
    onChange: () => {
      keyManuallyEditedRef.current = true;
    },
  });

  return (
    <CategoryNativeDialog
      isOpen={isOpen}
      onClose={handleRequestClose}
      preventClose={isSubmitting}
      size="md"
      title={isEdit ? t('modal.editTitle') : t('modal.createTitle')}
      subtitle={t('modal.subtitle')}
      closeLabel={t('modal.closeLabel')}
      footer={
        <div className="flex flex-col gap-3 w-full">
          {showUnsavedGuard && (
            <div
              role="alert"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm"
            >
              <span className="text-on-surface font-medium">{t('unsaved.banner')}</span>
              <div className="flex items-center gap-2 shrink-0 justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setShowUnsavedGuard(false);
                    onClose?.();
                  }}
                >
                  {t('unsaved.discard')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  autoFocus
                  onClick={() => setShowUnsavedGuard(false)}
                >
                  {t('unsaved.keepEditing')}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRequestClose}
              disabled={isSubmitting}
            >
              {t('modal.cancel')}
            </Button>
            <Button
              type="submit"
              form="category-form"
              variant="primary-gradient"
              size="sm"
              loading={isSubmitting}
            >
              {isEdit ? t('modal.saveEdit') : t('modal.saveCreate')}
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="category-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            id="cat-name-ar"
            label={t('modal.nameArLabel')}
            required
            error={errors.name?.ar?.message}
          >
            <Input
              autoFocus
              placeholder={t('modal.nameArPlaceholder')}
              {...register('name.ar')}
            />
          </FormField>

          <FormField
            id="cat-name-en"
            label={t('modal.nameEnLabel')}
            required
            error={errors.name?.en?.message}
          >
            <Input
              dir="ltr"
              className="text-start"
              placeholder={t('modal.nameEnPlaceholder')}
              {...register('name.en')}
            />
          </FormField>
        </div>

        <FormField
          id="cat-key"
          label={t('modal.keyLabel')}
          hint={t('modal.keyHint')}
          error={errors.key?.message}
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <Input
                id="cat-key"
                dir="ltr"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                error={Boolean(errors.key)}
                placeholder={t('modal.keyPlaceholder')}
                className="font-mono text-sm"
                {...keyRegister}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleAutoSuggestKey}
              className="shrink-0 px-3"
              iconLeading={<span className="material-symbols-outlined text-[18px]">auto_fix_high</span>}
            >
              <span className="hidden sm:inline">{t('modal.autoSuggestKey')}</span>
            </Button>
          </div>
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
          <FormField
            id="cat-order"
            label={t('modal.orderLabel')}
            hint={t('modal.orderHint')}
            error={errors.order?.message}
          >
            <Input
              type="number"
              inputMode="numeric"
              dir="ltr"
              {...register('order')}
            />
          </FormField>

          <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/60">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  id="cat-active"
                  label={t('modal.isActiveLabel')}
                  description={t('modal.isActiveDescription')}
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-full"
                />
              )}
            />
          </div>
        </div>
      </form>
    </CategoryNativeDialog>
  );
}
