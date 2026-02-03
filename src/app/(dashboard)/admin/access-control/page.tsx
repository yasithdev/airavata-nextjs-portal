"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Plus, Key, Server, Database, Shield, Users, Globe, Trash2, MoreVertical, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SSHKeyForm } from "@/components/credentials/SSHKeyForm";
import { PasswordCredentialForm } from "@/components/credentials/PasswordCredentialForm";
import { useGateway } from "@/contexts/GatewayContext";
import { useUserRole } from "@/contexts/AdvancedFeaturesContext";
import { resourceAccessApi, credentialsApi, computeResourcesApi, storageResourcesApi } from "@/lib/api";
import { buildCredentialsFromAccessData } from "@/lib/credentials-access";
import { toast } from "@/hooks/useToast";
import { formatDate, cn } from "@/lib/utils";
import type { CredentialSummary, SSHCredential, PasswordCredential } from "@/lib/api/credentials";
import type { CredentialWithResources } from "@/lib/credentials-access";
import { PreferenceResourceType, PreferenceLevel } from "@/types";

export default function AccessControlPage() {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || "";
  const { data: session } = useSession();
  const { selectedRole } = useUserRole();
  const queryClient = useQueryClient();
  const userId = session?.user?.email ?? session?.user?.name ?? "";

  // Check if user is in admin mode
  const isAdminMode = selectedRole === "gateway-admin" || selectedRole === "system-admin";

  const [isAddCredentialOpen, setIsAddCredentialOpen] = useState(false);
  const [credentialType, setCredentialType] = useState<"SSH" | "PASSWORD">("SSH");
  const [isGrantAccessOpen, setIsGrantAccessOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<string>("");
  const [selectedResourceType, setSelectedResourceType] = useState<PreferenceResourceType>(PreferenceResourceType.COMPUTE);
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [grantLoginUsername, setGrantLoginUsername] = useState<string>("");
  const [selectedOwnerType, setSelectedOwnerType] = useState<PreferenceLevel>(PreferenceLevel.USER);
  const [viewingCredential, setViewingCredential] = useState<CredentialWithResources | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deletingCredential, setDeletingCredential] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Fetch owned credentials (backend uses auth token when userId is empty)
  const { data: ownedList = [], isLoading: ownedLoading } = useQuery({
    queryKey: ["credential-summaries-owned", gatewayId, userId],
    queryFn: () => credentialsApi.listOwned(gatewayId, userId),
    enabled: !!gatewayId,
  });

  // Fetch access-control (backend uses auth token when userId is empty)
  const { data: accessControlData, isLoading: accessLoading, error } = useQuery({
    queryKey: ["accessControl", gatewayId, userId],
    queryFn: () => resourceAccessApi.getAccessControl(gatewayId, userId),
    enabled: !!gatewayId,
  });

  // Fetch compute and storage resources for dropdowns
  const { data: computeResourcesMap = {} } = useQuery({
    queryKey: ["computeResources"],
    queryFn: () => computeResourcesApi.list(),
  });

  const { data: storageResourcesMap = {} } = useQuery({
    queryKey: ["storageResources"],
    queryFn: () => storageResourcesApi.list(),
  });

  const computeResources = Object.entries(computeResourcesMap).map(([id, name]) => ({
    resourceId: id,
    name: name as string,
  }));

  const storageResources = Array.isArray(storageResourcesMap)
    ? storageResourcesMap.map((r: any) => ({ resourceId: r.storageResourceId, name: r.hostName }))
    : Object.entries(storageResourcesMap).map(([id, name]) => ({
        resourceId: id,
        name: name as string,
      }));

  const { credentials, ownedCredentials, inheritedCredentials } =
    buildCredentialsFromAccessData(
      ownedList,
      accessControlData?.credentials,
      userId
    );
  const isLoading = ownedLoading || accessLoading;

  // Create credential mutations
  const createSSHCredentialMutation = useMutation({
    mutationFn: (credential: SSHCredential) => credentialsApi.createSSH(credential),
    onSuccess: async () => {
      toast({ title: "SSH credential created" });
      await queryClient.refetchQueries({ queryKey: ["credential-summaries-owned"] });
      queryClient.invalidateQueries({ queryKey: ["accessControl"] });
      queryClient.invalidateQueries({ queryKey: ["credential-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      setIsAddCredentialOpen(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Failed",
        description: err?.message ?? "SSH credential could not be created.",
        variant: "destructive",
      });
    },
  });

  const createPasswordCredentialMutation = useMutation({
    mutationFn: (credential: PasswordCredential) => credentialsApi.createPassword(credential),
    onSuccess: async () => {
      toast({ title: "Password credential created" });
      await queryClient.refetchQueries({ queryKey: ["credential-summaries-owned"] });
      queryClient.invalidateQueries({ queryKey: ["accessControl"] });
      queryClient.invalidateQueries({ queryKey: ["credential-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      setIsAddCredentialOpen(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Failed",
        description: err?.message ?? "Password credential could not be created.",
        variant: "destructive",
      });
    },
  });

  // Grant access mutation
  const grantAccessMutation = useMutation({
    mutationFn: (request: {
      resourceType: PreferenceResourceType;
      resourceId: string;
      ownerId: string;
      ownerType: PreferenceLevel;
      credentialToken: string;
      loginUsername?: string | null;
    }) =>
      resourceAccessApi.createAccessGrant({
        resourceType: request.resourceType,
        resourceId: request.resourceId,
        ownerId: request.ownerId,
        ownerType: request.ownerType,
        gatewayId,
        credentialToken: request.credentialToken,
        loginUsername: request.loginUsername?.trim() || undefined,
        enabled: true,
      }),
    onSuccess: () => {
      toast({ title: "Access granted" });
      queryClient.invalidateQueries({ queryKey: ["accessControl"] });
      setIsGrantAccessOpen(false);
      setSelectedCredential("");
      setSelectedResourceId("");
      setGrantLoginUsername("");
    },
  });

  // Delete credential mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: (token: string) => credentialsApi.delete(token, gatewayId),
    onSuccess: () => {
      toast({ title: "Credential deleted" });
      queryClient.invalidateQueries({ queryKey: ["credential-summaries-owned"] });
      queryClient.invalidateQueries({ queryKey: ["accessControl"] });
      setDeletingCredential(null);
    },
  });

  const handleCreateCredential = async (credentialData: any) => {
    if (!gatewayId) {
      toast({
        title: "Cannot create credential",
        description: "Gateway is required.",
        variant: "destructive",
      });
      return;
    }
    try {
      if (credentialType === "SSH") {
        await createSSHCredentialMutation.mutateAsync({
          ...credentialData,
          gatewayId,
          userId,
        });
      } else {
        await createPasswordCredentialMutation.mutateAsync({
          ...credentialData,
          gatewayId,
          userId,
        });
      }
    } catch {
      // onError already shows "Failed" toast; absorb to avoid unhandled rejection
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedCredential || !selectedResourceId) {
      toast({
        title: "Error",
        description: "Please select a credential and resource",
        variant: "destructive",
      });
      return;
    }

    // Regular users can only grant access at USER level
    // Admins can grant at USER, GROUP, or GATEWAY level
    const effectiveOwnerType = isAdminMode ? selectedOwnerType : PreferenceLevel.USER;
    const ownerId =
      effectiveOwnerType === PreferenceLevel.USER
        ? `${userId}@${gatewayId}`
        : effectiveOwnerType === PreferenceLevel.GROUP
        ? selectedResourceId // For groups, we'd need a group selector
        : gatewayId;

    await grantAccessMutation.mutateAsync({
      resourceType: selectedResourceType,
      resourceId: selectedResourceId,
      ownerId,
      ownerType: effectiveOwnerType,
      credentialToken: selectedCredential,
    });
  };

  const getResourceName = (resourceId: string, type: PreferenceResourceType): string => {
    if (type === PreferenceResourceType.COMPUTE) {
      return (computeResourcesMap as Record<string, string>)[resourceId] || resourceId;
    } else {
      const resource = storageResources.find((r) => r.resourceId === resourceId);
      return resource?.name || resourceId;
    }
  };

  const getOwnershipBadge = (cred: CredentialWithResources) => {
    if (cred.ownership === "OWNED") {
      return <Badge variant="default">Owned</Badge>;
    }
    const sourceLabels: Record<string, string> = {
      GROUP: "Inherited from Group",
      GATEWAY: "Inherited from Gateway",
    };
    return <Badge variant="secondary">{sourceLabels[cred.source] || "Inherited"}</Badge>;
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast({ title: "Token copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
            <p className="text-muted-foreground">
              Manage credentials and resource access. Credentials shown include your own and those inherited from groups.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdminMode && (
            <Button onClick={() => setIsGrantAccessOpen(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Grant Access
            </Button>
          )}
          <Button onClick={() => setIsAddCredentialOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Credential
          </Button>
        </div>
      </div>

      {/* Credentials List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Key className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Error loading credentials</h3>
            <p className="text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "Failed to load credentials"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({credentials.length})</TabsTrigger>
            <TabsTrigger value="owned">Owned ({ownedCredentials.length})</TabsTrigger>
            <TabsTrigger value="inherited">Inherited ({inheritedCredentials.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {credentials.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Key className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No credentials</h3>
                  <p className="text-muted-foreground mt-1">
                    Create your first credential to enable secure connections
                  </p>
                </CardContent>
              </Card>
            ) : (
              <CredentialsTable
                credentials={credentials}
                onView={(cred) => {
                  setViewingCredential(cred);
                  setIsViewDialogOpen(true);
                }}
                onDelete={(cred) => setDeletingCredential(cred.token)}
                canDelete={(cred) => cred.ownership === "OWNED"}
                onCopyToken={copyToken}
                copiedToken={copiedToken}
                getOwnershipBadge={getOwnershipBadge}
              />
            )}
          </TabsContent>

          <TabsContent value="owned" className="space-y-4">
            {ownedCredentials.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Key className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No credentials owned</h3>
                  <p className="text-muted-foreground mt-1">
                    Add your first credential to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              <CredentialsTable
                credentials={ownedCredentials}
                onView={(cred) => {
                  setViewingCredential(cred);
                  setIsViewDialogOpen(true);
                }}
                onDelete={(cred) => setDeletingCredential(cred.token)}
                onCopyToken={copyToken}
                copiedToken={copiedToken}
                getOwnershipBadge={getOwnershipBadge}
              />
            )}
          </TabsContent>

          <TabsContent value="inherited" className="space-y-4">
            {inheritedCredentials.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Users className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No inherited credentials</h3>
                  <p className="text-muted-foreground mt-1">
                    Credentials shared with you from groups or gateway will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <CredentialsTable
                credentials={inheritedCredentials}
                onView={(cred) => {
                  setViewingCredential(cred);
                  setIsViewDialogOpen(true);
                }}
                onDelete={undefined}
                onCopyToken={copyToken}
                copiedToken={copiedToken}
                getOwnershipBadge={getOwnershipBadge}
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Add Credential Dialog */}
      <Dialog open={isAddCredentialOpen} onOpenChange={setIsAddCredentialOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Credential</DialogTitle>
            <DialogDescription>Create a new credential for accessing resources</DialogDescription>
          </DialogHeader>
          <Tabs value={credentialType} onValueChange={(v) => setCredentialType(v as "SSH" | "PASSWORD")}>
            <TabsList>
              <TabsTrigger value="SSH">SSH Key</TabsTrigger>
              <TabsTrigger value="PASSWORD">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="SSH">
              <SSHKeyForm
                onSubmit={handleCreateCredential}
                onCancel={() => setIsAddCredentialOpen(false)}
                isLoading={createSSHCredentialMutation.isPending}
                gatewayId={gatewayId}
              />
            </TabsContent>
            <TabsContent value="PASSWORD">
              <PasswordCredentialForm
                onSubmit={handleCreateCredential}
                onCancel={() => setIsAddCredentialOpen(false)}
                isLoading={createPasswordCredentialMutation.isPending}
                gatewayId={gatewayId}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Grant Access Dialog */}
      <Dialog open={isGrantAccessOpen} onOpenChange={setIsGrantAccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Resource Access</DialogTitle>
            <DialogDescription>Grant access to a resource using a credential</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Credential</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={selectedCredential}
                onChange={(e) => setSelectedCredential(e.target.value)}
              >
                <option value="">Select a credential</option>
                {credentials.map((cred) => (
                  <option key={cred.token} value={cred.token}>
                    {cred.name || cred.description || cred.token.substring(0, 12)} ({cred.type}) — {cred.ownership === "OWNED" ? "Owned" : `Inherited from ${cred.source}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Resource Type</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={selectedResourceType}
                onChange={(e) => {
                  setSelectedResourceType(e.target.value as PreferenceResourceType);
                  setSelectedResourceId("");
                }}
              >
                <option value={PreferenceResourceType.COMPUTE}>Compute Resource</option>
                <option value={PreferenceResourceType.STORAGE}>Storage Resource</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Resource</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
              >
                <option value="">Select a resource</option>
                {(selectedResourceType === PreferenceResourceType.COMPUTE ? computeResources : storageResources).map(
                  (resource) => (
                    <option key={resource.resourceId} value={resource.resourceId}>
                      {resource.name}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Login username (for this resource)</label>
              <input
                type="text"
                className="w-full mt-1 p-2 border rounded"
                placeholder="e.g. myuser"
                value={grantLoginUsername}
                onChange={(e) => setGrantLoginUsername(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-0.5">SSH/login username on the selected resource. Required for testing connection.</p>
            </div>
            {isAdminMode && (
              <div>
                <label className="text-sm font-medium">Grant Level</label>
                <select
                  className="w-full mt-1 p-2 border rounded"
                  value={selectedOwnerType}
                  onChange={(e) => setSelectedOwnerType(e.target.value as PreferenceLevel)}
                >
                  <option value={PreferenceLevel.USER}>User</option>
                  <option value={PreferenceLevel.GROUP}>Group</option>
                  <option value={PreferenceLevel.GATEWAY}>Gateway</option>
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGrantAccessOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrantAccess} disabled={grantAccessMutation.isPending}>
              {grantAccessMutation.isPending ? "Granting..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Credential Dialog */}
      {viewingCredential && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Credential Details</DialogTitle>
              <DialogDescription>View credential information and associated resources</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-sm">{viewingCredential.name || viewingCredential.description || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge variant="secondary">{viewingCredential.type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ownership</p>
                  {getOwnershipBadge(viewingCredential)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Source</p>
                  <p className="text-sm">{viewingCredential.sourceId}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Login username is configured per resource deployment (see each resource below).</p>
              {viewingCredential.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{viewingCredential.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Token</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">
                    {viewingCredential.token}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => copyToken(viewingCredential.token)}>
                    {copiedToken === viewingCredential.token ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {viewingCredential.persistedTime && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">{formatDate(viewingCredential.persistedTime)}</p>
                </div>
              )}

              {/* Compute Resources */}
              {viewingCredential.computeResources.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Compute Resources</p>
                  <div className="space-y-2">
                    {viewingCredential.computeResources.map((resource) => (
                      <div key={resource.resourceId} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{getResourceName(resource.resourceId, PreferenceResourceType.COMPUTE)}</p>
                          {resource.loginUsername && (
                            <p className="text-xs text-muted-foreground">Login: {resource.loginUsername}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Storage Resources */}
              {viewingCredential.storageResources.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Storage Resources</p>
                  <div className="space-y-2">
                    {viewingCredential.storageResources.map((resource) => (
                      <div key={resource.resourceId} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{getResourceName(resource.resourceId, PreferenceResourceType.STORAGE)}</p>
                          {resource.loginUsername && (
                            <p className="text-xs text-muted-foreground">Login: {resource.loginUsername}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Credential Dialog */}
      <AlertDialog open={!!deletingCredential} onOpenChange={(open) => !open && setDeletingCredential(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credential</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this credential? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCredentialMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCredential && deleteCredentialMutation.mutate(deletingCredential)}
              disabled={deleteCredentialMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCredentialMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CredentialsTable({
  credentials,
  onView,
  onDelete,
  canDelete,
  onCopyToken,
  copiedToken,
  getOwnershipBadge,
}: {
  credentials: CredentialWithResources[];
  onView: (cred: CredentialWithResources) => void;
  onDelete?: (cred: CredentialWithResources) => void;
  /** When set, Delete menu item is only shown when this returns true (e.g. for owned creds on "All" tab). */
  canDelete?: (cred: CredentialWithResources) => boolean;
  onCopyToken: (token: string) => void;
  copiedToken: string | null;
  getOwnershipBadge: (cred: CredentialWithResources) => React.ReactNode;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Ownership</TableHead>
            <TableHead className="text-right">Compute</TableHead>
            <TableHead className="text-right">Storage</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {credentials.map((cred) => (
              <TableRow
                key={cred.token}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(cred)}
              >
                <TableCell className="w-10 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                    <Key className="h-4 w-4 text-primary" />
                  </div>
                </TableCell>
                <TableCell className="py-2 font-medium">{cred.name || cred.description || "—"}</TableCell>
                <TableCell className="max-w-[180px] truncate py-2 text-muted-foreground">
                  {cred.description || "—"}
                </TableCell>
                <TableCell className="py-2 text-muted-foreground">
                  {cred.type}
                </TableCell>
                <TableCell className="py-2">{getOwnershipBadge(cred)}</TableCell>
                <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
                  {cred.computeResources.length}
                </TableCell>
                <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
                  {cred.storageResources.length}
                </TableCell>
                <TableCell className="w-0 py-2" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onCopyToken(cred.token)}>
                        {copiedToken === cred.token ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Token
                          </>
                        )}
                      </DropdownMenuItem>
                      {onDelete && (!canDelete || canDelete(cred)) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(cred)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
