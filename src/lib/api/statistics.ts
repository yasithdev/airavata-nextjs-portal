import { apiClient } from "./client";

export interface ExperimentSummary {
  experimentId: string;
  experimentName: string;
  projectId: string;
  gatewayId: string;
  userName: string;
  creationTime: number;
  experimentStatus: string;
  statusUpdateTime: number;
  description?: string;
  executionId?: string;
  resourceHostId?: string;
}

export interface ExperimentStatistics {
  total: number;
  byStatus: Record<string, number>;
  byGateway: Record<string, number>;
  byUser: Record<string, number>;
  recent: ExperimentSummary[];
  // Raw counts for detailed views
  completedExperimentCount: number;
  failedExperimentCount: number;
  runningExperimentCount: number;
  createdExperimentCount: number;
  cancelledExperimentCount: number;
}

export interface SystemStatistics {
  totalGateways: number;
  totalComputeResources: number;
  totalStorageResources: number;
  totalApplications: number;
  totalUsers: number;
}

export const statisticsApi = {
  /**
   * Get experiment statistics from the backend.
   * Returns counts and lists grouped by status (completed, failed, running, created, cancelled).
   */
  getExperimentStatistics: async (
    gatewayId?: string,
    options?: {
      fromTime?: number;
      toTime?: number;
      userName?: string;
      applicationName?: string;
      resourceHostName?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ExperimentStatistics> => {
    const params = new URLSearchParams();
    if (gatewayId) params.append("gatewayId", gatewayId);
    if (options?.fromTime) params.append("fromTime", options.fromTime.toString());
    if (options?.toTime) params.append("toTime", options.toTime.toString());
    if (options?.userName) params.append("userName", options.userName);
    if (options?.applicationName) params.append("applicationName", options.applicationName);
    if (options?.resourceHostName) params.append("resourceHostName", options.resourceHostName);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const url = `/api/v1/statistics/experiments${params.toString() ? `?${params.toString()}` : ""}`;
    return apiClient.get<ExperimentStatistics>(url);
  },

  /**
   * Get system-wide statistics including counts of gateways, compute resources,
   * storage resources, applications, and users.
   */
  getSystemStatistics: async (gatewayId?: string): Promise<SystemStatistics> => {
    const url = gatewayId
      ? `/api/v1/statistics/system?gatewayId=${gatewayId}`
      : "/api/v1/statistics/system";
    return apiClient.get<SystemStatistics>(url);
  },
};
