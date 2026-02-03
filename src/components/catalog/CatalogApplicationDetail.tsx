"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Plus, AlertCircle, MoreVertical, AppWindow, Server, ArrowDownToLine, ArrowUpFromLine, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { usePortalConfig } from "@/contexts/PortalConfigContext";
import { useUserRole } from "@/contexts/AdvancedFeaturesContext";
import { useCreateExperimentModal } from "@/contexts/CreateExperimentModalContext";
import { cn } from "@/lib/utils";
import type { ApplicationDeploymentDescription, ApplicationInterfaceDescription } from "@/types";

interface CatalogApplicationDetailProps {
  appId: string;
  /** When set, renders a back button inline with the title (like storage/compute detail pages). */
  backHref?: string;
}

export function CatalogApplicationDetail({ appId, backHref }: CatalogApplicationDetailProps) {
  const router = useRouter();
  const { effectiveGatewayId } = useGateway();
  const { selectedRole } = useUserRole();
  const { openModal } = useCreateExperimentModal();
  const { defaultGatewayId } = usePortalConfig();
  const gatewayId = effectiveGatewayId || defaultGatewayId;
  const isAdmin = selectedRole === "gateway-admin" || selectedRole === "system-admin";

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
    queryKey: ["application-interface", appId],
    queryFn: async () => {
      const result = await apiClient.get<ApplicationInterfaceDescription>(`/api/v1/application-interfaces/${appId}`);
      return result;
    },
    enabled: !!appId,
    retry: 2,
    staleTime: 30000,
  });

  // Extract module ID from the interface
  const appModuleId = appInterface?.applicationModules?.[0];

  // Fetch application module to get version
  const { 
    data: appModule,
  } = useQuery({
    queryKey: ["application-module", appModuleId],
    queryFn: async () => {
      if (!appModuleId) return null;
      return applicationsApi.getModule(appModuleId);
    },
    enabled: !!appModuleId,
    retry: 2,
  });

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
      apiClient.put(`/api/v1/application-interfaces/${appId}`, interfaceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-interface", appId] });
      toast({
        title: "Application updated",
        description: "Application configuration updated successfully.",
      });
      setIsEditInterfaceOpen(false);
      refetchInterface();
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
      // Backend will automatically ensure STDOUT, STDERR, and STDIN are present
      await updateInterfaceMutation.mutateAsync({
        ...interfaceData,
        applicationInterfaceId: appId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApplication = async () => {
    setIsDeletingApp(true);
    try {
      await apiClient.delete(`/api/v1/application-interfaces/${appId}`);
      toast({
        title: "Application deleted",
        description: "Application interface deleted successfully.",
      });
      setShowDeleteAppDialog(false);
      router.push("/catalog");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete application";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeletingApp(false);
    }
  };

  const handleCreateExperiment = () => {
    if (appInterface) {
      openModal({ application: appInterface });
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
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (interfaceError || !appInterface) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold">Failed to load application</h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              {interfaceError instanceof Error ? interfaceError.message : "Application not found"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions - back button inline with title when backHref is set (like storage/compute) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backHref && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={backHref}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{appInterface.applicationName}</h1>
              <Badge>Application</Badge>
            </div>
            <p className="text-muted-foreground">{appInterface.applicationDescription || "No description"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateExperiment}>
            Create Experiment
          </Button>
          {isAdmin && (
            <>
              <Button 
                variant="outline"
                onClick={() => setIsEditInterfaceOpen(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
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
            </>
          )}
        </div>
      </div>

      {/* Application Interface Details */}
      <Card>
        <CardHeader>
          <CardTitle>Application Interface</CardTitle>
          <CardDescription>Application configuration details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p className="text-sm">{appInterface.applicationName}</p>
            </div>
            {appModule && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Version</p>
                <p className="text-sm">{appModule.appModuleVersion || "N/A"}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{appInterface.applicationDescription || "No description"}</p>
            </div>
          </div>

          {/* Fields: one table with icon column (input/output), inputs first then outputs */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Fields</p>
            <Table className="[&_th]:h-9 [&_th]:py-1.5 [&_th]:px-3 [&_td]:py-1.5 [&_td]:px-3">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" title="Input / Output" />
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>CLI Args</TableHead>
                  <TableHead>Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appInterface.applicationInputs && appInterface.applicationInputs.length > 0 ? (
                  appInterface.applicationInputs.map((input, idx) => {
                    const isSystemInput = input.name === "STDIN";
                    return (
                      <TableRow key={`input-${idx}`}>
                        <TableCell className="w-10 align-middle py-1.5" title="Input">
                          <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium py-1.5">
                          <div className="flex items-center gap-2">
                            {input.name}
                            {isSystemInput && (
                              <Badge variant="secondary" className="text-xs">System</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground py-1.5">{input.type}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm py-1.5">{input.applicationArgument || "-"}</TableCell>
                        <TableCell className="py-1.5">
                          <Button
                            type="button"
                            variant={input.isRequired ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "h-7 min-w-[5.5rem] text-xs pointer-events-none",
                              input.isRequired ? "bg-primary text-primary-foreground" : "bg-background border border-input"
                            )}
                            disabled
                          >
                            {input.isRequired ? "Required" : "Optional"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell className="w-10 align-middle py-1.5" title="Input">
                      <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell colSpan={4} className="text-muted-foreground text-sm py-1.5">
                      No inputs defined. STDIN is automatically added by the system.
                    </TableCell>
                  </TableRow>
                )}
                {appInterface.applicationOutputs && appInterface.applicationOutputs.length > 0 ? (
                  appInterface.applicationOutputs.map((output, idx) => {
                    const isSystemOutput = output.name === "STDOUT" || output.name === "STDERR";
                    return (
                      <TableRow key={`output-${idx}`}>
                        <TableCell className="w-10 align-middle py-1.5" title="Output">
                          <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium py-1.5">
                          <div className="flex items-center gap-2">
                            {output.name}
                            {isSystemOutput && (
                              <Badge variant="secondary" className="text-xs">System</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground py-1.5">{output.type}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm py-1.5">{output.applicationArgument || "-"}</TableCell>
                        <TableCell className="py-1.5">
                          <Button
                            type="button"
                            variant={output.isRequired ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "h-7 min-w-[5.5rem] text-xs pointer-events-none",
                              output.isRequired ? "bg-primary text-primary-foreground" : "bg-background border border-input"
                            )}
                            disabled
                          >
                            {output.isRequired ? "Required" : "Optional"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell className="w-10 align-middle py-1.5" title="Output">
                      <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell colSpan={4} className="text-muted-foreground text-sm py-1.5">
                      No outputs defined. STDOUT and STDERR are automatically added by the system.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
            {isAdmin && appModuleId && (
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
          {isLoadingDeployments ? (
            <Skeleton className="h-32 w-full" />
          ) : deploymentsError ? (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load deployments
            </div>
          ) : !deployments || deployments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deployments configured
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compute Resource</TableHead>
                  <TableHead>Executable Path</TableHead>
                  <TableHead>Queue</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {deployments.map((deployment) => (
                  <TableRow key={deployment.appDeploymentId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        {getComputeName(deployment.computeHostId)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {deployment.executablePath || "-"}
                    </TableCell>
                    <TableCell>
                      {deployment.queueName ? (
                        <Badge variant="outline">{deployment.queueName}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                            onClick={() => setDeletingDeployment(deployment)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Interface Dialog */}
      <Dialog open={isEditInterfaceOpen} onOpenChange={setIsEditInterfaceOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle>Edit Application Interface</DialogTitle>
            <DialogDescription>
              Update application interface configuration
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
            <ApplicationInterfaceForm
              key={isEditInterfaceOpen ? `edit-${appId}` : "create"}
              appInterface={appInterface}
              appModuleId={appModuleId || ""}
              onSubmit={handleUpdateInterface}
              onCancel={() => setIsEditInterfaceOpen(false)}
              isLoading={isSaving}
              gatewayId={gatewayId}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Deployment Dialog */}
      <Dialog open={isCreateDeploymentOpen} onOpenChange={setIsCreateDeploymentOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Deployment</DialogTitle>
            <DialogDescription>
              Configure a new deployment for this application
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
      {editingDeployment && (
        <Dialog open={!!editingDeployment} onOpenChange={(open) => !open && setEditingDeployment(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Deployment</DialogTitle>
              <DialogDescription>
                Update deployment configuration
              </DialogDescription>
            </DialogHeader>
            <ApplicationDeploymentForm
              appModuleId={appModuleId || ""}
              deployment={editingDeployment}
              onSubmit={handleUpdateDeployment}
              onCancel={() => setEditingDeployment(null)}
              isLoading={updateDeploymentMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

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
            <AlertDialogCancel disabled={deleteDeploymentMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeployment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
              Are you sure you want to delete &quot;{appInterface.applicationName}&quot;? 
              This will also delete all associated deployments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingApp}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApplication}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
