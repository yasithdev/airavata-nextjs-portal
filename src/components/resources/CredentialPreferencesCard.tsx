"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Key, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { preferencesApi } from "@/lib/api";
import { PreferenceResourceType, PreferenceLevel, ComputePreferenceKeys, StoragePreferenceKeys } from "@/types";
import { useGateway } from "@/contexts/GatewayContext";
import { toast } from "@/hooks/useToast";
import { useState } from "react";
import type { ResourceAccess } from "@/types";

interface Props {
  resourceType: PreferenceResourceType;
  resourceId: string;
  credentialToken: string;
  credential: any;
  grant: ResourceAccess;
}

export function CredentialPreferencesCard({ resourceType, resourceId, credentialToken, credential, grant }: Props) {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || "";
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [preferenceEdits, setPreferenceEdits] = useState<Record<string, string>>({});

  // Get effective preferences for this credential
  const { data: preferences = {}, isLoading } = useQuery({
    queryKey: ["resolved-preferences", resourceType, resourceId, grant.ownerId, grant.ownerType, gatewayId],
    queryFn: () => preferencesApi.resolvePreferences(
      resourceType,
      resourceId,
      gatewayId,
      grant.ownerType === PreferenceLevel.USER ? grant.ownerId.split('@')[0] : undefined,
      grant.ownerType === PreferenceLevel.GROUP ? [grant.ownerId] : undefined
    ),
    enabled: !!grant && !!gatewayId,
  });

  const preferenceKeys = resourceType === PreferenceResourceType.COMPUTE
    ? Object.values(ComputePreferenceKeys)
    : Object.values(StoragePreferenceKeys);

  const setPreferenceMutation = useMutation({
    mutationFn: async (params: {
      key: string;
      value: string;
    }) => {
      await preferencesApi.setPreference({
        resourceType,
        resourceId,
        ownerId: grant.ownerId,
        level: grant.ownerType,
        key: params.key,
        value: params.value,
        enforced: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolved-preferences"] });
      toast({ title: "Preference updated" });
      setIsEditing(false);
      setPreferenceEdits({});
    },
  });

  const handleStartEdit = () => {
    setIsEditing(true);
    setPreferenceEdits({ ...preferences });
  };

  const handleSave = () => {
    // Only save preferences that have changed
    const changes: Array<{ key: string; value: string }> = [];
    Object.entries(preferenceEdits).forEach(([key, newValue]) => {
      const oldValue = preferences[key] || "";
      if (newValue !== oldValue) {
        changes.push({ key, value: newValue });
      }
    });

    if (changes.length === 0) {
      setIsEditing(false);
      setPreferenceEdits({});
      return;
    }

    // Save all changed preferences
    Promise.all(
      changes.map(({ key, value }) =>
        setPreferenceMutation.mutateAsync({ key, value })
      )
    ).catch((error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update preferences",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{credential?.name || credential?.description || credential?.username || credentialToken.substring(0, 8)}</p>
              <Badge variant="secondary">{credential?.type || "Unknown"}</Badge>
              <Badge variant="outline">{grant.ownerType}</Badge>
            </div>
            {credential?.description && (
              <p className="text-sm text-muted-foreground">{credential.description}</p>
            )}
          </div>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartEdit}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Preferences
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="space-y-2">
          {isEditing ? (
            <div className="space-y-3">
              {preferenceKeys.map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <Label className="w-48 text-sm">{key}</Label>
                  <Input
                    value={preferenceEdits[key] || ""}
                    onChange={(e) =>
                      setPreferenceEdits({ ...preferenceEdits, [key]: e.target.value })
                    }
                    placeholder="Not set"
                    className="flex-1"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setPreferenceEdits({});
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={setPreferenceMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preferenceKeys.map((key) => {
                  const value = preferences[key];
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{key}</TableCell>
                      <TableCell>
                        {value ? (
                          <span>{value}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Not set</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
