import { apiClient } from "./client";
import type { ResourceAccessGrant } from "@/types";

const BASE_URL = "/api/v1/resource-access-grants";

/**
 * API client for unified resource access grants (credential + compute resource + deployment settings).
 */
export const resourceAccessGrantsApi = {
  list: async (params: {
    gatewayId?: string;
    credentialToken?: string;
    computeResourceId?: string;
    enabledOnly?: boolean;
  }): Promise<ResourceAccessGrant[]> => {
    const search = new URLSearchParams();
    if (params.gatewayId) search.set("gatewayId", params.gatewayId);
    if (params.credentialToken) search.set("credentialToken", params.credentialToken);
    if (params.computeResourceId) search.set("computeResourceId", params.computeResourceId);
    if (params.enabledOnly) search.set("enabledOnly", "true");
    const qs = search.toString();
    return apiClient.get<ResourceAccessGrant[]>(qs ? `${BASE_URL}?${qs}` : BASE_URL);
  },

  getById: async (id: number): Promise<ResourceAccessGrant> => {
    return apiClient.get<ResourceAccessGrant>(`${BASE_URL}/${id}`);
  },

  create: async (grant: Omit<ResourceAccessGrant, "id" | "creationTime" | "updateTime">): Promise<ResourceAccessGrant> => {
    return apiClient.post<ResourceAccessGrant>(BASE_URL, grant);
  },

  update: async (id: number, grant: Partial<ResourceAccessGrant>): Promise<ResourceAccessGrant> => {
    return apiClient.put<ResourceAccessGrant>(`${BASE_URL}/${id}`, grant);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },
};
