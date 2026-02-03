"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { computeResourcesApi } from "@/lib/api/compute-resources";
import type { ComputeResourceDescription } from "@/types";

export function useComputeResources() {
  return useQuery({
    queryKey: ["compute-resources"],
    queryFn: () => computeResourcesApi.list(),
  });
}

export function useComputeResource(computeResourceId: string | undefined) {
  return useQuery({
    queryKey: ["compute-resources", computeResourceId],
    queryFn: () => computeResourcesApi.get(computeResourceId!),
    enabled: !!computeResourceId,
  });
}

export function useCreateComputeResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resource: Partial<ComputeResourceDescription>) => computeResourcesApi.create(resource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compute-resources"] });
      queryClient.invalidateQueries({ queryKey: ["computeResources"] });
    },
  });
}

export function useUpdateComputeResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      computeResourceId,
      resource,
    }: {
      computeResourceId: string;
      resource: Partial<ComputeResourceDescription>;
    }) => computeResourcesApi.update(computeResourceId, resource),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["compute-resources"] });
      queryClient.invalidateQueries({ queryKey: ["compute-resources", variables.computeResourceId] });
      queryClient.invalidateQueries({ queryKey: ["computeResources"] });
    },
  });
}

export function useDeleteComputeResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (computeResourceId: string) => computeResourcesApi.delete(computeResourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compute-resources"] });
    },
  });
}
