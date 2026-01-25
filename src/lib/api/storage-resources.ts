import { apiClient } from "./client";
import type { StorageResourceDescription } from "@/types";

export const storageResourcesApi = {
  list: async (): Promise<StorageResourceDescription[]> => {
    return apiClient.get<StorageResourceDescription[]>("/api/v1/storage-resources");
  },

  get: async (storageResourceId: string): Promise<StorageResourceDescription> => {
    return apiClient.get<StorageResourceDescription>(`/api/v1/storage-resources/${storageResourceId}`);
  },

  create: async (resource: Partial<StorageResourceDescription>): Promise<{ storageResourceId: string }> => {
    return apiClient.post<{ storageResourceId: string }>("/api/v1/storage-resources", resource);
  },

  update: async (storageResourceId: string, resource: Partial<StorageResourceDescription>): Promise<void> => {
    return apiClient.put(`/api/v1/storage-resources/${storageResourceId}`, resource);
  },

  delete: async (storageResourceId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/storage-resources/${storageResourceId}`);
  },
};
