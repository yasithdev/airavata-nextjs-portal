import { apiClient } from "./client";
import type { AiravataWorkflow } from "@/types";

export const workflowsApi = {
  get: async (workflowId: string): Promise<AiravataWorkflow> => {
    return apiClient.get<AiravataWorkflow>(`/api/v1/workflows/${workflowId}`);
  },

  getByExperiment: async (experimentId: string): Promise<AiravataWorkflow> => {
    return apiClient.get<AiravataWorkflow>(`/api/v1/workflows/experiment/${experimentId}`);
  },

  register: async (workflow: Partial<AiravataWorkflow>, experimentId: string): Promise<{ workflowId: string }> => {
    return apiClient.post<{ workflowId: string }>(`/api/v1/workflows?experimentId=${experimentId}`, workflow);
  },

  list: async (): Promise<AiravataWorkflow[]> => {
    // Note: Backend may not have a list endpoint, but we can search by experiment
    // This is a placeholder - may need backend endpoint
    return apiClient.get<AiravataWorkflow[]>("/api/v1/workflows");
  },

  update: async (workflowId: string, workflow: Partial<AiravataWorkflow>): Promise<void> => {
    return apiClient.put(`/api/v1/workflows/${workflowId}`, workflow);
  },

  delete: async (workflowId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/workflows/${workflowId}`);
  },
};
