import { apiClient } from "./client";

export interface User {
  airavataInternalUserId: string;
  userId: string;
  gatewayId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTime?: number;
}

export interface UserDetail extends User {
  groups?: string[];
}

export const usersApi = {
  list: async (gatewayId?: string, limit = 50, offset = 0): Promise<User[]> => {
    const params = new URLSearchParams();
    if (gatewayId) params.append("gatewayId", gatewayId);
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    return apiClient.get<User[]>(`/api/v1/users?${params.toString()}`);
  },

  get: async (userId: string, gatewayId: string): Promise<UserDetail> => {
    return apiClient.get<UserDetail>(`/api/v1/users/${userId}?gatewayId=${gatewayId}`);
  },

  update: async (userId: string, gatewayId: string, user: Partial<User>): Promise<void> => {
    return apiClient.put(`/api/v1/users/${userId}?gatewayId=${gatewayId}`, user);
  },

  enable: async (userId: string, gatewayId: string): Promise<void> => {
    return apiClient.post(`/api/v1/users/${userId}/enable?gatewayId=${gatewayId}`);
  },

  disable: async (userId: string, gatewayId: string): Promise<void> => {
    return apiClient.post(`/api/v1/users/${userId}/disable?gatewayId=${gatewayId}`);
  },

  delete: async (userId: string, gatewayId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/users/${userId}?gatewayId=${gatewayId}`);
  },
};
