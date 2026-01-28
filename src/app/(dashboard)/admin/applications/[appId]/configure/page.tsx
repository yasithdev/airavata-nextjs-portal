"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, AlertCircle, Loader2, Server, Save, MoreVertical, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi, apiClient, computeResourcesApi } from "@/lib/api";
import { ApplicationDeploymentForm } from "@/components/applications/ApplicationDeploymentForm";
import { ApplicationInterfaceForm } from "@/components/applications/ApplicationInterfaceForm";
import { toast } from "@/hooks/useToast";
import { useGateway } from "@/contexts/GatewayContext";
import { cn } from "@/lib/utils";
import type { ApplicationDeploymentDescription, ApplicationInterfaceDescription } from "@/types";

export default function ApplicationConfigurePage() {
  const params = useParams();
  const router = useRouter();
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
  const appInterfaceId = params.appId as string;

  const queryClient = useQueryClient();
  const [isCreateDeploymentOpen, setIsCreateDeploymentOpen] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<ApplicationDeploymentDescription | null>(null);
  const [deletingDeployment, setDeletingDeployment] = useState<ApplicationDeploymentDescription | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditInterfaceOpen, setIsEditInterfaceOpen] = useState(false);
  const [isDeletingApp, setIsDeletingApp] = useState(false);
  const [showDeleteAppDialog, setShowDeleteAppDialog] = useState(false);

  // Fetch the application interface
  const { 
    data: appInterface, 
    isLoading: isLoadingInterface, 
    error: interfaceError,
    refetch: refetchInterface
  } = useQuery({
    queryKey: ["application-interface", appInterfaceId],
    queryFn: async () => {
      const result = await apiClient.get<ApplicationInterfaceDescription>(`/api/v1/application-interfaces/${appInterfaceId}`);
      return result;
    },
    enabled: !!appInterfaceId,
    retry: 2,
    staleTime: 30000,
  });

  // Extract module ID from the interface
  const appModuleId = appInterface?.applicationModules?.[0];

  // Fetch deployments for the module
  const { 
    data: deployments, 
    isLoading: isLoadingDeployments, 
    error: deploymentsError,
    refetch: refetchDeployments
  } = useQuery({
    queryKey: ["application-deployments", appModuleId],
    queryFn: async () => {
      if (!appModuleId) return [];
      return applicationsApi.listDeployments(appModuleId);
    },
    enabled: !!appModuleId,
    retry: 2,
  });

  // Fetch compute resources to get names
  const { data: computeResourcesMap } = useQuery({
    queryKey: ["compute-resources"],
    queryFn: () => computeResourcesApi.list(),
  });

  const createDeploymentMutation = useMutation({
    mutationFn: (deploymentData: Partial<ApplicationDeploymentDescription>) =>
      applicationsApi.createDeployment(deploymentData, gatewayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-deployments", appModuleId] });
      toast({
        title: "Deployment created",
        description: "Application deployment created successfully.",
      });
      setIsCreateDeploymentOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create deployment",
        variant: "destructive",
      });
    },
  });

  const updateDeploymentMutation = useMutation({
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

  const deleteDeploymentMutation = useMutation({
    mutationFn: (deploymentId: string) => applicationsApi.deleteDeployment(deploymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-deployments", appModuleId] });
      toast({
        title: "Deployment deleted",
        description: "Application deployment deleted successfully.",
      });
      setDeletingDeployment(null);
      setSelectedDeploymentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete deployment",
        variant: "destructive",
      });
    },
  });

  const updateInterfaceMutation = useMutation({
    mutationFn: (interfaceData: any) =>
      apiClient.put(`/api/v1/application-interfaces/${appInterfaceId}`, interfaceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-interface", appInterfaceId] });
      toast({
        title: "Application updated",
        description: "Application interface updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update interface",
        variant: "destructive",
      });
    },
  });

  const handleCreateDeployment = async (deploymentData: Partial<ApplicationDeploymentDescription>) => {
    if (!appModuleId) {
      toast({
        title: "Error",
        description: "Application module not found",
        variant: "destructive",
      });
      return;
    }
    createDeploymentMutation.mutate({ ...deploymentData, appModuleId });
  };

  const handleUpdateDeployment = async (deploymentData: Partial<ApplicationDeploymentDescription>) => {
    if (!editingDeployment) return;
    updateDeploymentMutation.mutate({ deploymentId: editingDeployment.appDeploymentId, data: deploymentData });
  };

  const handleDeleteDeployment = () => {
    if (!deletingDeployment) return;
    deleteDeploymentMutation.mutate(deletingDeployment.appDeploymentId);
  };

  const handleUpdateInterface = async (interfaceData: any) => {
    setIsSaving(true);
    try {
      await updateInterfaceMutation.mutateAsync({
        ...interfaceData,
        applicationInterfaceId: appInterfaceId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApplication = async () => {
    setIsDeletingApp(true);
    try {
      await apiClient.delete(`/api/v1/application-interfaces/${appInterfaceId}`);
      toast({
        title: "Application deleted",
        description: "Application interface deleted successfully.",
      });
      router.push("/admin/applications");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete application";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeletingApp(false);
      setShowDeleteAppDialog(false);
    }
  };

  // Helper to get compute resource name
  const getComputeName = (computeHostId: string): string => {
    if (!computeResourcesMap) return computeHostId;
    return computeResourcesMap[computeHostId] || computeHostId;
  };

  if (isLoadingInterface) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (interfaceError || !appInterface) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/applications">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Configuration</h1>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold">Failed to load application</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                {interfaceError instanceof Error ? interfaceError.message : "Application not found"}
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/admin/applications">Back to Applications</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight">{appInterface.applicationName}</h1>
            <p className="text-muted-foreground">Configure application interface and deployments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setIsEditInterfaceOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Application
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteAppDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Application
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-6">
        {/* Application Interface - Readonly */}
        <Card>
          <CardHeader>
            <CardTitle>Application Interface</CardTitle>
            <CardDescription>Application configuration details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Application Name</p>
                <p className="font-medium">{appInterface.applicationName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{appInterface.applicationDescription || "No description"}</p>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <p className="text-sm font-medium mb-2">Input Fields ({appInterface.applicationInputs?.length || 0})</p>
              {appInterface.applicationInputs && appInterface.applicationInputs.length > 0 ? (
                <div className="space-y-2">
                  {appInterface.applicationInputs.map((input, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                        <span className="font-medium">{input.name}</span>
                        <span className="text-muted-foreground">{input.type}</span>
                        <span className="text-muted-foreground truncate">{input.userFriendlyDescription || "-"}</span>
                        <span className={input.isRequired ? "text-orange-600" : "text-muted-foreground"}>
                          {input.isRequired ? "Required" : "Optional"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No inputs defined</p>
              )}
            </div>

            {/* Outputs */}
            <div>
              <p className="text-sm font-medium mb-2">Output Fields ({appInterface.applicationOutputs?.length || 0})</p>
              {appInterface.applicationOutputs && appInterface.applicationOutputs.length > 0 ? (
                <div className="space-y-2">
                  {appInterface.applicationOutputs.map((output, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                        <span className="font-medium">{output.name}</span>
                        <span className="text-muted-foreground">{output.type}</span>
                        <span className="text-muted-foreground">{output.metaData || "-"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No outputs defined</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deployments Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Deployments</CardTitle>
                <CardDescription>Application deployment configurations</CardDescription>
              </div>
              {appModuleId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateDeploymentOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Deployment
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!appModuleId ? (
              <div className="py-8 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <p className="text-lg font-medium text-foreground mb-2">No Application Module Found</p>
                <p>This application interface doesn&apos;t have an associated module. Deployments require an application module.</p>
              </div>
            ) : isLoadingDeployments ? (
              <Skeleton className="h-64 w-full" />
            ) : !deployments || deployments.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <p className="text-lg font-medium text-foreground mb-2">No deployments configured</p>
                <p>Create a deployment to run this application on a compute resource.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compute Resource</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Executable Path</TableHead>
                    <TableHead>Parallelism</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.map((deployment) => (
                    <TableRow key={deployment.appDeploymentId}>
                      <TableCell className="font-medium">
                        {getComputeName(deployment.computeHostId)}
                      </TableCell>
                      <TableCell>
                        {deployment.appDeploymentDescription || "-"}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{deployment.executablePath}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{deployment.parallelism || "SERIAL"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingDeployment(deployment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingDeployment(deployment)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Interface Dialog */}
      <Dialog open={isEditInterfaceOpen} onOpenChange={setIsEditInterfaceOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Application Interface</DialogTitle>
            <DialogDescription>
              Update the application configuration, inputs, and outputs
            </DialogDescription>
          </DialogHeader>
          <ApplicationInterfaceForm
            appInterface={appInterface}
            appModuleId={appModuleId || ""}
            onSubmit={handleUpdateInterface}
            onCancel={() => setIsEditInterfaceOpen(false)}
            isLoading={isSaving}
            gatewayId={gatewayId}
          />
        </DialogContent>
      </Dialog>

      {/* Create Deployment Dialog */}
      <Dialog open={isCreateDeploymentOpen} onOpenChange={setIsCreateDeploymentOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Application Deployment</DialogTitle>
            <DialogDescription>
              Configure how this application runs on a compute resource
            </DialogDescription>
          </DialogHeader>
          <ApplicationDeploymentForm
            appModuleId={appModuleId || ""}
            onSubmit={handleCreateDeployment}
            onCancel={() => setIsCreateDeploymentOpen(false)}
            isLoading={createDeploymentMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Deployment Dialog */}
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
              appModuleId={appModuleId || ""}
              deployment={editingDeployment}
              onSubmit={handleUpdateDeployment}
              onCancel={() => setEditingDeployment(null)}
              isLoading={updateDeploymentMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Deployment Dialog */}
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
            <AlertDialogAction 
              onClick={handleDeleteDeployment} 
              className="bg-destructive text-destructive-foreground"
              disabled={deleteDeploymentMutation.isPending}
            >
              {deleteDeploymentMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Application Dialog */}
      <AlertDialog open={showDeleteAppDialog} onOpenChange={setShowDeleteAppDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{appInterface?.applicationName}&quot;? 
              This will also delete all associated deployments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingApp}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteApplication} 
              className="bg-destructive text-destructive-foreground"
              disabled={isDeletingApp}
            >
              {isDeletingApp ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
