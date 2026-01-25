"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { applicationsApi } from "@/lib/api/applications";
import { useGateway } from "@/contexts/GatewayContext";

export function useApplicationInterfaces() {
  const { data: session } = useSession();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";

  return useQuery({
    queryKey: ["application-interfaces", gatewayId],
    queryFn: () => applicationsApi.listInterfaces(gatewayId),
    enabled: true, // Allow fetching without session for development
  });
}

export function useApplicationInterface(interfaceId: string) {
  return useQuery({
    queryKey: ["application-interface", interfaceId],
    queryFn: () => applicationsApi.getInterface(interfaceId),
    enabled: !!interfaceId,
  });
}

export function useApplicationInputs(interfaceId: string) {
  return useQuery({
    queryKey: ["application-inputs", interfaceId],
    queryFn: () => applicationsApi.getInputs(interfaceId),
    enabled: !!interfaceId,
  });
}

export function useApplicationOutputs(interfaceId: string) {
  return useQuery({
    queryKey: ["application-outputs", interfaceId],
    queryFn: () => applicationsApi.getOutputs(interfaceId),
    enabled: !!interfaceId,
  });
}

export function useApplicationModules() {
  const { selectedGatewayId } = useGateway();
  const gatewayId = selectedGatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";

  return useQuery({
    queryKey: ["application-modules", gatewayId],
    queryFn: () => applicationsApi.listModules(gatewayId!),
    enabled: !!gatewayId,
  });
}
