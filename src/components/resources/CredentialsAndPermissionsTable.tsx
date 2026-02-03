"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Key, ChevronDown, ChevronRight, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { resourceAccessApi, credentialsApi, preferencesApi } from "@/lib/api";
import {
  PreferenceResourceType,
  PreferenceLevel,
  ComputePreferenceKeys,
  StoragePreferenceKeys,
} from "@/types";
import { useGateway } from "@/contexts/GatewayContext";
import { toast } from "@/hooks/useToast";
import type { ResourceAccess } from "@/types";

type SourceLevel = "USER" | "GROUP" | "GATEWAY";

interface Props {
  resourceType: PreferenceResourceType;
  resourceId: string;
}

interface GrantWithPrefs {
  grant: ResourceAccess;
  credential: { name?: string; username?: string; type?: string; description?: string } | null;
  resolved: Record<string, string>;
  sourceMap: Record<string, SourceLevel>;
}

function computeSourceMap(
  resolved: Record<string, string>,
  ownerPrefs: Record<string, string>,
  gatewayPrefs: Record<string, string>,
  ownerType: PreferenceLevel
): Record<string, SourceLevel> {
  const map: Record<string, SourceLevel> = {};
  const ownerLevel = ownerType === PreferenceLevel.USER ? "USER" : ownerType === PreferenceLevel.GROUP ? "GROUP" : "GATEWAY";
  for (const key of Object.keys(resolved)) {
    const v = resolved[key];
    if (ownerType !== PreferenceLevel.GATEWAY && ownerPrefs[key] === v) map[key] = ownerLevel;
    else if (gatewayPrefs[key] === v) map[key] = "GATEWAY";
    else map[key] = ownerLevel; // fallback when only resolved has it (e.g. default)
  }
  return map;
}

