"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storageResourcesApi } from "@/lib/api/storage-resources";
import type { StorageResourceDescription } from "@/types";

export function useStorageResources() {
  return useQuery({
    queryKey: ["storage-resources"],
    queryFn: () => storageResourcesApi.list(),
  });
}

export function useStorageResource(storageResourceId: string | undefined) {
  return useQuery({
    queryKey: ["storage-resources", storageResourceId],
    queryFn: () => storageResourcesApi.get(storageResourceId!),
    enabled: !!storageResourceId,
  });
}

export function useCreateStorageResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resource: Partial<StorageResourceDescription>) => storageResourcesApi.create(resource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-resources"] });
    },
  });
}

export function useUpdateStorageResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storageResourceId,
      resource,
    }: {
      storageResourceId: string;
      resource: Partial<StorageResourceDescription>;
    }) => storageResourcesApi.update(storageResourceId, resource),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["storage-resources"] });
      queryClient.invalidateQueries({ queryKey: ["storage-resources", variables.storageResourceId] });
    },
  });
}

export function useDeleteStorageResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storageResourceId: string) => storageResourcesApi.delete(storageResourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-resources"] });
    },
  });
}
