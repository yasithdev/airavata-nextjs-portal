"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGateway } from "@/contexts/GatewayContext";
import { credentialsApi, type SSHCredential, type PasswordCredential } from "@/lib/api/credentials";

export function useCredentials() {
  const { effectiveGatewayId, isAllGatewaysMode } = useGateway();
  const gatewayId = effectiveGatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";

  return useQuery({
    queryKey: ["credentials", gatewayId, isAllGatewaysMode],
    queryFn: () => credentialsApi.list(isAllGatewaysMode ? undefined : gatewayId),
    // Enable query in all gateways mode or when we have a specific gateway
    enabled: isAllGatewaysMode || !!gatewayId,
    // Credentials don't change often, so we can use a longer stale time
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSSHCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credential: SSHCredential) => credentialsApi.createSSH(credential),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });
}

export function useCreatePasswordCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credential: PasswordCredential) => credentialsApi.createPassword(credential),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });
}

export function useDeleteCredential() {
  const { selectedGatewayId } = useGateway();
  const gatewayId = selectedGatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => credentialsApi.delete(token, gatewayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });
}
