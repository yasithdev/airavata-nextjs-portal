import { apiClient } from "./client";
import type { GroupResourceProfile } from "@/types";

export const groupProfilesApi = {
  list: async (gatewayId: string): Promise<GroupResourceProfile[]> => {
    return apiClient.get<GroupResourceProfile[]>(`/api/v1/group-resource-profiles?gatewayId=${gatewayId}`);
  },

  get: async (profileId: string): Promise<GroupResourceProfile> => {
    return apiClient.get<GroupResourceProfile>(`/api/v1/group-resource-profiles/${profileId}`);
  },

  create: async (profile: Partial<GroupResourceProfile>): Promise<{ groupResourceProfileId: string }> => {
    return apiClient.post<{ groupResourceProfileId: string }>("/api/v1/group-resource-profiles", profile);
  },

  update: async (profileId: string, profile: Partial<GroupResourceProfile>): Promise<void> => {
    return apiClient.put(`/api/v1/group-resource-profiles/${profileId}`, profile);
  },

  delete: async (profileId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/group-resource-profiles/${profileId}`);
  },
};
