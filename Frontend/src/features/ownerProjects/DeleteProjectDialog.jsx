import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError, getApiErrorMessage } from '@/api/client';
import {
  useDeleteOwnerProject,
  useUpdateOwnerProjectStatus,
} from '@/api/owner/projects';
import { useLang, useToast } from '@/app/providers';
import { localized } from '@/lib/localized';
import { Button } from '@/components/ui';
import { ProjectNativeDialog } from './ProjectNativeDialog';

export function DeleteProjectDialog({ project, onClose }) {
  const { t } = useTranslation('ownerProjects');
  const { lang } = useLang();
  const toast = useToast();

  const deleteMutation = useDeleteOwnerProject();
  const statusMutation = useUpdateOwnerProjectStatus();
  const [hasPaidOrders, setHasPaidOrders] = useState(false);

  useEffect(() => {
    setHasPaidOrders(false);
  }, [project?.id]);

  const isOpen = Boolean(project);
  const projectTitle = localized(project?.title, lang) || project?.slug || '';
  const isBusy = deleteMutation.isPending || statusMutation.isPending;

  const handleConfirmDelete = async () => {
    if (!project?.id) return;
    try {
      await deleteMutation.mutateAsync(project.id);
      toast.success(t('toasts.deleted'));
      onClose?.();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'PROJECT_HAS_PAID_ORDERS') {
        setHasPaidOrders(true);
        return;
      }
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleArchiveInstead = async () => {
    if (!project?.id) return;
    try {
      await statusMutation.mutateAsync({ id: project.id, status: 'archived' });
      toast.success(t('toasts.archivedInstead'));
      onClose?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <ProjectNativeDialog
      isOpen={isOpen}
      onClose={isBusy ? undefined : onClose}
      preventClose={isBusy}
      size="sm"
      headerIcon={hasPaidOrders ? 'inventory_2' : 'warning'}
      title={hasPaidOrders ? t('deleteDialog.paidOrdersTitle') : t('deleteDialog.title')}
      closeLabel={t('modal.closeLabel')}
      footer={
        hasPaidOrders ? (
          <div className="flex items-center justify-end gap-2.5 flex-wrap">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isBusy} autoFocus>
              {t('deleteDialog.close')}
            </Button>
            {project?.status !== 'archived' && (
              <Button
                variant="primary-gradient"
                size="sm"
                loading={statusMutation.isPending}
                onClick={handleArchiveInstead}
                iconLeading={<span className="material-symbols-outlined text-[18px]">archive</span>}
              >
                {t('deleteDialog.archiveInstead')}
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
      {hasPaidOrders ? (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30"
        >
          <span className="material-symbols-outlined text-warning text-[22px] shrink-0 mt-0.5">
            info
          </span>
          <p className="text-sm text-on-surface leading-relaxed">
            {t('deleteDialog.paidOrdersMessage', { title: projectTitle })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {t('deleteDialog.message', { title: projectTitle })}
        </p>
      )}
    </ProjectNativeDialog>
  );
}
