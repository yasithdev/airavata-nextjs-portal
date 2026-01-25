"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { catalogApi } from "@/lib/api/catalog";
import type { CatalogResource, ResourceFilters } from "@/types/catalog";

export function useCatalogResources(filters?: ResourceFilters) {
  return useQuery({
    queryKey: ["catalog-resources", filters],
    queryFn: () => catalogApi.listPublic(filters),
    enabled: true,
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
    queryFn: () => catalogApi.getAllTags(),
    enabled: true,
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
