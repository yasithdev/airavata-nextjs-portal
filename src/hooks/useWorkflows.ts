"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workflowsApi } from "@/lib/api/workflows";
import type { AiravataWorkflow } from "@/types";

export function useWorkflows() {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: () => workflowsApi.list(),
    retry: 1,
  });
}

export function useWorkflow(workflowId: string | undefined) {
  return useQuery({
    queryKey: ["workflows", workflowId],
    queryFn: () => workflowsApi.get(workflowId!),
    enabled: !!workflowId,
  });
}

export function useWorkflowByExperiment(experimentId: string | undefined) {
  return useQuery({
    queryKey: ["workflows", "experiment", experimentId],
    queryFn: () => workflowsApi.getByExperiment(experimentId!),
    enabled: !!experimentId,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflow, experimentId }: { workflow: Partial<AiravataWorkflow>; experimentId: string }) =>
      workflowsApi.register(workflow, experimentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, workflow }: { workflowId: string; workflow: Partial<AiravataWorkflow> }) =>
      workflowsApi.update(workflowId, workflow),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflows", variables.workflowId] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) => workflowsApi.delete(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}
