"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { userProfilesApi } from "@/lib/api/user-profiles";
import type { UserResourceProfile } from "@/types";

export function useUserProfiles() {
  return useQuery({
    queryKey: ["user-profiles"],
    queryFn: () => userProfilesApi.list(),
  });
}

export function useUserProfile(userId: string | undefined) {
  const { data: session } = useSession();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";

  return useQuery({
    queryKey: ["user-profiles", userId, gatewayId],
    queryFn: () => userProfilesApi.get(userId!, gatewayId),
    enabled: !!userId,
  });
}

export function useUserComputePreferences(userId: string | undefined) {
  const { data: session } = useSession();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";

  return useQuery({
    queryKey: ["user-profiles", userId, gatewayId, "compute-preferences"],
    queryFn: () => userProfilesApi.getComputePreferences(userId!, gatewayId),
    enabled: !!userId,
  });
}

export function useUserStoragePreferences(userId: string | undefined) {
  const { data: session } = useSession();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";

  return useQuery({
    queryKey: ["user-profiles", userId, gatewayId, "storage-preferences"],
    queryFn: () => userProfilesApi.getStoragePreferences(userId!, gatewayId),
    enabled: !!userId,
  });
}

export function useCreateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: Partial<UserResourceProfile>) => userProfilesApi.create(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
    },
  });
}

export function useUpdateUserProfile() {
  const { data: session } = useSession();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, profile }: { userId: string; profile: Partial<UserResourceProfile> }) =>
      userProfilesApi.update(userId, gatewayId, profile),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["user-profiles", variables.userId] });
    },
  });
}

export function useDeleteUserProfile() {
  const { data: session } = useSession();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userProfilesApi.delete(userId, gatewayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
    },
  });
}
