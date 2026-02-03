import { apiClient } from './client';
import {
  GroupSelectionRequest,
  PreferenceLevel,
  PreferenceResourceType,
  ResolvedPreferences,
  ResolvedPreferencesResult,
  SetPreferenceRequest,
} from '@/types';

const BASE_URL = '/api/v1/preferences';

/**
 * Preferences API - 3-level hierarchy (SYSTEM > GATEWAY > GROUP) with conflict resolution
 */
export const preferencesApi = {
  /**
   * Resolve effective preferences for a resource (returns flat map; use resolvePreferencesWithConflicts for conflict info)
   */
  resolvePreferences: async (
    resourceType: PreferenceResourceType,
    resourceId: string,
    gatewayId: string,
    userId?: string,
    groupIds?: string[]
  ): Promise<ResolvedPreferences> => {
    const result = await preferencesApi.resolvePreferencesWithConflicts(
      resourceType,
      resourceId,
      gatewayId,
      userId,
      groupIds
    );
    return result.resolved;
  },

  /**
   * Resolve preferences with conflict detection (when multiple groups have same key)
   */
  resolvePreferencesWithConflicts: async (
    resourceType: PreferenceResourceType,
    resourceId: string,
    gatewayId: string,
    userId?: string,
    groupIds?: string[]
  ): Promise<ResolvedPreferencesResult> => {
    const params = new URLSearchParams({
      resourceType,
      resourceId,
      gatewayId,
      withConflicts: 'true',
    });
    if (userId) params.append('userId', userId);
    if (groupIds?.length) params.append('groupIds', groupIds.join(','));

    return apiClient.get<ResolvedPreferencesResult>(`${BASE_URL}/resolve?${params}`);
  },

  /**
   * Resolve compute preferences for a user (shorthand)
   */
  resolveComputePreferences: async (
    computeResourceId: string,
    gatewayId: string,
    userId?: string,
    groupIds?: string[]
  ): Promise<ResolvedPreferences> => {
    return preferencesApi.resolvePreferences(
      PreferenceResourceType.COMPUTE,
      computeResourceId,
      gatewayId,
      userId,
      groupIds
    );
  },

  /**
   * Resolve storage preferences for a user (shorthand)
   */
  resolveStoragePreferences: async (
    storageResourceId: string,
    gatewayId: string,
    userId?: string,
    groupIds?: string[]
  ): Promise<ResolvedPreferences> => {
    return preferencesApi.resolvePreferences(
      PreferenceResourceType.STORAGE,
      storageResourceId,
      gatewayId,
      userId,
      groupIds
    );
  },

  /**
   * Get preferences at a specific level (unresolved)
   */
  getPreferencesAtLevel: async (
    resourceType: PreferenceResourceType,
    resourceId: string,
    ownerId: string,
    level: PreferenceLevel
  ): Promise<Record<string, string>> => {
    const params = new URLSearchParams({ level, ownerId });
    return apiClient.get<Record<string, string>>(
      `${BASE_URL}/${resourceType}/${resourceId}?${params}`
    );
  },

  /**
   * Get detailed preferences at a specific level (includes enforced status)
   */
  getPreferencesAtLevelDetailed: async (
    resourceType: PreferenceResourceType,
    resourceId: string,
    ownerId: string,
    level: PreferenceLevel
  ): Promise<Array<{ key: string; value: string; enforced: boolean }>> => {
    const params = new URLSearchParams({ level, ownerId, detailed: 'true' });
    return apiClient.get<Array<{ key: string; value: string; enforced: boolean }>>(
      `${BASE_URL}/${resourceType}/${resourceId}?${params}`
    );
  },

  /**
   * Get gateway-level preferences for a resource
   */
  getGatewayPreferences: async (
    resourceType: PreferenceResourceType,
    resourceId: string,
    gatewayId: string
  ): Promise<Record<string, string>> => {
    return preferencesApi.getPreferencesAtLevel(
      resourceType,
      resourceId,
      gatewayId,
      PreferenceLevel.GATEWAY
    );
  },

  /**
   * Get group-level preferences for a resource
   */
  getGroupPreferences: async (
    resourceType: PreferenceResourceType,
    resourceId: string,
    groupId: string
  ): Promise<Record<string, string>> => {
    return preferencesApi.getPreferencesAtLevel(
      resourceType,
      resourceId,
      groupId,
      PreferenceLevel.GROUP
    );
  },

  /**
   * Get user-level preferences for a resource
   */
  getUserPreferences: async (
    resourceType: PreferenceResourceType,
    resourceId: string,
    userId: string
  ): Promise<Record<string, string>> => {
    return preferencesApi.getPreferencesAtLevel(
      resourceType,
      resourceId,
      userId,
      PreferenceLevel.USER
    );
  },

  /**
   * Set a preference at a specific level
   */
  setPreference: async (request: SetPreferenceRequest): Promise<void> => {
    await apiClient.post(BASE_URL, request);
  },

  /**
   * Set multiple preferences at once
   */
  setPreferences: async (
    resourceType: PreferenceResourceType,
    resourceId: string,
    ownerId: string,
    level: PreferenceLevel,
    preferences: Record<string, string>
  ): Promise<void> => {
    const requests = Object.entries(preferences).map(([key, value]) =>
      preferencesApi.setPreference({
        resourceType,
        resourceId,
        ownerId,
        level,
        key,
        value,
      })
    );
    await Promise.all(requests);
  },

  /**
   * Delete a preference at a specific level
   */
  deletePreference: async (
    resourceType: PreferenceResourceType,
    resourceId: string,
    ownerId: string,
    level: PreferenceLevel,
    key: string
  ): Promise<void> => {
    const params = new URLSearchParams({ level, ownerId, key });
    await apiClient.delete(`${BASE_URL}/${resourceType}/${resourceId}?${params}`);
  },

  /**
   * Set explicit group selection when multiple groups have conflicting preferences (Zanzibar conflict resolution)
   */
  setGroupSelection: async (
    gatewayId: string,
    request: GroupSelectionRequest
  ): Promise<void> => {
    await apiClient.post(
      `${BASE_URL}/selection?gatewayId=${gatewayId}`,
      request
    );
  },

  /**
   * Delete all preferences for a resource at a specific level
   */
  deleteAllPreferences: async (
    resourceType: PreferenceResourceType,
    resourceId: string,
    ownerId: string,
    level: PreferenceLevel
  ): Promise<void> => {
    const params = new URLSearchParams({ level, ownerId });
    await apiClient.delete(`${BASE_URL}/${resourceType}/${resourceId}/all?${params}`);
  },
};
