"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { catalogApi } from "@/lib/api/catalog";
import type { CatalogResource, ResourceFilters } from "@/types/catalog";

export function useCatalogResources(filters?: ResourceFilters) {
  return useQuery({
    queryKey: ["catalog-resources", filters],
    queryFn: async () => {
      try {
        const resources = await catalogApi.listPublic(filters);
        return resources || [];
      } catch (error) {
        console.error("Error fetching catalog resources:", error);
        return [];
      }
    },
    enabled: true,
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCatalogResource(resourceId: string) {
  return useQuery({
    queryKey: ["catalog-resource", resourceId],
    queryFn: () => catalogApi.getPublic(resourceId),
    enabled: !!resourceId,
  });
}

export function useCatalogTags() {
  return useQuery({
    queryKey: ["catalog-tags"],
    queryFn: async () => {
      try {
        const tags = await catalogApi.getAllTags();
        return tags || [];
      } catch (error) {
        console.error("Error fetching catalog tags:", error);
        return [];
      }
    },
    enabled: true,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes - tags don't change often
  });
}

export function useStarredResources() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";

  return useQuery({
    queryKey: ["starred-resources", userEmail],
    queryFn: () => catalogApi.getStarred(userEmail),
    enabled: !!userEmail,
  });
}

export function useStarResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resourceId: string) => catalogApi.star(resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["starred-resources"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-resources"] });
    },
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resource: Partial<CatalogResource>) => catalogApi.create(resource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-resources"] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resourceId, resource }: { resourceId: string; resource: Partial<CatalogResource> }) =>
      catalogApi.update(resourceId, resource),
    onSuccess: (_, { resourceId }) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-resources"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-resource", resourceId] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resourceId: string) => catalogApi.delete(resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-resources"] });
    },
  });
}
