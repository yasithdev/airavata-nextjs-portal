import { apiClient } from "./client";
import type { JobModel } from "@/types";

export const jobsApi = {
  get: async (jobId: string, taskId?: string): Promise<JobModel> => {
    const url = taskId
      ? `/api/v1/jobs/${jobId}?taskId=${taskId}`
      : `/api/v1/jobs/${jobId}`;
    return apiClient.get<JobModel>(url);
  },

  list: async (params: {
    processId?: string;
    taskId?: string;
    jobId?: string;
  }): Promise<JobModel[]> => {
    const queryParams = new URLSearchParams();
    if (params.processId) queryParams.append("processId", params.processId);
    if (params.taskId) queryParams.append("taskId", params.taskId);
    if (params.jobId) queryParams.append("jobId", params.jobId);
    
    return apiClient.get<JobModel[]>(`/api/v1/jobs?${queryParams.toString()}`);
  },

  create: async (
    job: Partial<JobModel>,
    processId: string
  ): Promise<{ jobId: string }> => {
    return apiClient.post<{ jobId: string }>(
      `/api/v1/jobs?processId=${processId}`,
      job
    );
  },

  update: async (jobId: string, job: Partial<JobModel>, taskId?: string): Promise<void> => {
    const url = taskId
      ? `/api/v1/jobs/${jobId}?taskId=${taskId}`
      : `/api/v1/jobs/${jobId}`;
    return apiClient.put(url, job);
  },
};
