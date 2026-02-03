"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGateway } from "@/contexts/GatewayContext";
import { usePortalConfig } from "@/contexts/PortalConfigContext";
import { credentialsApi, type SSHCredential, type PasswordCredential } from "@/lib/api/credentials";
import { applicationsApi } from "@/lib/api/applications";

export function useCredentials() {
  const { effectiveGatewayId } = useGateway();
  const { defaultGatewayId } = usePortalConfig();
  const gatewayId = effectiveGatewayId || defaultGatewayId;

  return useQuery({
    queryKey: ["credentials", gatewayId],
    queryFn: () => credentialsApi.list(gatewayId),
    enabled: !!gatewayId,
    staleTime: 5 * 60 * 1000,
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
  const { defaultGatewayId } = usePortalConfig();
  const gatewayId = selectedGatewayId || defaultGatewayId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => credentialsApi.delete(token, gatewayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });
}

export function useDeploymentsByCredential(credentialToken: string | null) {
  return useQuery({
    queryKey: ["deployments-by-credential", credentialToken],
    queryFn: () => credentialToken ? applicationsApi.getDeploymentsByCredential(credentialToken) : Promise.resolve([]),
    enabled: !!credentialToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
