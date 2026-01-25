import { apiClient } from "./client";
import type { CatalogResource, ResourceFilters, Tag } from "@/types/catalog";

const RESEARCH_API_BASE = "/api/v1/rf";

export const catalogApi = {
  // Get public resources with filtering
  listPublic: async (filters: ResourceFilters = {}): Promise<CatalogResource[]> => {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.nameSearch) params.append("nameSearch", filters.nameSearch);
    if (filters.tags) filters.tags.forEach(tag => params.append("tag", tag));
    if (filters.pageNumber) params.append("pageNumber", filters.pageNumber.toString());
    if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());
    
    return apiClient.get<CatalogResource[]>(`${RESEARCH_API_BASE}/resources/public?${params.toString()}`);
  },

  // Get all resources (authenticated)
  list: async (filters: ResourceFilters = {}): Promise<CatalogResource[]> => {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.pageNumber) params.append("pageNumber", filters.pageNumber.toString());
    if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());
    
    return apiClient.get<CatalogResource[]>(`${RESEARCH_API_BASE}/resources?${params.toString()}`);
  },

  // Get resource by ID
  get: async (resourceId: string): Promise<CatalogResource> => {
    return apiClient.get<CatalogResource>(`${RESEARCH_API_BASE}/resources/${resourceId}`);
  },

  // Get public resource by ID
  getPublic: async (resourceId: string): Promise<CatalogResource> => {
    return apiClient.get<CatalogResource>(`${RESEARCH_API_BASE}/resources/public/${resourceId}`);
  },

  // Search resources
  search: async (query: string, type?: string): Promise<CatalogResource[]> => {
    const params = new URLSearchParams();
    params.append("query", query);
    if (type) params.append("type", type);
    
    return apiClient.get<CatalogResource[]>(`${RESEARCH_API_BASE}/resources/search?${params.toString()}`);
  },

  // Get all tags
  getAllTags: async (): Promise<Tag[]> => {
    return apiClient.get<Tag[]>(`${RESEARCH_API_BASE}/resources/public/tags/all`);
  },

  // Star/unstar resource
  star: async (resourceId: string): Promise<void> => {
    return apiClient.post(`${RESEARCH_API_BASE}/resources/${resourceId}/star`);
  },

  checkStarred: async (resourceId: string): Promise<boolean> => {
    const result = await apiClient.get<{ starred: boolean }>(`${RESEARCH_API_BASE}/resources/${resourceId}/star`);
    return result.starred;
  },

  // Get user's starred resources
  getStarred: async (userEmail: string): Promise<CatalogResource[]> => {
    return apiClient.get<CatalogResource[]>(`${RESEARCH_API_BASE}/resources/${userEmail}/stars`);
  },

  // Create resource
  create: async (resource: Partial<CatalogResource>): Promise<{ id: string }> => {
    return apiClient.post<{ id: string }>(`${RESEARCH_API_BASE}/resources`, resource);
  },

  // Update resource
  update: async (resourceId: string, resource: Partial<CatalogResource>): Promise<void> => {
    return apiClient.put(`${RESEARCH_API_BASE}/resources/${resourceId}`, resource);
  },

  // Delete resource
  delete: async (resourceId: string): Promise<void> => {
    return apiClient.delete(`${RESEARCH_API_BASE}/resources/${resourceId}`);
  },
};
