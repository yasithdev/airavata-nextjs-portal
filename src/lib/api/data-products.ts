import { apiClient } from "./client";
import type { DataProductModel } from "@/types";

export interface SearchDataProductsParams {
  gatewayId: string;
  userId: string;
  productName: string;
  limit?: number;
  offset?: number;
}

export interface GetAccessibleParams {
  userId: string;
  gatewayId: string;
  groupIds?: string[];
  nameSearch?: string;
  pageNumber?: number;
  pageSize?: number;
}

export const dataProductsApi = {
  get: async (productUri: string): Promise<DataProductModel> => {
    return apiClient.get<DataProductModel>(`/api/v1/data-products/${encodeURIComponent(productUri)}`);
  },

  getParent: async (productUri: string): Promise<DataProductModel> => {
    return apiClient.get<DataProductModel>(`/api/v1/data-products/${encodeURIComponent(productUri)}/parent`);
  },

  getChildren: async (productUri: string): Promise<DataProductModel[]> => {
    return apiClient.get<DataProductModel[]>(`/api/v1/data-products/${encodeURIComponent(productUri)}/children`);
  },

  create: async (product: Partial<DataProductModel>): Promise<{ productUri: string }> => {
    return apiClient.post<{ productUri: string }>("/api/v1/data-products", product);
  },

  update: async (productUri: string, product: Partial<DataProductModel>): Promise<void> => {
    return apiClient.put(`/api/v1/data-products/${encodeURIComponent(productUri)}`, product);
  },

  delete: async (productUri: string): Promise<void> => {
    return apiClient.delete(`/api/v1/data-products/${encodeURIComponent(productUri)}`);
  },

  search: async (params: SearchDataProductsParams): Promise<DataProductModel[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append("gatewayId", params.gatewayId);
    searchParams.append("userId", params.userId);
    searchParams.append("productName", params.productName);
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.offset) searchParams.append("offset", params.offset.toString());
    return apiClient.get<DataProductModel[]>(`/api/v1/data-products/search?${searchParams.toString()}`);
  },

  getPublic: async (nameSearch?: string, pageNumber = 0, pageSize = 20): Promise<DataProductModel[]> => {
    const params = new URLSearchParams();
    if (nameSearch) params.append("nameSearch", nameSearch);
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());
    return apiClient.get<DataProductModel[]>(`/api/v1/data-products/public?${params.toString()}`);
  },

  getAccessible: async (params: GetAccessibleParams): Promise<DataProductModel[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append("userId", params.userId);
    searchParams.append("gatewayId", params.gatewayId);
    if (params.groupIds?.length) params.groupIds.forEach((id) => searchParams.append("groupIds", id));
    if (params.nameSearch) searchParams.append("nameSearch", params.nameSearch);
    searchParams.append("pageNumber", (params.pageNumber ?? 0).toString());
    searchParams.append("pageSize", (params.pageSize ?? 20).toString());
    return apiClient.get<DataProductModel[]>(`/api/v1/data-products/accessible?${searchParams.toString()}`);
  },

  getPublicTags: async (): Promise<string[]> => {
    return apiClient.get<string[]>("/api/v1/data-products/tags/public");
  },
};
