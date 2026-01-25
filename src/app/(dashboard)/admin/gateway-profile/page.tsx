"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { useGateway } from "@/contexts/GatewayContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { gatewayProfileApi } from "@/lib/api/gateway-profile";
import { toast } from "@/hooks/useToast";

export default function GatewayProfilePage() {
  const { data: session } = useSession();
  const { selectedGatewayId } = useGateway();
  const queryClient = useQueryClient();
  const gatewayId = selectedGatewayId;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["gateway-resource-profile", gatewayId],
    queryFn: () => gatewayProfileApi.get(gatewayId!),
    enabled: !!gatewayId,
  });

  const updateProfile = useMutation({
    mutationFn: (updatedProfile: any) => {
      if (!gatewayId) {
        throw new Error("Gateway must be selected");
      }
      return gatewayProfileApi.update(gatewayId, updatedProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-resource-profile"] });
      toast({
        title: "Profile updated",
        description: "Gateway resource profile has been updated successfully.",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : "Failed to update profile";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Update gateway profile error:", error);
    },
  });

  const [credentialToken, setCredentialToken] = useState(profile?.credentialStoreToken || "");

  const handleSave = () => {
    updateProfile.mutate({
      ...profile,
      credentialStoreToken: credentialToken,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gateway Resource Profile</h1>
        <p className="text-muted-foreground">
          Configure default resource settings for the gateway
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gateway: {gatewayId}</CardTitle>
              <CardDescription>Default resource configuration for all users</CardDescription>
            </div>
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Credential Token</Label>
            <Input
              value={credentialToken}
              onChange={(e) => setCredentialToken(e.target.value)}
              placeholder="Enter default credential token"
            />
            <p className="text-sm text-muted-foreground">
              Default credential to use for this gateway's compute resources
            </p>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Compute Resource Preferences</h4>
            <p className="text-sm text-muted-foreground">
              {profile?.computeResourcePreferences?.length || 0} compute resource(s) configured
            </p>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Storage Preferences</h4>
            <p className="text-sm text-muted-foreground">
              {profile?.storagePreferences?.length || 0} storage resource(s) configured
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
