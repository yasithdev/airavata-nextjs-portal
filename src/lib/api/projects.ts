import { apiClient } from "./client";
import type { Project } from "@/types";

export interface ListProjectsParams {
  gatewayId?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderType?: "ASC" | "DESC";
}

export const projectsApi = {
  list: async (params: ListProjectsParams = {}): Promise<Project[]> => {
    const searchParams = new URLSearchParams();
    if (params.gatewayId) searchParams.append("gatewayId", params.gatewayId);
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.offset) searchParams.append("offset", params.offset.toString());
    if (params.orderBy) searchParams.append("orderBy", params.orderBy);
    if (params.orderType) searchParams.append("orderType", params.orderType);
    return apiClient.get<Project[]>(`/api/v1/projects?${searchParams.toString()}`);
  },

  get: async (projectId: string): Promise<Project> => {
    return apiClient.get<Project>(`/api/v1/projects/${projectId}`);
  },

  create: async (project: Partial<Project>, gatewayId: string): Promise<{ projectId: string }> => {
    // Use params option instead of URL string to avoid duplication with interceptor
    return apiClient.post<{ projectId: string }>(`/api/v1/projects`, project, {
      params: { gatewayId }
    });
  },

  update: async (projectId: string, project: Partial<Project>): Promise<void> => {
    return apiClient.put(`/api/v1/projects/${projectId}`, project);
  },

  delete: async (projectId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/projects/${projectId}`);
  },
};
