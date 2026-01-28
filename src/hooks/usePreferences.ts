'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { preferencesApi } from '@/lib/api/preferences';
import {
  PreferenceLevel,
  PreferenceResourceType,
  SetPreferenceRequest,
} from '@/types';
import { useGateway } from '@/contexts/GatewayContext';

/**
 * Hook for managing multi-level preferences
 */
export function usePreferences() {
  const queryClient = useQueryClient();
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || '';

  return {
    /**
     * Resolve effective preferences for a resource
     */
    useResolvedPreferences: (
      resourceType: PreferenceResourceType,
      resourceId: string,
      userId?: string,
      groupIds?: string[]
    ) =>
      useQuery({
        queryKey: ['preferences', 'resolved', resourceType, resourceId, gatewayId, userId, groupIds],
        queryFn: () =>
          preferencesApi.resolvePreferences(resourceType, resourceId, gatewayId, userId, groupIds),
        enabled: !!resourceId && !!gatewayId,
      }),

    /**
     * Get preferences at a specific level
     */
    usePreferencesAtLevel: (
      resourceType: PreferenceResourceType,
      resourceId: string,
      ownerId: string,
      level: PreferenceLevel
    ) =>
      useQuery({
        queryKey: ['preferences', level, resourceType, resourceId, ownerId],
        queryFn: () => preferencesApi.getPreferencesAtLevel(resourceType, resourceId, ownerId, level),
        enabled: !!resourceId && !!ownerId,
      }),

    /**
     * Set a preference mutation
     */
    useSetPreference: () =>
      useMutation({
        mutationFn: (request: SetPreferenceRequest) => preferencesApi.setPreference(request),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({
            queryKey: ['preferences', variables.level, variables.resourceType, variables.resourceId],
          });
          queryClient.invalidateQueries({
            queryKey: ['preferences', 'resolved', variables.resourceType, variables.resourceId],
          });
        },
      }),

    /**
     * Set multiple preferences mutation
     */
    useSetPreferences: () =>
      useMutation({
        mutationFn: ({
          resourceType,
          resourceId,
          ownerId,
          level,
          preferences,
        }: {
          resourceType: PreferenceResourceType;
          resourceId: string;
          ownerId: string;
          level: PreferenceLevel;
          preferences: Record<string, string>;
        }) => preferencesApi.setPreferences(resourceType, resourceId, ownerId, level, preferences),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({
            queryKey: ['preferences', variables.level, variables.resourceType, variables.resourceId],
          });
          queryClient.invalidateQueries({
            queryKey: ['preferences', 'resolved', variables.resourceType, variables.resourceId],
          });
        },
      }),

    /**
     * Delete a preference mutation
     */
    useDeletePreference: () =>
      useMutation({
        mutationFn: ({
          resourceType,
          resourceId,
          ownerId,
          level,
          key,
        }: {
          resourceType: PreferenceResourceType;
          resourceId: string;
          ownerId: string;
          level: PreferenceLevel;
          key: string;
        }) => preferencesApi.deletePreference(resourceType, resourceId, ownerId, level, key),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({
            queryKey: ['preferences', variables.level, variables.resourceType, variables.resourceId],
          });
          queryClient.invalidateQueries({
            queryKey: ['preferences', 'resolved', variables.resourceType, variables.resourceId],
          });
        },
      }),

    /**
     * Delete all preferences at a level
     */
    useDeleteAllPreferences: () =>
      useMutation({
        mutationFn: ({
          resourceType,
          resourceId,
          ownerId,
          level,
        }: {
          resourceType: PreferenceResourceType;
          resourceId: string;
          ownerId: string;
          level: PreferenceLevel;
        }) => preferencesApi.deleteAllPreferences(resourceType, resourceId, ownerId, level),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({
            queryKey: ['preferences', variables.level, variables.resourceType, variables.resourceId],
          });
          queryClient.invalidateQueries({
            queryKey: ['preferences', 'resolved', variables.resourceType, variables.resourceId],
          });
        },
      }),
  };
}

/**
 * Shorthand hook for compute resource preferences
 */
export function useComputePreferences(computeResourceId: string, userId?: string, groupIds?: string[]) {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || '';

  return useQuery({
    queryKey: ['preferences', 'resolved', 'COMPUTE', computeResourceId, gatewayId, userId, groupIds],
    queryFn: () =>
      preferencesApi.resolveComputePreferences(computeResourceId, gatewayId, userId, groupIds),
    enabled: !!computeResourceId && !!gatewayId,
  });
}

/**
 * Shorthand hook for storage resource preferences
 */
export function useStoragePreferences(storageResourceId: string, userId?: string, groupIds?: string[]) {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || '';

  return useQuery({
    queryKey: ['preferences', 'resolved', 'STORAGE', storageResourceId, gatewayId, userId, groupIds],
    queryFn: () =>
      preferencesApi.resolveStoragePreferences(storageResourceId, gatewayId, userId, groupIds),
    enabled: !!storageResourceId && !!gatewayId,
  });
}
