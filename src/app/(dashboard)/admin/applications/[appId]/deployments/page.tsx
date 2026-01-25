"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { ApplicationDeploymentDescription } from "@/types";

export default function ApplicationDeploymentsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
  const appInterfaceId = params.appId as string;

  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<ApplicationDeploymentDescription | null>(null);
  const [deletingDeployment, setDeletingDeployment] = useState<ApplicationDeploymentDescription | null>(null);

  // First, get the application interface to extract the module ID
  const { data: appInterface, isLoading: isLoadingInterface, error: interfaceError } = useQuery({
    queryKey: ["application-interface", appInterfaceId],
    queryFn: () =>
      apiClient.get<any>(`/api/v1/application-interfaces/${appInterfaceId}`),
    enabled: !!appInterfaceId,
    retry: 1,
  });

  const appModuleId = appInterface?.applicationModules?.[0];

  const { data: deployments, isLoading: isLoadingDeployments, error: deploymentsError } = useQuery({
    queryKey: ["application-deployments", appModuleId],
    queryFn: () =>
      applicationsApi.listDeployments(appModuleId || ""),
    enabled: !!appModuleId,
    retry: 1,
  });

  const isLoading = isLoadingInterface || (!!appModuleId && isLoadingDeployments);
  const hasError = interfaceError || deploymentsError;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/applications">
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
        <Button onClick={() => setIsCreateOpen(true)} disabled={!appModuleId}>
          <Plus className="mr-2 h-4 w-4" />
          New Deployment
        </Button>
      </div>

      {hasError && (
        <Card className="border-destructive">
          <CardContent className="py-6 text-center text-destructive">
            Failed to load application data. Please try again or check your connection.
            <br />
            <span className="text-sm text-muted-foreground">
              {(interfaceError as Error)?.message || (deploymentsError as Error)?.message}
            </span>
          </CardContent>
        </Card>
      )}

      {isLoading && <Skeleton className="h-48 w-full" />}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Application Deployment</DialogTitle>
            <DialogDescription>
              Configure how this application runs on a compute resource
            </DialogDescription>
          </DialogHeader>
          {appModuleId && (
            <ApplicationDeploymentForm
              appModuleId={appModuleId}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createMutation.isPending}
            />
          )}
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
          {editingDeployment && appModuleId && (
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

      {!isLoading && !hasError && (
        <>
          {deployments && deployments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {deployments.map((deployment) => (
                <Card key={deployment.appDeploymentId}>
                  <CardHeader>
                    <CardTitle className="text-base">{deployment.appDeploymentDescription}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingDeployment(deployment)}
                      >
                        <Pencil className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => setDeletingDeployment(deployment)}
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                No deployments configured. Create a deployment to run this application.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
