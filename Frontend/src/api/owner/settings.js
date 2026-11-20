import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { metaKeys } from '../meta';

export const ownerSettingsKeys = {
  all: ['owner', 'settings'],
  detail: () => ['owner', 'settings', 'detail'],
};

export async function fetchOwnerSettings({ signal } = {}) {
  const { data } = await api.get('/owner/settings', { signal });
  return data?.settings ?? null;
}

export async function updateOwnerSettings(payload) {
  const { data } = await api.patch('/owner/settings', payload);
  return data?.settings ?? null;
}

export function useOwnerSettings(options = {}) {
  return useQuery({
    queryKey: ownerSettingsKeys.detail(),
    queryFn: ({ signal }) => fetchOwnerSettings({ signal }),
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useUpdateOwnerSettings(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options;

  return useMutation({
    mutationFn: updateOwnerSettings,
    onSuccess: (updatedSettings, variables, context) => {
      queryClient.setQueryData(ownerSettingsKeys.detail(), updatedSettings);
      queryClient.invalidateQueries({ queryKey: ownerSettingsKeys.all });
      queryClient.invalidateQueries({ queryKey: metaKeys.all });
      onSuccess?.(updatedSettings, variables, context);
    },
    ...restOptions,
  });
}
