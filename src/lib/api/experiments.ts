import { apiClient } from "./client";
import type { ExperimentModel, ProcessModel, JobModel } from "@/types";

export interface ListExperimentsParams {
  gatewayId: string;
  userName?: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}

export const experimentsApi = {
  list: async (params: ListExperimentsParams): Promise<ExperimentModel[]> => {
    const searchParams = new URLSearchParams();
    if (params.gatewayId) searchParams.append("gatewayId", params.gatewayId);
    if (params.userName) searchParams.append("userName", params.userName);
    if (params.projectId) searchParams.append("projectId", params.projectId);
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.offset) searchParams.append("offset", params.offset.toString());
    return apiClient.get<ExperimentModel[]>(`/api/v1/experiments?${searchParams.toString()}`);
  },

  get: async (experimentId: string): Promise<ExperimentModel> => {
    return apiClient.get<ExperimentModel>(`/api/v1/experiments/${experimentId}`);
  },

  create: async (experiment: Partial<ExperimentModel>): Promise<{ experimentId: string }> => {
    return apiClient.post<{ experimentId: string }>("/api/v1/experiments", experiment);
  },

  update: async (experimentId: string, experiment: Partial<ExperimentModel>): Promise<void> => {
    return apiClient.put(`/api/v1/experiments/${experimentId}`, experiment);
  },

  delete: async (experimentId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/experiments/${experimentId}`);
  },

  getProcesses: async (experimentId: string): Promise<ProcessModel[]> => {
    return apiClient.get<ProcessModel[]>(`/api/v1/processes?experimentId=${experimentId}`);
  },

  getJobs: async (processId: string): Promise<JobModel[]> => {
    return apiClient.get<JobModel[]>(`/api/v1/jobs?processId=${processId}`);
  },

  launch: async (experimentId: string): Promise<void> => {
    return apiClient.post(`/api/v1/experiments/${experimentId}/launch`);
  },

  cancel: async (experimentId: string): Promise<void> => {
    return apiClient.post(`/api/v1/experiments/${experimentId}/cancel`);
  },

  clone: async (experimentId: string): Promise<{ experimentId: string }> => {
    return apiClient.post<{ experimentId: string }>(`/api/v1/experiments/${experimentId}/clone`);
  },
};
