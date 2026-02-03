import { apiClient } from "./client";

export interface SSHTestRequest {
  host: string;
  port?: number;
  /** Login username (per resource; optional when only testing port). */
  username?: string;
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
  portAccessible?: boolean;
  username?: string;
  auth_validated?: boolean;
}

export interface SSHValidateRequest {
  credentialToken: string;
  hostname: string;
  port?: number;
  gatewayId?: string;
  /** Login username for SSH (required when credential has no username; set per resource). */
  loginUsername?: string;
}

export const connectivityApi = {
  testSSH: async (request: SSHTestRequest): Promise<ConnectivityTestResult> => {
    return apiClient.post<ConnectivityTestResult>("/api/v1/connectivity-test/ssh", request);
  },

  validateSSH: async (request: SSHValidateRequest): Promise<ConnectivityTestResult> => {
    return apiClient.post<ConnectivityTestResult>("/api/v1/connectivity-test/ssh/validate", request);
  },

  testSFTP: async (request: SSHTestRequest): Promise<ConnectivityTestResult> => {
    return apiClient.post<ConnectivityTestResult>("/api/v1/connectivity-test/sftp", request);
  },

  testSLURM: async (request: SLURMTestRequest): Promise<ConnectivityTestResult> => {
    return apiClient.post<ConnectivityTestResult>("/api/v1/connectivity-test/slurm", request);
  },
};
