import { apiClient } from "./client";

export interface Notice {
  notificationId: string;
  gatewayId: string;
  title: string;
  notificationMessage: string;
  creationTime?: number;
  publishedTime?: number;
  expirationTime?: number;
  priority: "LOW" | "NORMAL" | "HIGH";
}

export const noticesApi = {
  list: async (gatewayId: string): Promise<Notice[]> => {
    return apiClient.get<Notice[]>(`/api/v1/notices?gatewayId=${gatewayId}`);
  },

  get: async (notificationId: string): Promise<Notice> => {
    return apiClient.get<Notice>(`/api/v1/notices/${notificationId}`);
  },

  create: async (notice: Partial<Notice>): Promise<{ noticeId: string }> => {
    return apiClient.post<{ noticeId: string }>("/api/v1/notices", notice);
  },

  update: async (notificationId: string, notice: Partial<Notice>): Promise<void> => {
    return apiClient.put(`/api/v1/notices/${notificationId}`, notice);
  },

  delete: async (notificationId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/notices/${notificationId}`);
  },
};
