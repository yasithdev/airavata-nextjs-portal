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
 * Resource Access API — manages access grants that link credentials to compute or storage resources.
 * Each grant can include a login username for that resource; credentials do not store login username.
 * Resource access grants link users/credentials to compute or storage resources with optional login username.
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
   * Grant access to a storage resource at gateway level
   */
  grantGatewayStorageAccess: async (
    storageResourceId: string,
    gatewayId: string,
    credentialToken?: string
  ): Promise<ResourceAccess> => {
    return resourceAccessApi.createAccessGrant({
      resourceType: PreferenceResourceType.STORAGE,
      resourceId: storageResourceId,
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

  /**
   * Get unified access control view with credentials and their associated resources
   */
  getAccessControl: async (
    gatewayId: string,
    userId?: string
  ): Promise<{
    credentials: Array<{
      token: string;
      name?: string;
      username: string;
      type: string;
      description: string;
      persistedTime: number;
      ownership: "OWNED" | "INHERITED";
      source: "USER" | "GROUP" | "GATEWAY";
      sourceId: string;
      computeResources: Array<{ resourceId: string; loginUsername: string }>;
      storageResources: Array<{ resourceId: string; loginUsername: string }>;
    }>;
  }> => {
    const params = new URLSearchParams({ gatewayId });
    if (userId) params.append("userId", userId);
    return apiClient.get(`${BASE_URL}/access-control?${params}`);
  },

  /**
   * Debug endpoint: returns gatewayId, userId, airavataInternalUserId, ownedTokenIds, ownedCount.
   * Use to verify DB storage and API output when credentials don’t appear.
   */
  getAccessControlDebug: async (
    gatewayId: string,
    userId: string
  ): Promise<{
    gatewayId: string;
    userId: string;
    airavataInternalUserId: string;
    ownedTokenIds: string[];
    ownedCount: number;
    ownedError?: string;
  }> => {
    const params = new URLSearchParams({ gatewayId, userId });
    return apiClient.get(`${BASE_URL}/access-control/debug?${params}`);
  },
};