export function CredentialsAndPermissionsTable({ resourceType, resourceId }: Props) {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || "";
  const queryClient = useQueryClient();
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const [editGrant, setEditGrant] = useState<{
    grant: ResourceAccess;
    credential: { name?: string; username?: string; description?: string } | null;
    resolved: Record<string, string>;
  } | null>(null);
  const [preferenceEdits, setPreferenceEdits] = useState<Record<string, string>>({});

  const preferenceKeys =
    resourceType === PreferenceResourceType.COMPUTE
      ? Object.values(ComputePreferenceKeys)
      : Object.values(StoragePreferenceKeys);

  const { data: accessGrants = [], isLoading: grantsLoading } = useQuery({
    queryKey: ["resource-access", resourceType, resourceId],
    queryFn: () => resourceAccessApi.getAccessGrants(resourceType, resourceId),
    enabled: !!resourceId,
  });

  const credentialTokens = Array.from(
    new Set(accessGrants.filter((g) => g.credentialToken).map((g) => g.credentialToken!))
  );

  const { data: allCredentialSummaries = [] } = useQuery({
    queryKey: ["credential-summaries-batch", credentialTokens, gatewayId],
    queryFn: async () => {
      const out: Array<{ token: string; summary: Record<string, unknown> }> = [];
      for (const token of credentialTokens) {
        try {
          const s = await credentialsApi.getSummary(token, gatewayId);
          out.push({ token, summary: s as unknown as Record<string, unknown> });
        } catch {
          /* ignore */
        }
      }
      return out;
    },
    enabled: credentialTokens.length > 0 && !!gatewayId,
  });

  const { data: tableData, isLoading: dataLoading } = useQuery({
    queryKey: [
      "credentials-permissions-table",
      resourceType,
      resourceId,
      gatewayId,
      accessGrants,
      allCredentialSummaries,
    ],
    queryFn: async (): Promise<GrantWithPrefs[]> => {
      const gatePrefs = await preferencesApi.getGatewayPreferences(
        resourceType,
        resourceId,
        gatewayId
      );
      const credMap: Record<string, Record<string, unknown>> = {};
      allCredentialSummaries.forEach(({ token, summary }) => {
        credMap[token] = summary;
      });
      const out: GrantWithPrefs[] = [];
      for (const grant of accessGrants) {
        if (!grant.credentialToken) continue;
        const userId =
          grant.ownerType === PreferenceLevel.USER ? grant.ownerId.split("@")[0] : undefined;
        const groupIds =
          grant.ownerType === PreferenceLevel.GROUP ? [grant.ownerId] : undefined;
        const [resolved, ownerPrefs] = await Promise.all([
          preferencesApi.resolvePreferences(
            resourceType,
            resourceId,
            gatewayId,
            userId,
            groupIds
          ),
          grant.ownerType === PreferenceLevel.GATEWAY
            ? Promise.resolve(gatePrefs)
            : preferencesApi.getPreferencesAtLevel(
                resourceType,
                resourceId,
                grant.ownerId,
                grant.ownerType
              ),
        ]);
        const sourceMap = computeSourceMap(
          resolved,
          ownerPrefs,
          gatePrefs,
          grant.ownerType
        );
        const cred = credMap[grant.credentialToken] as {
          name?: string;
          username?: string;
          type?: string;
          description?: string;
        } | undefined;
        out.push({
          grant,
          credential: cred ?? null,
          resolved,
          sourceMap,
        });
      }
      return out;
    },
    enabled:
      accessGrants.length > 0 &&
      !!gatewayId &&
      credentialTokens.length > 0 &&
      allCredentialSummaries.length > 0,
  });

  const setPreferenceMutation = useMutation({
    mutationFn: async (params: {
      grant: ResourceAccess;
      key: string;
      value: string;
    }) => {
      await preferencesApi.setPreference({
        resourceType,
        resourceId,
        ownerId: params.grant.ownerId,
        level: params.grant.ownerType,
        key: params.key,
        value: params.value,
        enforced: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolved-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["credentials-permissions-table"] });
      toast({ title: "Preference updated" });
      setEditGrant(null);
      setPreferenceEdits({});
    },
  });

  const handleSaveEdit = () => {
    if (!editGrant) return;
    const changes: Array<{ key: string; value: string }> = [];
    preferenceKeys.forEach((key) => {
      const newVal = preferenceEdits[key] ?? "";
      const oldVal = editGrant.resolved[key] ?? "";
      if (newVal !== oldVal) changes.push({ key, value: newVal });
    });
    if (changes.length === 0) {
      setEditGrant(null);
      setPreferenceEdits({});
      return;
    }
    Promise.all(
      changes.map(({ key, value }) =>
        setPreferenceMutation.mutateAsync({ grant: editGrant.grant, key, value })
      )
    ).catch((e) => {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to update preferences",
        variant: "destructive",
      });
    });
  };

  if (grantsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Credentials & Effective Permissions
          </CardTitle>
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
            Credentials & Effective Permissions
          </CardTitle>
          <CardDescription>
            No credentials have access to this resource
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Credentials & Effective Permissions
          </CardTitle>
          <CardDescription>
            Table of credentials with access. Expand a row to see effective preferences and what is inherited from USER, GROUP, or GATEWAY.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Credential</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tableData ?? []).map(({ grant, credential, resolved, sourceMap }) => {
                    const token = grant.credentialToken!;
                    const expanded = expandedToken === token;
                    const displayName = credential?.name ?? credential?.description ?? credential?.username ?? token.substring(0, 12);
                    const ownerLabel =
                      grant.ownerType === PreferenceLevel.GATEWAY
                        ? `Gateway (${grant.ownerId})`
                        : `${grant.ownerType} (${grant.ownerId})`;
                    return (
                      <React.Fragment key={token}>
                        <TableRow className="align-top">
                          <TableCell className="w-8 py-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                setExpandedToken(expanded ? null : token)
                              }
                            >
                              {expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{displayName}</span>
                              <Badge variant="secondary">
                                {credential?.type ?? "—"}
                              </Badge>
                              {credential?.description && (
                                <span className="text-muted-foreground text-sm">
                                  {credential.description}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{ownerLabel}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditGrant({
                                  grant,
                                  credential,
                                  resolved,
                                });
                                setPreferenceEdits(
                                  preferenceKeys.reduce(
                                    (acc, k) => ({
                                      ...acc,
                                      [k]: resolved[k] ?? "",
                                    }),
                                    {}
                                  )
                                );
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expanded && (
                          <TableRow key={`${token}-expanded`}>
                            <TableCell colSpan={4} className="bg-muted/30 p-0">
                              <div className="px-4 py-3">
                                <p className="text-sm font-medium mb-2">
                                  Effective permissions (inheritance shown)
                                </p>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Key</TableHead>
                                      <TableHead>Value</TableHead>
                                      <TableHead>Source</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {preferenceKeys.map((key) => {
                                      const value = resolved[key];
                                      const src = sourceMap[key];
                                      return (
                                        <TableRow key={key}>
                                          <TableCell className="font-mono text-sm">
                                            {key}
                                          </TableCell>
                                          <TableCell className="font-mono text-sm">
                                            {value ? (
                                              <span className="break-all">{value}</span>
                                            ) : (
                                              <span className="text-muted-foreground italic">
                                                Not set
                                              </span>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            {src ? (
                                              <Badge
                                                variant={
                                                  src === "USER"
                                                    ? "default"
                                                    : src === "GROUP"
                                                      ? "secondary"
                                                      : "outline"
                                                }
                                              >
                                                {src}
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!editGrant}
        onOpenChange={(open) => {
          if (!open) {
            setEditGrant(null);
            setPreferenceEdits({});
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit preferences</DialogTitle>
            <DialogDescription>
              {editGrant?.credential?.name ?? editGrant?.credential?.description ?? editGrant?.credential?.username ?? "Credential"} — {editGrant?.grant.ownerType} (
              {editGrant?.grant.ownerId})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {preferenceKeys.map((key) => (
              <div
                key={key}
                className="flex items-center gap-2"
              >
                <Label className="w-48 shrink-0 text-sm">{key}</Label>
                <Input
                  value={preferenceEdits[key] ?? ""}
                  onChange={(e) =>
                    setPreferenceEdits({
                      ...preferenceEdits,
                      [key]: e.target.value,
                    })
                  }
                  placeholder="Not set"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditGrant(null);
                setPreferenceEdits({});
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={setPreferenceMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
