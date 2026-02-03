import { apiClient } from "./client";

export interface CredentialSummary {
  token: string;
  gatewayId: string;
  /** User-given name to identify this credential. */
  name?: string;
  /** Optional; from resource context (e.g. access grant). Login username is not stored on the credential. */
  username?: string | null;
  publicKey?: string;
  description?: string;
  persistedTime?: number;
  type: string;
}

export interface SSHCredential {
  gatewayId: string;
  /** User-given name to identify this credential. */
  name: string;
  publicKey: string;
  privateKey: string;
  passphrase?: string;
  description?: string;
  /** Owner (e.g. email); backend sets ownerId = userId@gatewayId for access-control. */
  userId?: string;
}

export interface PasswordCredential {
  gatewayId: string;
  /** User-given name to identify this credential. */
  name: string;
  password: string;
  description?: string;
  /** Owner (e.g. email); backend sets ownerId = userId@gatewayId for access-control. */
  userId?: string;
}

export const credentialsApi = {
  list: async (gatewayId?: string): Promise<CredentialSummary[]> => {
    // If no gatewayId provided, fetch all credentials (admin mode)
    if (gatewayId) {
      return apiClient.get<CredentialSummary[]>(`/api/v1/credential-summaries`, {
        params: { gatewayId },
      });
    }
    return apiClient.get<CredentialSummary[]>(`/api/v1/credential-summaries`);
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

  getSummary: async (token: string, gatewayId: string): Promise<CredentialSummary> => {
    return apiClient.get<CredentialSummary>(`/api/v1/credential-summaries/${token}?gatewayId=${gatewayId}`);
  },

  /** Owned-only credentials (userId@gatewayId); includes those with no access grants. Uses scope=owned to avoid path conflict with /credential-summaries/{token}. */
  listOwned: async (gatewayId: string, userId?: string): Promise<CredentialSummary[]> => {
    const params = new URLSearchParams({ gatewayId, scope: "owned" });
    if (userId != null && userId !== "") params.append("userId", userId);
    return apiClient.get<CredentialSummary[]>(`/api/v1/credential-summaries?${params}`);
  },
};
