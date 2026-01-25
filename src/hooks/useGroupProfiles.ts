"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { groupProfilesApi } from "@/lib/api/group-profiles";
import type { GroupResourceProfile } from "@/types";

export function useGroupProfiles() {
  const { data: session } = useSession();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";

  return useQuery({
    queryKey: ["group-resource-profiles", gatewayId],
    queryFn: () => groupProfilesApi.list(gatewayId),
    enabled: true,
    retry: 1,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

export function useGroupProfile(profileId: string) {
  return useQuery({
    queryKey: ["group-resource-profile", profileId],
    queryFn: () => groupProfilesApi.get(profileId),
    enabled: !!profileId,
  });
}

export function useCreateGroupProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: Partial<GroupResourceProfile>) => groupProfilesApi.create(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-resource-profiles"] });
    },
  });
}

export function useUpdateGroupProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, profile }: { profileId: string; profile: Partial<GroupResourceProfile> }) =>
      groupProfilesApi.update(profileId, profile),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: ["group-resource-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["group-resource-profile", profileId] });
    },
  });
}

export function useDeleteGroupProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) => groupProfilesApi.delete(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-resource-profiles"] });
    },
  });
}
