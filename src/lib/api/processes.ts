import { apiClient } from "./client";
import type { ProcessModel, ComputationalResourceSchedulingModel } from "@/types";

export const processesApi = {
  get: async (processId: string): Promise<ProcessModel> => {
    return apiClient.get<ProcessModel>(`/api/v1/processes/${processId}`);
  },

  list: async (experimentId: string): Promise<ProcessModel[]> => {
    return apiClient.get<ProcessModel[]>(`/api/v1/processes?experimentId=${experimentId}`);
  },

  create: async (
    process: Partial<ProcessModel>,
    experimentId: string
  ): Promise<{ processId: string }> => {
    return apiClient.post<{ processId: string }>(
      `/api/v1/processes?experimentId=${experimentId}`,
      process
    );
  },

  update: async (processId: string, process: Partial<ProcessModel>): Promise<void> => {
    return apiClient.put(`/api/v1/processes/${processId}`, process);
  },

  getResourceSchedule: async (processId: string): Promise<ComputationalResourceSchedulingModel> => {
    return apiClient.get<ComputationalResourceSchedulingModel>(
      `/api/v1/processes/${processId}/resource-schedule`
    );
  },

  createResourceSchedule: async (
    processId: string,
    schedule: Partial<ComputationalResourceSchedulingModel>
  ): Promise<void> => {
    return apiClient.post(`/api/v1/processes/${processId}/resource-schedule`, schedule);
  },

  updateResourceSchedule: async (
    processId: string,
    schedule: Partial<ComputationalResourceSchedulingModel>
  ): Promise<void> => {
    return apiClient.put(`/api/v1/processes/${processId}/resource-schedule`, schedule);
  },
};
