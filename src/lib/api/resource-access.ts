import { apiClient } from './client';
import {
  AccessGrantRequest,
  AccessGrantUpdateRequest,
  PreferenceLevel,
  PreferenceResourceType,
  ResourceAccess,
} from '@/types';

const BASE_URL = '/api/v1/resource-access';

/**
 * Resource Access API - Manages access grants at GATEWAY, GROUP, USER levels
 * Links resources to credential tokens and controls access
 */
export const resourceAccessApi = {
  /**
   * Get all access grants for a resource
   */
  getAccessGrants: async (
    resourceType: PreferenceResourceType,
    resourceId: string
  ): Promise<ResourceAccess[]> => {
    const params = new URLSearchParams({ resourceType, resourceId });
    return apiClient.get<ResourceAccess[]>(`${BASE_URL}?${params}`);
  },

  /**
   * Get accessible resource IDs for a user
   */
  getAccessibleResources: async (
    userId: string,
    gatewayId: string,
    resourceType: PreferenceResourceType,
    groupIds?: string[]
  ): Promise<string[]> => {
    const params = new URLSearchParams({ gatewayId, resourceType });
    if (groupIds?.length) params.append('groupIds', groupIds.join(','));
    
    const response = await apiClient.get<{ resourceIds: string[] }>(`${BASE_URL}/user/${userId}?${params}`);
    return response.resourceIds;
  },

  /**
   * Get accessible compute resources for a user
   */
  getAccessibleComputeResources: async (
    userId: string,
    gatewayId: string,
    groupIds?: string[]
  ): Promise<string[]> => {
    return resourceAccessApi.getAccessibleResources(
      userId,
      gatewayId,
      PreferenceResourceType.COMPUTE,
      groupIds
    );
  },

  /**
   * Get accessible storage resources for a user
   */
  getAccessibleStorageResources: async (
    userId: string,
    gatewayId: string,
    groupIds?: string[]
  ): Promise<string[]> => {
    return resourceAccessApi.getAccessibleResources(
      userId,
      gatewayId,
      PreferenceResourceType.STORAGE,
      groupIds
    );
  },

  /**
   * Create a new access grant
   */
  createAccessGrant: async (
    request: AccessGrantRequest
  ): Promise<ResourceAccess> => {
    return apiClient.post<ResourceAccess>(BASE_URL, request);
  },

  /**
   * Update an existing access grant
   */
  updateAccessGrant: async (
    id: number,
    request: AccessGrantUpdateRequest
  ): Promise<ResourceAccess> => {
    return apiClient.put<ResourceAccess>(`${BASE_URL}/${id}`, request);
  },

  /**
   * Delete an access grant
   */
  deleteAccessGrant: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Get access grants by owner
   */
  getAccessGrantsByOwner: async (
    ownerId: string,
    ownerType: PreferenceLevel
  ): Promise<ResourceAccess[]> => {
    const params = new URLSearchParams({ ownerType });
    return apiClient.get<ResourceAccess[]>(`${BASE_URL}/owner/${ownerId}?${params}`);
  },

  /**
   * Get enabled access grants for a resource
   */
  getEnabledAccessGrants: async (
    resourceType: PreferenceResourceType,
    resourceId: string
  ): Promise<ResourceAccess[]> => {
    const params = new URLSearchParams({ resourceType, resourceId });
    return apiClient.get<ResourceAccess[]>(`${BASE_URL}/enabled?${params}`);
  },

  /**
   * Get all access grants for a gateway and resource type
   */
  getAccessGrantsByType: async (
    gatewayId: string,
    resourceType: PreferenceResourceType
  ): Promise<ResourceAccess[]> => {
    const params = new URLSearchParams({ gatewayId, resourceType });
    return apiClient.get<ResourceAccess[]>(`${BASE_URL}/by-type?${params}`);
  },

  /**
   * Grant access to a compute resource at gateway level
   */
  grantGatewayComputeAccess: async (
    computeResourceId: string,
    gatewayId: string,
    credentialToken?: string
  ): Promise<ResourceAccess> => {
    return resourceAccessApi.createAccessGrant({
      resourceType: PreferenceResourceType.COMPUTE,
      resourceId: computeResourceId,
      ownerId: gatewayId,
      ownerType: PreferenceLevel.GATEWAY,
      gatewayId,
      credentialToken,
      enabled: true,
    });
  },

  /**
   * Grant access to a compute resource at group level
   */
  grantGroupComputeAccess: async (
    computeResourceId: string,
    groupId: string,
    gatewayId: string,
    credentialToken?: string
  ): Promise<ResourceAccess> => {
    return resourceAccessApi.createAccessGrant({
      resourceType: PreferenceResourceType.COMPUTE,
      resourceId: computeResourceId,
      ownerId: groupId,
      ownerType: PreferenceLevel.GROUP,
      gatewayId,
      credentialToken,
      enabled: true,
    });
  },

  /**
   * Grant access to a compute resource at user level
   */
  grantUserComputeAccess: async (
    computeResourceId: string,
    userId: string,
    gatewayId: string,
    credentialToken?: string
  ): Promise<ResourceAccess> => {
    return resourceAccessApi.createAccessGrant({
      resourceType: PreferenceResourceType.COMPUTE,
      resourceId: computeResourceId,
      ownerId: userId,
      ownerType: PreferenceLevel.USER,
      gatewayId,
      credentialToken,
      enabled: true,
    });
  },

  /**
   * Enable/disable an access grant
   */
  setAccessGrantEnabled: async (
    id: number,
    enabled: boolean
  ): Promise<ResourceAccess> => {
    return resourceAccessApi.updateAccessGrant(id, { enabled });
  },

  /**
   * Update credential token for an access grant
   */
  setAccessGrantCredential: async (
    id: number,
    credentialToken: string
  ): Promise<ResourceAccess> => {
    return resourceAccessApi.updateAccessGrant(id, { credentialToken });
  },
};
