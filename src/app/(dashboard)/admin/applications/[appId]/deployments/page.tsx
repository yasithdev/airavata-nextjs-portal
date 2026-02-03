"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, AlertCircle, Loader2, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi, apiClient } from "@/lib/api";
import { ApplicationDeploymentForm } from "@/components/applications/ApplicationDeploymentForm";
import { toast } from "@/hooks/useToast";
import { useGateway } from "@/contexts/GatewayContext";
import { usePortalConfig } from "@/contexts/PortalConfigContext";
import type { ApplicationDeploymentDescription, ApplicationInterfaceDescription } from "@/types";

export default function ApplicationDeploymentsPage() {
  const params = useParams();
  const router = useRouter();
  const { effectiveGatewayId } = useGateway();
  const { defaultGatewayId } = usePortalConfig();
  const gatewayId = effectiveGatewayId || defaultGatewayId;
  const appInterfaceId = params.appId as string;

  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<ApplicationDeploymentDescription | null>(null);
  const [deletingDeployment, setDeletingDeployment] = useState<ApplicationDeploymentDescription | null>(null);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);

  // Fetch the application interface to get the module ID
  const { 
    data: appInterface, 
    isLoading: isLoadingInterface, 
    error: interfaceError,
    refetch: refetchInterface
  } = useQuery({
    queryKey: ["application-interface", appInterfaceId],
    queryFn: async () => {
      console.log("[Deployments] Fetching application interface:", appInterfaceId);
      const result = await apiClient.get<ApplicationInterfaceDescription>(`/api/v1/application-interfaces/${appInterfaceId}`);
      console.log("[Deployments] Application interface result:", result);
      return result;
    },
    enabled: !!appInterfaceId,
    retry: 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Extract module ID from the interface
  const appModuleId = appInterface?.applicationModules?.[0];

  // Debug logging
  useEffect(() => {
    console.log("[Deployments] appInterfaceId:", appInterfaceId);
    console.log("[Deployments] appInterface:", appInterface);
    console.log("[Deployments] appModuleId:", appModuleId);
  }, [appInterfaceId, appInterface, appModuleId]);

  // Fetch deployments for the module
  const { 
    data: deployments, 
    isLoading: isLoadingDeployments, 
    error: deploymentsError,
    refetch: refetchDeployments
  } = useQuery({
    queryKey: ["application-deployments", appModuleId],
    queryFn: async () => {
      if (!appModuleId) {
        console.log("[Deployments] No appModuleId, skipping fetch");
        return [];
      }
      console.log("[Deployments] Fetching deployments for module:", appModuleId);
      const result = await applicationsApi.listDeployments(appModuleId);
      console.log("[Deployments] Deployments result:", result);
      return result;
    },
    enabled: !!appModuleId,
    retry: 2,
  });

  const isLoading = isLoadingInterface || (!!appModuleId && isLoadingDeployments);

  const createMutation = useMutation({
    mutationFn: (deploymentData: Partial<ApplicationDeploymentDescription>) =>
      applicationsApi.createDeployment(deploymentData, gatewayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-deployments", appModuleId] });
      toast({
        title: "Deployment created",
        description: "Application deployment created successfully.",
      });
      setIsCreateOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create deployment",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ deploymentId, data }: { deploymentId: string; data: Partial<ApplicationDeploymentDescription> }) =>
      applicationsApi.updateDeployment(deploymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-deployments", appModuleId] });
      toast({
        title: "Deployment updated",
        description: "Application deployment updated successfully.",
      });
      setEditingDeployment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update deployment",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (deploymentId: string) => applicationsApi.deleteDeployment(deploymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-deployments", appModuleId] });
      toast({
        title: "Deployment deleted",
        description: "Application deployment deleted successfully.",
      });
      setDeletingDeployment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete deployment",
        variant: "destructive",
      });
    },
  });

  const handleCreate = async (deploymentData: Partial<ApplicationDeploymentDescription>) => {
    if (!appModuleId) {
      toast({
        title: "Error",
        description: "Application module not found",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({ ...deploymentData, appModuleId });
  };

  const handleUpdate = async (deploymentData: Partial<ApplicationDeploymentDescription>) => {
    if (!editingDeployment) return;
    updateMutation.mutate({ deploymentId: editingDeployment.appDeploymentId, data: deploymentData });
  };

  const handleDelete = () => {
    if (!deletingDeployment) return;
    deleteMutation.mutate(deletingDeployment.appDeploymentId);
  };

  // Show error state
  if (interfaceError) {
    const errorMessage = interfaceError instanceof Error ? interfaceError.message : "Unknown error";
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/catalog/APPLICATION/${appInterfaceId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Deployments</h1>
          </div>
        </div>
        
        <Card className="border-destructive">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold">Failed to load application</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                {errorMessage}
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => refetchInterface()}>
                  Try Again
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/catalog/APPLICATION/${appInterfaceId}`}>Back to Application</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoadingInterface) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/catalog/APPLICATION/${appInterfaceId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Deployments</h1>
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // No module ID found
  if (!appModuleId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/catalog/APPLICATION/${appInterfaceId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Deployments</h1>
            {appInterface?.applicationName && (
              <p className="text-muted-foreground">{appInterface.applicationName}</p>
            )}
          </div>
        </div>
        
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-semibold">No Application Module Found</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                This application interface doesn&apos;t have an associated module. 
                Deployments require an application module.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href={`/catalog/APPLICATION/${appInterfaceId}`}>Back to Application</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/catalog/APPLICATION/${appInterfaceId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Deployments</h1>
            {appInterface?.applicationName && (
              <p className="text-muted-foreground">{appInterface.applicationName}</p>
            )}
          </div>
        </div>

        {/* Deployments Pills */}
        {isLoadingDeployments ? (
          <div className="flex gap-2 flex-wrap">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {deployments && deployments.length > 0 ? (
              deployments.map((deployment) => {
                const isSelected = selectedDeploymentId === deployment.appDeploymentId;
                return (
                  <button
                    key={deployment.appDeploymentId}
                    onClick={() => setSelectedDeploymentId(
                      isSelected ? null : deployment.appDeploymentId
                    )}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                      isSelected ? "bg-blue-500 text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <Server className="h-4 w-4" />
                    <span>{deployment.appDeploymentDescription || deployment.computeHostId || "Deployment"}</span>
                    {deployment.computeHostId && (
                      <Badge
                        variant={isSelected ? "secondary" : "outline"}
                        className={cn("ml-1", isSelected ? "bg-white/20 text-white" : "")}
                      >
                        {deployment.computeHostId}
                      </Badge>
                    )}
                  </button>
                );
              })
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="rounded-full text-sm font-medium"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Deployment
            </Button>
          </div>
        )}
      </div>

      {deploymentsError && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Failed to load deployments</p>
                <p className="text-sm text-muted-foreground">
                  {deploymentsError instanceof Error ? deploymentsError.message : "Unknown error"}
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => refetchDeployments()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Application Deployment</DialogTitle>
            <DialogDescription>
              Configure how this application runs on a compute resource
            </DialogDescription>
          </DialogHeader>
          <ApplicationDeploymentForm
            appModuleId={appModuleId}
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDeployment} onOpenChange={(open) => !open && setEditingDeployment(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Application Deployment</DialogTitle>
            <DialogDescription>
              Update deployment configuration
            </DialogDescription>
          </DialogHeader>
          {editingDeployment && (
            <ApplicationDeploymentForm
              appModuleId={appModuleId}
              deployment={editingDeployment}
              onSubmit={handleUpdate}
              onCancel={() => setEditingDeployment(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDeployment} onOpenChange={(open) => !open && setDeletingDeployment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deployment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deployment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deployment Details */}
      {selectedDeploymentId && deployments && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {deployments.find(d => d.appDeploymentId === selectedDeploymentId)?.appDeploymentDescription || "Deployment"}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const deployment = deployments.find(d => d.appDeploymentId === selectedDeploymentId);
                    if (deployment) setEditingDeployment(deployment);
                  }}
                >
                  <Pencil className="mr-2 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    const deployment = deployments.find(d => d.appDeploymentId === selectedDeploymentId);
                    if (deployment) setDeletingDeployment(deployment);
                  }}
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const deployment = deployments.find(d => d.appDeploymentId === selectedDeploymentId);
              if (!deployment) return null;
              return (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Compute Resource</p>
                    <p className="font-medium">{deployment.computeHostId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Executable Path</p>
                    <p className="font-mono text-sm">{deployment.executablePath}</p>
                  </div>
                  {deployment.parallelism && (
                    <div>
                      <p className="text-sm text-muted-foreground">Parallelism</p>
                      <Badge variant="secondary">{deployment.parallelism}</Badge>
                    </div>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {!isLoadingDeployments && (!deployments || deployments.length === 0) && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p className="text-lg font-medium text-foreground mb-2">No deployments configured</p>
            <p>Create a deployment to run this application on a compute resource.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
