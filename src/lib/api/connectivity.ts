import { apiClient } from "./client";

export interface SSHTestRequest {
  host: string;
  port?: number;
  username: string;
  privateKey?: string;
  password?: string;
}

export interface SLURMTestRequest {
  host: string;
  sshPort?: number;
  slurmPort?: number;
}

export interface ConnectivityTestResult {
  success: boolean;
  message: string;
  details?: string;
  authentication?: string;
  sshPort?: number;
  sshAccessible?: boolean;
  slurmPort?: number;
  slurmAccessible?: boolean;
}

export const connectivityApi = {
  testSSH: async (request: SSHTestRequest): Promise<ConnectivityTestResult> => {
    return apiClient.post<ConnectivityTestResult>("/api/v1/connectivity-test/ssh", request);
  },

  testSFTP: async (request: SSHTestRequest): Promise<ConnectivityTestResult> => {
    return apiClient.post<ConnectivityTestResult>("/api/v1/connectivity-test/sftp", request);
  },

  testSLURM: async (request: SLURMTestRequest): Promise<ConnectivityTestResult> => {
    return apiClient.post<ConnectivityTestResult>("/api/v1/connectivity-test/slurm", request);
  },
};
