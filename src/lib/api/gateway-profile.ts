import { apiClient } from "./client";

export interface GatewayResourceProfile {
  gatewayID: string;
  credentialStoreToken?: string;
  computeResourcePreferences?: any[];
  storagePreferences?: any[];
}

export const gatewayProfileApi = {
  get: async (gatewayId: string): Promise<GatewayResourceProfile> => {
    return apiClient.get<GatewayResourceProfile>(`/api/v1/gateway-resource-profile/${gatewayId}`);
  },

  update: async (gatewayId: string, profile: Partial<GatewayResourceProfile>): Promise<void> => {
    return apiClient.put(`/api/v1/gateway-resource-profile/${gatewayId}`, profile);
  },
};
