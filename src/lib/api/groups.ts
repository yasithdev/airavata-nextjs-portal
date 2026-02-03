import { apiClient } from "./client";

export interface Group {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  gatewayId: string;
  members?: GroupMember[];
  admins?: string[];
  createdTime?: number;
  /** True if this is the user's auto-created personal group (Zanzibar model) */
  isPersonalGroup?: boolean;
}

export interface GroupMember {
  userId: string;
  username: string;
  email?: string;
}

export const groupsApi = {
  list: async (gatewayId: string): Promise<Group[]> => {
    return apiClient.get<Group[]>(`/api/v1/groups?gatewayId=${gatewayId}`);
  },

  get: async (groupId: string): Promise<Group> => {
    return apiClient.get<Group>(`/api/v1/groups/${groupId}`);
  },

  create: async (group: Partial<Group>): Promise<{ groupId: string }> => {
    return apiClient.post<{ groupId: string }>("/api/v1/groups", group);
  },

  update: async (groupId: string, group: Partial<Group>): Promise<void> => {
    return apiClient.put(`/api/v1/groups/${groupId}`, group);
  },

  delete: async (groupId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/groups/${groupId}`);
  },

  addMember: async (groupId: string, userId: string): Promise<void> => {
    return apiClient.post(`/api/v1/groups/${groupId}/members`, { userId });
  },

  removeMember: async (groupId: string, userId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/groups/${groupId}/members/${userId}`);
  },

  /**
   * Get the current user's personal group (Zanzibar model: every user has one).
   * Personal group ID format: userId@gatewayId_personal
   */
  getPersonalGroup: async (gatewayId: string): Promise<Group | null> => {
    try {
      const list = await groupsApi.list(gatewayId);
      const personal = list.find((g) => g.isPersonalGroup === true);
      return personal ?? null;
    } catch {
      return null;
    }
  },
};
