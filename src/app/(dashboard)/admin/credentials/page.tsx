"use client";

import { useState } from "react";
import { Plus, Key, Lock, Trash2, MoreVertical, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SSHKeyForm } from "@/components/credentials/SSHKeyForm";
import { PasswordCredentialForm } from "@/components/credentials/PasswordCredentialForm";
import { useCredentials, useCreateSSHCredential, useCreatePasswordCredential, useDeleteCredential, useDeploymentsByCredential } from "@/hooks/useCredentials";
import { toast } from "@/hooks/useToast";
import { useSession } from "next-auth/react";
import { useGateway } from "@/contexts/GatewayContext";
import { GatewayBadge } from "@/components/gateway/GatewayBadge";
import { formatDate } from "@/lib/utils";
import type { CredentialSummary, SSHCredential, PasswordCredential } from "@/lib/api/credentials";
import { useQuery } from "@tanstack/react-query";
import { computeResourcesApi } from "@/lib/api";
import { Server } from "lucide-react";
import type { ApplicationDeploymentDescription } from "@/types";

// Component to display credential details in the view dialog
function CredentialDetails({
  credential,
  computeResourcesMap,
  copiedToken,
  onCopyToken,
}: {
  credential: CredentialSummary;
  computeResourcesMap: Record<string, string>;
  copiedToken: boolean;
  onCopyToken: () => void;
}) {
  const { data: deployments = [], isLoading: loadingDeployments } = useDeploymentsByCredential(credential.token);
  
  const getComputeName = (computeHostId: string | null | undefined): string => {
    if (!computeHostId) return "Unknown";
    return computeResourcesMap[computeHostId] || computeHostId;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Username</p>
          <p className="text-sm">{credential.username}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Type</p>
          <Badge variant="secondary">{credential.type}</Badge>
        </div>
      </div>
      
      {credential.description && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Description</p>
          <p className="text-sm">{credential.description}</p>
        </div>
      )}
      
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Token</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">
            {credential.token}
          </code>
          <Button variant="outline" size="icon" onClick={onCopyToken}>
            {copiedToken ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {credential.persistedTime && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Created</p>
          <p className="text-sm">{formatDate(credential.persistedTime)}</p>
        </div>
      )}
      
      {/* Show deployments */}
      <div className="pt-2 border-t">
        <p className="text-sm font-medium text-muted-foreground mb-2">Application Deployments</p>
        {loadingDeployments ? (
          <Skeleton className="h-16 w-full" />
        ) : deployments.length > 0 ? (
          <div className="space-y-2">
            {deployments.map((deployment: ApplicationDeploymentDescription) => (
              <div key={deployment.appDeploymentId} className="flex items-center gap-2 p-2 bg-muted rounded">
                <Server className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{getComputeName(deployment.computeHostId)}</p>
                  <p className="text-xs text-muted-foreground">{deployment.executablePath || "N/A"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active deployments</p>
        )}
      </div>
    </div>
  );
}

// Component to display a credential card with deployments
function CredentialCard({ 
  credential, 
  computeResourcesMap, 
  onView, 
  onDelete 
}: { 
  credential: CredentialSummary; 
  computeResourcesMap: Record<string, string>;
  onView: () => void;
  onDelete: () => void;
}) {
  const { data: deployments = [], isLoading: loadingDeployments } = useDeploymentsByCredential(credential.token);
  
  const getComputeName = (computeHostId: string | null | undefined): string => {
    if (!computeHostId) return "Unknown";
    return computeResourcesMap[computeHostId] || computeHostId;
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onView}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${credential.type === "SSH" ? "bg-green-100" : "bg-orange-100"}`}>
            {credential.type === "SSH" ? (
              <Key className={`h-5 w-5 ${credential.type === "SSH" ? "text-green-600" : "text-orange-600"}`} />
            ) : (
              <Lock className="h-5 w-5 text-orange-600" />
            )}
          </div>
          <div>
            <CardTitle className="text-base">{credential.username}</CardTitle>
            <Badge variant="secondary" className="mt-1">{credential.type}</Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
              <Key className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Show gateway badge */}
          {credential.gatewayId && (
            <GatewayBadge gatewayId={credential.gatewayId} className="mb-2" />
          )}
          {credential.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{credential.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Token: {credential.token.substring(0, 12)}...
          </p>
          {credential.persistedTime && (
            <p className="text-xs text-muted-foreground">
              Created: {formatDate(credential.persistedTime)}
            </p>
          )}
          
          {/* Show deployments */}
          {loadingDeployments ? (
            <div className="mt-2">
              <Skeleton className="h-4 w-24" />
            </div>
          ) : deployments.length > 0 ? (
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-1">Active Deployments:</p>
              <div className="flex flex-wrap gap-1">
                {deployments.map((deployment: ApplicationDeploymentDescription) => (
                  <Badge key={deployment.appDeploymentId} variant="outline" className="text-xs">
                    <Server className="h-3 w-3 mr-1" />
                    {getComputeName(deployment.computeHostId)}: {deployment.executablePath || "N/A"}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">No active deployments</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CredentialsPage() {
  const { data: session } = useSession();
  const { effectiveGatewayId } = useGateway();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [credentialType, setCredentialType] = useState<"ssh" | "password">("ssh");
  
  // View/Edit state
  const [viewingCredential, setViewingCredential] = useState<CredentialSummary | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  
  // Delete state
  const [deletingCredential, setDeletingCredential] = useState<CredentialSummary | null>(null);
  
  const gatewayId =
    effectiveGatewayId ||
    session?.user?.gatewayId ||
    process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID ||
    "default";
  
  const { data: credentials, isLoading } = useCredentials();
  const createSSH = useCreateSSHCredential();
  const createPassword = useCreatePasswordCredential();
  const deleteCredential = useDeleteCredential();
  
  // Fetch compute resources for mapping IDs to names
  const { data: computeResourcesMap = {} } = useQuery({
    queryKey: ["compute-resources"],
    queryFn: () => computeResourcesApi.list(),
  });

  const handleCreateSSH = async (credential: SSHCredential) => {
    try {
      await createSSH.mutateAsync(credential);
      toast({ title: "SSH credential created", description: "Your SSH credential has been stored successfully." });
      setIsCreateOpen(false);
    } catch (error: unknown) {
      console.error("SSH credential creation error:", error);
      let errorMessage = "Failed to create credential";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Check for network/connection errors
      if (error && typeof error === 'object' && 'code' in error && (error.code === 'ERR_NETWORK' || 
          ('message' in error && typeof error.message === 'string' && error.message.includes('Network Error')))) {
        errorMessage = "Cannot connect to the server. Please ensure the backend is running.";
      } else if (error && typeof error === 'object' && 'status' in error && error.status === 500) {
        errorMessage = `Server error: ${error instanceof Error ? error.message : 'Internal server error. Check backend logs for details.'}`;
      }
      toast({ title: "Error creating credential", description: errorMessage, variant: "destructive" });
    }
  };

  const handleCreatePassword = async (credential: PasswordCredential) => {
    try {
      await createPassword.mutateAsync(credential);
      toast({ title: "Password credential created", description: "Your password credential has been stored successfully." });
      setIsCreateOpen(false);
    } catch (error: unknown) {
      console.error("Password credential creation error:", error);
      let errorMessage = "Failed to create credential";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Check for network/connection errors
      if (error && typeof error === 'object' && 'code' in error && (error.code === 'ERR_NETWORK' || 
          ('message' in error && typeof error.message === 'string' && error.message.includes('Network Error')))) {
        errorMessage = "Cannot connect to the server. Please ensure the backend is running.";
      } else if (error && typeof error === 'object' && 'status' in error && error.status === 500) {
        errorMessage = `Server error: ${error instanceof Error ? error.message : 'Internal server error. Check backend logs for details.'}`;
      }
      toast({ title: "Error creating credential", description: errorMessage, variant: "destructive" });
    }
  };

  const handleOpenView = (credential: CredentialSummary) => {
    setViewingCredential(credential);
    setIsViewOpen(true);
    setCopiedToken(false);
  };

  const handleCopyToken = async () => {
    if (viewingCredential) {
      await navigator.clipboard.writeText(viewingCredential.token);
      setCopiedToken(true);
      toast({ title: "Token copied", description: "Credential token copied to clipboard." });
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!deletingCredential) return;
    try {
      await deleteCredential.mutateAsync(deletingCredential.token);
      toast({ title: "Credential deleted", description: "The credential has been removed." });
      setDeletingCredential(null);
      if (viewingCredential?.token === deletingCredential.token) {
        setIsViewOpen(false);
        setViewingCredential(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete credential";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credentials</h1>
          <p className="text-muted-foreground">
            Manage SSH keys and password credentials for compute resources
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Credential
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !credentials || credentials.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Key className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No credentials</h3>
              <p className="text-muted-foreground mt-2">
                Create your first credential to enable secure connections
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {credentials.map((credential) => (
            <CredentialCard 
              key={credential.token}
              credential={credential}
              computeResourcesMap={computeResourcesMap}
              onView={() => handleOpenView(credential)}
              onDelete={() => setDeletingCredential(credential)}
            />
          ))}
        </div>
      )}

      {/* Create Credential Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Credential</DialogTitle>
            <DialogDescription>
              Add a new SSH key or password credential for connecting to compute resources
            </DialogDescription>
          </DialogHeader>

          <Tabs value={credentialType} onValueChange={(v) => setCredentialType(v as "ssh" | "password")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ssh">
                <Key className="mr-2 h-4 w-4" />
                SSH Key
              </TabsTrigger>
              <TabsTrigger value="password">
                <Lock className="mr-2 h-4 w-4" />
                Password
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ssh" className="mt-6">
              <SSHKeyForm
                onSubmit={handleCreateSSH}
                onCancel={() => setIsCreateOpen(false)}
                isLoading={createSSH.isPending}
                gatewayId={gatewayId}
              />
            </TabsContent>

            <TabsContent value="password" className="mt-6">
              <PasswordCredentialForm
                onSubmit={handleCreatePassword}
                onCancel={() => setIsCreateOpen(false)}
                isLoading={createPassword.isPending}
                gatewayId={gatewayId}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* View Credential Dialog */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { setIsViewOpen(open); if (!open) setViewingCredential(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingCredential?.type === "SSH" ? (
                <Key className="h-5 w-5 text-green-600" />
              ) : (
                <Lock className="h-5 w-5 text-orange-600" />
              )}
              Credential Details
            </DialogTitle>
            <DialogDescription>
              View credential information. Credentials cannot be edited for security reasons.
            </DialogDescription>
          </DialogHeader>
          
          {viewingCredential && (
            <CredentialDetails 
              credential={viewingCredential}
              computeResourcesMap={computeResourcesMap}
              copiedToken={copiedToken}
              onCopyToken={handleCopyToken}
            />
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setIsViewOpen(false); setViewingCredential(null); }}>
              Close
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => { if (viewingCredential) setDeletingCredential(viewingCredential); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCredential} onOpenChange={(open) => !open && setDeletingCredential(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credential</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the credential for &quot;{deletingCredential?.username}&quot;? 
              This may affect compute resources that use this credential. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCredential.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCredential.isPending}
            >
              {deleteCredential.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
