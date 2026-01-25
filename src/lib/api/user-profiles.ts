import { apiClient } from "./client";
import type { UserResourceProfile, UserComputeResourcePreference, UserStoragePreference } from "@/types";

export const userProfilesApi = {
  get: async (userId: string, gatewayId: string): Promise<UserResourceProfile> => {
    return apiClient.get<UserResourceProfile>(`/api/v1/user-resource-profiles/${userId}?gatewayId=${gatewayId}`);
  },

  list: async (): Promise<UserResourceProfile[]> => {
    return apiClient.get<UserResourceProfile[]>("/api/v1/user-resource-profiles");
  },

  create: async (profile: Partial<UserResourceProfile>): Promise<{ userId: string }> => {
    return apiClient.post<{ userId: string }>("/api/v1/user-resource-profiles", profile);
  },

  update: async (userId: string, gatewayId: string, profile: Partial<UserResourceProfile>): Promise<void> => {
    return apiClient.put(`/api/v1/user-resource-profiles/${userId}?gatewayId=${gatewayId}`, profile);
  },

  delete: async (userId: string, gatewayId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/user-resource-profiles/${userId}?gatewayId=${gatewayId}`);
  },

  getComputePreferences: async (userId: string, gatewayId: string): Promise<UserComputeResourcePreference[]> => {
    return apiClient.get<UserComputeResourcePreference[]>(
      `/api/v1/user-resource-profiles/${userId}/compute-preferences?gatewayId=${gatewayId}`
    );
  },

  getStoragePreferences: async (userId: string, gatewayId: string): Promise<UserStoragePreference[]> => {
    return apiClient.get<UserStoragePreference[]>(
      `/api/v1/user-resource-profiles/${userId}/storage-preferences?gatewayId=${gatewayId}`
    );
  },
};
