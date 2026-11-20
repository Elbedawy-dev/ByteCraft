import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOwnerSettings } from '../../api/owner/settings';
import { Badge } from '../../components/ui';
import { ErrorState } from '../../components/shared';
import { OwnerPageHeader } from '../../components/layout/OwnerLayout';
import {
  ChangePasswordForm,
  SettingsForm,
  SettingsSkeleton,
} from '../../features/ownerSettings';

export default function OwnerSettingsPage() {
  const { t } = useTranslation('ownerSettings');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const {
    data: settings,
    isLoading,
    isError,
    error,
    refetch,
  } = useOwnerSettings();

  return (
    <div className="space-y-6">
      <OwnerPageHeader
        title={t('title')}
        description={t('description')}
        badge={
          hasUnsavedChanges ? (
            <Badge variant="warning" dot size="sm">
              {t('unsavedBadge')}
            </Badge>
          ) : null
        }
      />

      {isLoading ? (
        <SettingsSkeleton />
      ) : isError ? (
        <ErrorState
          title={t('error.title')}
          message={error?.message || t('error.description')}
          onRetry={refetch}
        />
      ) : (
        <div className="space-y-8">
          <SettingsForm
            settings={settings}
            onDirtyChange={setHasUnsavedChanges}
          />
          <ChangePasswordForm />
        </div>
      )}
    </div>
  );
}
