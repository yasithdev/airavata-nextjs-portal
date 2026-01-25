import { apiClient } from "./client";

export interface CredentialSummary {
  token: string;
  gatewayId: string;
  username: string;
  publicKey?: string;
  description?: string;
  persistedTime?: number;
  type: string;
}

export interface SSHCredential {
  gatewayId: string;
  username: string;
  publicKey: string;
  privateKey: string;
  passphrase?: string;
  description?: string;
}

export interface PasswordCredential {
  gatewayId: string;
  loginUsername: string;
  password: string;
  description?: string;
}

export const credentialsApi = {
  list: async (gatewayId?: string): Promise<CredentialSummary[]> => {
    // If no gatewayId provided, fetch all credentials (admin mode)
    const url = gatewayId 
      ? `/api/v1/credential-summaries?gatewayId=${gatewayId}`
      : `/api/v1/credential-summaries`;
    return apiClient.get<CredentialSummary[]>(url);
  },

  getSSH: async (token: string, gatewayId: string): Promise<SSHCredential & { token: string }> => {
    return apiClient.get<SSHCredential & { token: string }>(`/api/v1/credentials/ssh/${token}?gatewayId=${gatewayId}`);
  },

  getPassword: async (token: string, gatewayId: string): Promise<PasswordCredential & { token: string }> => {
    return apiClient.get<PasswordCredential & { token: string }>(`/api/v1/credentials/password/${token}?gatewayId=${gatewayId}`);
  },

  createSSH: async (credential: SSHCredential): Promise<{ token: string }> => {
    return apiClient.post<{ token: string }>("/api/v1/credentials/ssh", credential);
  },

  createPassword: async (credential: PasswordCredential): Promise<{ token: string }> => {
    return apiClient.post<{ token: string }>("/api/v1/credentials/password", credential);
  },

  delete: async (token: string, gatewayId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/credentials/${token}?gatewayId=${gatewayId}`);
  },

  generateKeyPair: async (keySize: number = 2048): Promise<{ privateKey: string; publicKey: string; keySize: string }> => {
    return apiClient.post<{ privateKey: string; publicKey: string; keySize: string }>(`/api/v1/ssh-keygen?keySize=${keySize}`);
  },
};
