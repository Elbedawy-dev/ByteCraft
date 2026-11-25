import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDeleteOwnAccount } from '../../api/account';
import { ApiError, getApiErrorMessage } from '../../api/client';
import { useToast } from '../../app/providers';
import { ROUTES } from '../../config/routes';
import { Button, Card, ConfirmDialog, FormField } from '../../components/ui';
import { PasswordInput } from '../auth';

export function DeleteAccountSection({ user }) {
  const { t } = useTranslation(['account', 'common']);
  const navigate = useNavigate();
  const toast = useToast();
  const deleteMutation = useDeleteOwnAccount();

  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (user?.role === 'admin') {
    return null;
  }

  const handleOpen = () => {
    setPassword('');
    setPasswordError('');
    setIsOpen(true);
  };

  const handleClose = () => {
    if (deleteMutation.isPending) return;
    setIsOpen(false);
    setPassword('');
    setPasswordError('');
  };

  const handleConfirmDelete = async () => {
    if (!password) {
      setPasswordError(t('account:deleteAccount.passwordRequired'));
      return;
    }

    setPasswordError('');
    try {
      await deleteMutation.mutateAsync({
        password,
        onBeforeClear: () => {
          setIsOpen(false);
          navigate(ROUTES.HOME, { replace: true });
        },
      });
      toast.success(t('account:deleteAccount.deletedToast'));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CURRENT_PASSWORD') {
        setPasswordError(t('common:errors.codes.INVALID_CURRENT_PASSWORD'));
        return;
      }
      const msg = getApiErrorMessage(err, t);
      setPasswordError(msg);
    }
  };

  return (
    <>
      <Card
        variant="flat"
        padding="md"
        className="border-error/30 bg-error/5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-error/15 text-error flex items-center justify-center shrink-0">
              <span className="material-symbols-rounded text-[22px]" aria-hidden="true">
                delete_forever
              </span>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-error">
                {t('account:deleteAccount.title')}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {t('account:deleteAccount.description')}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleOpen}
            className="shrink-0"
            iconLeading={
              <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                warning
              </span>
            }
          >
            {t('account:deleteAccount.openAction')}
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirmDelete}
        title={t('account:deleteAccount.dialogTitle')}
        message={t('account:deleteAccount.dialogWarning')}
        confirmText={t('account:deleteAccount.confirmAction')}
        cancelText={t('common:actions.cancel')}
        variant="danger"
        loading={deleteMutation.isPending}
        confirmDisabled={!password}
      >
        <div className="rounded-xl bg-error/10 border border-error/25 p-3 text-xs text-error leading-relaxed">
          {t('account:deleteAccount.irreversibleNotice')}
        </div>

        <FormField
          id="delete-account-password"
          label={t('account:deleteAccount.passwordLabel')}
          error={passwordError}
          required
        >
          <PasswordInput
            id="delete-account-password"
            autoComplete="current-password"
            enterKeyHint="done"
            value={password}
            disabled={deleteMutation.isPending}
            error={Boolean(passwordError)}
            placeholder={t('account:deleteAccount.passwordPlaceholder')}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError('');
            }}
          />
        </FormField>
      </ConfirmDialog>
    </>
  );
}
