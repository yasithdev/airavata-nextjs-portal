import { apiClient } from "./client";

export interface Notice {
  noticeId: string;
  gatewayId: string;
  title: string;
  notificationMessage: string;
  publishedTime?: number;
  expirationTime?: number;
  priority: "LOW" | "NORMAL" | "HIGH";
}

export const noticesApi = {
  list: async (gatewayId: string): Promise<Notice[]> => {
    return apiClient.get<Notice[]>(`/api/v1/notices?gatewayId=${gatewayId}`);
  },

  get: async (noticeId: string): Promise<Notice> => {
    return apiClient.get<Notice>(`/api/v1/notices/${noticeId}`);
  },

  create: async (notice: Partial<Notice>): Promise<{ noticeId: string }> => {
    return apiClient.post<{ noticeId: string }>("/api/v1/notices", notice);
  },

  update: async (noticeId: string, notice: Partial<Notice>): Promise<void> => {
    return apiClient.put(`/api/v1/notices/${noticeId}`, notice);
  },

  delete: async (noticeId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/notices/${noticeId}`);
  },
};
