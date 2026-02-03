'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourceAccessApi } from '@/lib/api/resource-access';
import {
  AccessGrantRequest,
  AccessGrantUpdateRequest,
  PreferenceLevel,
  PreferenceResourceType,
} from '@/types';
import { useGateway } from '@/contexts/GatewayContext';

/**
 * Hook for managing resource access grants
 */
export function useResourceAccess() {
  const queryClient = useQueryClient();
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || '';

  return {
    /**
     * Get access grants for a resource
     */
    useAccessGrants: (resourceType: PreferenceResourceType, resourceId: string) =>
      useQuery({
        queryKey: ['resource-access', resourceType, resourceId],
        queryFn: () => resourceAccessApi.getAccessGrants(resourceType, resourceId),
        enabled: !!resourceId,
      }),

    /**
     * Get accessible resources for a user
     */
    useAccessibleResources: (
      userId: string,
      resourceType: PreferenceResourceType,
      groupIds?: string[]
    ) =>
      useQuery({
        queryKey: ['resource-access', 'user', userId, resourceType, gatewayId, groupIds],
        queryFn: () =>
          resourceAccessApi.getAccessibleResources(userId, gatewayId, resourceType, groupIds),
        enabled: !!userId && !!gatewayId,
      }),

    /**
     * Get access grants by owner
     */
    useAccessGrantsByOwner: (ownerId: string, ownerType: PreferenceLevel) =>
      useQuery({
        queryKey: ['resource-access', 'owner', ownerId, ownerType],
        queryFn: () => resourceAccessApi.getAccessGrantsByOwner(ownerId, ownerType),
        enabled: !!ownerId,
      }),

    /**
     * Get enabled access grants for a resource
     */
    useEnabledAccessGrants: (resourceType: PreferenceResourceType, resourceId: string) =>
      useQuery({
        queryKey: ['resource-access', 'enabled', resourceType, resourceId],
        queryFn: () => resourceAccessApi.getEnabledAccessGrants(resourceType, resourceId),
        enabled: !!resourceId,
      }),

    /**
     * Create access grant mutation
     */
    useCreateAccessGrant: () =>
      useMutation({
        mutationFn: (request: AccessGrantRequest) => resourceAccessApi.createAccessGrant(request),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['resource-access'] });
        },
      }),

    /**
     * Update access grant mutation
     */
    useUpdateAccessGrant: () =>
      useMutation({
        mutationFn: ({ id, request }: { id: number; request: AccessGrantUpdateRequest }) =>
          resourceAccessApi.updateAccessGrant(id, request),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['resource-access'] });
        },
      }),

    /**
     * Delete access grant mutation
     */
    useDeleteAccessGrant: () =>
      useMutation({
        mutationFn: (id: number) => resourceAccessApi.deleteAccessGrant(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['resource-access'] });
        },
      }),

    /**
     * Toggle access grant enabled/disabled
     */
    useToggleAccessGrant: () =>
      useMutation({
        mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
          resourceAccessApi.setAccessGrantEnabled(id, enabled),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['resource-access'] });
        },
      }),
  };
}

/**
 * Shorthand hook for accessible compute resources
 */
export function useAccessibleComputeResources(userId: string, groupIds?: string[]) {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || '';

  return useQuery({
    queryKey: ['resource-access', 'user', userId, 'COMPUTE', gatewayId, groupIds],
    queryFn: () => resourceAccessApi.getAccessibleComputeResources(userId, gatewayId, groupIds),
    enabled: !!userId && !!gatewayId,
  });
}

/**
 * Shorthand hook for accessible storage resources
 */
export function useAccessibleStorageResources(userId: string, groupIds?: string[]) {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || '';

  return useQuery({
    queryKey: ['resource-access', 'user', userId, 'STORAGE', gatewayId, groupIds],
    queryFn: () => resourceAccessApi.getAccessibleStorageResources(userId, gatewayId, groupIds),
    enabled: !!userId && !!gatewayId,
  });
}
