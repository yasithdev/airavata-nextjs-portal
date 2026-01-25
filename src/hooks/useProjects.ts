"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGateway } from "@/contexts/GatewayContext";
import { projectsApi, type ListProjectsParams } from "@/lib/api/projects";
import type { Project } from "@/types";

export function useProjects(params?: ListProjectsParams) {
  const { effectiveGatewayId, isAllGatewaysMode } = useGateway();
  const gatewayId = effectiveGatewayId || params?.gatewayId;

  return useQuery({
    queryKey: ["projects", { ...params, gatewayId, isAllGatewaysMode }],
    queryFn: () =>
      projectsApi.list({
        gatewayId,
        ...params,
      }),
    // Enable query even when gatewayId is undefined (all gateways mode)
    enabled: isAllGatewaysMode || !!gatewayId,
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { selectedGatewayId } = useGateway();

  return useMutation({
    mutationFn: (project: Partial<Project>) => {
      if (!selectedGatewayId) {
        throw new Error("Gateway must be selected");
      }
      return projectsApi.create(project, selectedGatewayId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, project }: { projectId: string; project: Partial<Project> }) =>
      projectsApi.update(projectId, project),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectsApi.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
