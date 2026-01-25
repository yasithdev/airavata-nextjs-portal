import { apiClient } from "./client";
import type { ExperimentModel } from "@/types";

export interface ExperimentStatistics {
  total: number;
  byStatus: Record<string, number>;
  byGateway: Record<string, number>;
  byUser: Record<string, number>;
  recent: ExperimentModel[];
}

export interface SystemStatistics {
  totalExperiments: number;
  totalUsers: number;
  totalGateways: number;
  totalComputeResources: number;
  totalStorageResources: number;
  totalApplications: number;
  totalProjects: number;
}

export const statisticsApi = {
  // Aggregate statistics from various endpoints
  getExperimentStatistics: async (gatewayId?: string): Promise<ExperimentStatistics> => {
    const url = gatewayId
      ? `/api/v1/statistics/experiments?gatewayId=${gatewayId}`
      : "/api/v1/statistics/experiments";
    return apiClient.get<ExperimentStatistics>(url);
  },

  getSystemStatistics: async (): Promise<SystemStatistics> => {
    return apiClient.get<SystemStatistics>("/api/v1/statistics/system");
  },

  // Alternative: Aggregate from existing endpoints if dedicated stats endpoint doesn't exist
  aggregateStatistics: async (gatewayId?: string): Promise<ExperimentStatistics> => {
    try {
      // Try to get experiments - backend may require userName or projectId
      // For admin stats, we'll try with just gatewayId, but handle errors gracefully
      const url = gatewayId ? `/api/v1/experiments?gatewayId=${gatewayId}` : "/api/v1/experiments";
      const experiments = await apiClient.get<ExperimentModel[]>(url);

      const byStatus: Record<string, number> = {};
      const byGateway: Record<string, number> = {};
      const byUser: Record<string, number> = {};

      if (Array.isArray(experiments)) {
        experiments.forEach((exp) => {
          const status = exp.experimentStatus?.[0]?.state || "UNKNOWN";
          byStatus[status] = (byStatus[status] || 0) + 1;
          byGateway[exp.gatewayId] = (byGateway[exp.gatewayId] || 0) + 1;
          byUser[exp.userName] = (byUser[exp.userName] || 0) + 1;
        });
      }

      return {
        total: Array.isArray(experiments) ? experiments.length : 0,
        byStatus,
        byGateway,
        byUser,
        recent: Array.isArray(experiments) ? experiments.slice(0, 10) : [],
      };
    } catch (error) {
      // Return empty stats if fetch fails
      return {
        total: 0,
        byStatus: {},
        byGateway: {},
        byUser: {},
        recent: [],
      };
    }
  },
};
