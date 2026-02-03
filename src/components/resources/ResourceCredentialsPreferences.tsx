"use client";

import { useQuery } from "@tanstack/react-query";
import { Key } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { resourceAccessApi, credentialsApi } from "@/lib/api";
import { PreferenceResourceType } from "@/types";
import { useGateway } from "@/contexts/GatewayContext";
import { CredentialPreferencesCard } from "./CredentialPreferencesCard";

interface Props {
  resourceType: PreferenceResourceType;
  resourceId: string;
}

export function ResourceCredentialsPreferences({ resourceType, resourceId }: Props) {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || "";

  // Get access grants for this resource
  const { data: accessGrants = [], isLoading: grantsLoading } = useQuery({
    queryKey: ["resource-access", resourceType, resourceId],
    queryFn: () => resourceAccessApi.getAccessGrants(resourceType, resourceId),
    enabled: !!resourceId && !!gatewayId,
  });

  // Get credential summaries for all unique credential tokens
  const credentialTokens = Array.from(
    new Set(accessGrants.filter(g => g.credentialToken).map(g => g.credentialToken!))
  );

  // Fetch all credential summaries in parallel
  const { data: allCredentialSummaries = [] } = useQuery({
    queryKey: ["credential-summaries-batch", credentialTokens, gatewayId],
    queryFn: async () => {
      const summaries: Array<{ token: string; summary: any }> = [];
      for (const token of credentialTokens) {
        try {
          const summary = await credentialsApi.getSummary(token, gatewayId);
          summaries.push({ token, summary });
        } catch (error) {
          console.error(`Error fetching credential ${token}:`, error);
        }
      }
      return summaries;
    },
    enabled: credentialTokens.length > 0 && !!gatewayId,
  });

  const credentialsMap: Record<string, any> = {};
  allCredentialSummaries.forEach(({ token, summary }) => {
    credentialsMap[token] = summary;
  });


  if (grantsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credentials & Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (credentialTokens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Credentials & Preferences
          </CardTitle>
          <CardDescription>
            No credentials have access to this resource
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Credentials & Preferences
        </CardTitle>
        <CardDescription>
          Effective preferences for each credential with access to this resource
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {credentialTokens.map((token) => {
          const grant = accessGrants.find(g => g.credentialToken === token);
          if (!grant) return null;
          
          const credential = credentialsMap[token];
          
          return (
            <CredentialPreferencesCard
              key={token}
              resourceType={resourceType}
              resourceId={resourceId}
              credentialToken={token}
              credential={credential}
              grant={grant}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
