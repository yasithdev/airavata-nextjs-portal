import { apiClient } from "./client";
import type { Gateway } from "@/types";

export const gatewaysApi = {
  list: async (): Promise<Gateway[]> => {
    return apiClient.get<Gateway[]>("/api/v1/gateways");
  },

  get: async (gatewayId: string): Promise<Gateway> => {
    return apiClient.get<Gateway>(`/api/v1/gateways/${gatewayId}`);
  },

  create: async (gateway: Partial<Gateway>): Promise<{ gatewayId: string }> => {
    return apiClient.post<{ gatewayId: string }>("/api/v1/gateways", gateway);
  },

  update: async (gatewayId: string, gateway: Partial<Gateway>): Promise<void> => {
    return apiClient.put(`/api/v1/gateways/${gatewayId}`, gateway);
  },

  delete: async (gatewayId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/gateways/${gatewayId}`);
  },
};
