import { apiClient } from "./client";
import type { ComputeResourceDescription } from "@/types";

export const computeResourcesApi = {
  list: async (): Promise<Record<string, string>> => {
    return apiClient.get<Record<string, string>>("/api/v1/compute-resources");
  },

  get: async (computeResourceId: string): Promise<ComputeResourceDescription> => {
    return apiClient.get<ComputeResourceDescription>(`/api/v1/compute-resources/${computeResourceId}`);
  },

  create: async (resource: Partial<ComputeResourceDescription>): Promise<{ computeResourceId: string }> => {
    return apiClient.post<{ computeResourceId: string }>("/api/v1/compute-resources", resource);
  },

  update: async (computeResourceId: string, resource: Partial<ComputeResourceDescription>): Promise<void> => {
    return apiClient.put(`/api/v1/compute-resources/${computeResourceId}`, resource);
  },

  delete: async (computeResourceId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/compute-resources/${computeResourceId}`);
  },

  /**
   * Check if a compute resource exists at higher levels (GATEWAY or GROUP)
   * and return information about where it's defined.
   */
  getHierarchy: async (
    computeResourceId: string,
    gatewayId: string
  ): Promise<{
    exists: boolean;
    canCreate: boolean;
    canOverride: boolean;
    level: "NONE" | "GATEWAY" | "GROUP";
    resourceId: string;
  }> => {
    return apiClient.get(
      `/api/v1/compute-resources/${computeResourceId}/hierarchy?gatewayId=${gatewayId}`
    );
  },
};
