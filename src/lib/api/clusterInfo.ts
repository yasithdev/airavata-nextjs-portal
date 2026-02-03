import { apiClient } from "./client";
import type { BatchQueue } from "@/types";

export interface PartitionInfo {
  partitionName: string;
  nodeCount: number;
  maxCpusPerNode: number;
  maxGpusPerNode: number;
  accounts: string[];
}

export interface ClusterInfo {
  partitions: PartitionInfo[];
  fetchedAt: string | null;
  accounts: string[];
}

/** Default max runtime (min) and max memory (GB) when not provided by slurminfo. */
const DEFAULT_MAX_RUNTIME_MIN = 60;
const DEFAULT_MAX_MEMORY_GB = 0;

/**
 * Map SLURM partition info (from slurminfo.sh) to BatchQueue for compute resource form.
 * Node counts, CPUs, GPUs are at partition/queue level; maxRunTime and maxMemory use defaults.
 */
export function partitionsToBatchQueues(partitions: PartitionInfo[]): BatchQueue[] {
  if (!partitions?.length) return [];
  return partitions.map((p) => ({
    queueName: p.partitionName ?? "",
    maxNodes: p.nodeCount ?? 0,
    maxProcessors: (p.maxCpusPerNode ?? 0) * (p.nodeCount ?? 0),
    cpuPerNode: p.maxCpusPerNode ?? 0,
    gpuPerNode: p.maxGpusPerNode ?? 0,
    maxMemory: DEFAULT_MAX_MEMORY_GB,
    maxRunTime: DEFAULT_MAX_RUNTIME_MIN,
  }));
}

export interface FetchClusterInfoRequest {
  credentialToken: string;
  computeResourceId: string;
  hostname: string;
  port?: number;
  gatewayId?: string;
  /** Login username for SSH (required when credential has no username; set per resource). */
  loginUsername?: string;
}

export const clusterInfoApi = {
  fetch: async (
    request: FetchClusterInfoRequest
  ): Promise<ClusterInfo> => {
    const { credentialToken, computeResourceId, hostname, port = 22, gatewayId, loginUsername } = request;
    const body: Record<string, unknown> = {
      credentialToken,
      computeResourceId,
      hostname,
      port,
    };
    if (gatewayId) body.gatewayId = gatewayId;
    if (loginUsername) body.loginUsername = loginUsername;
    const data = await apiClient.post<ClusterInfo>("/api/v1/cluster-info/fetch", body);
    return data;
  },

  get: async (
    credentialToken: string,
    computeResourceId: string
  ): Promise<ClusterInfo | null> => {
    try {
      const data = await apiClient.get<ClusterInfo>(
        `/api/v1/cluster-info/${encodeURIComponent(credentialToken)}/${encodeURIComponent(computeResourceId)}`
      );
      return data;
    } catch {
      return null;
    }
  },

  delete: async (
    credentialToken: string,
    computeResourceId: string
  ): Promise<void> => {
    await apiClient.delete(
      `/api/v1/cluster-info/${encodeURIComponent(credentialToken)}/${encodeURIComponent(computeResourceId)}`
    );
  },
};
