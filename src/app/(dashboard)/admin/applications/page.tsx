"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, AppWindow, MoreVertical, Pencil, Trash2, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApplicationInterfaces } from "@/hooks";
import { ApplicationInterfaceForm } from "@/components/applications/ApplicationInterfaceForm";
import { CreateApplicationWizard } from "@/components/applications/CreateApplicationWizard";
import { apiClient } from "@/lib/api/client";
import { toast } from "@/hooks/useToast";
import { useGateway } from "@/contexts/GatewayContext";
import type { ApplicationInterfaceDescription, ApplicationModule } from "@/types";

export default function AdminApplicationsPage() {
  const router = useRouter();
  const { selectedGatewayId } = useGateway();
  const gatewayId = selectedGatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
  
  const { data: applications, isLoading, refetch } = useApplicationInterfaces();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit state
  const [editingApp, setEditingApp] = useState<ApplicationInterfaceDescription | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Delete state
  const [deletingApp, setDeletingApp] = useState<ApplicationInterfaceDescription | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateModule = async (moduleData: Partial<ApplicationModule>): Promise<{ moduleId: string }> => {
    if (!gatewayId) {
      throw new Error("Please select a gateway");
    }
    
    const result = await apiClient.post<{ moduleId: string }>(`/api/v1/application-modules?gatewayId=${gatewayId}`, moduleData);
    toast({
      title: "Module created",
      description: "Application module created successfully.",
    });
    return result;
  };

  const handleCreateInterface = async (interfaceData: any) => {
    if (!gatewayId) {
      toast({
        title: "Error",
        description: "Please select a gateway",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const result = await apiClient.post<{ applicationInterfaceId: string }>(`/api/v1/application-interfaces?gatewayId=${gatewayId}`, interfaceData);
      toast({
        title: "Application created",
        description: "Application interface created successfully.",
      });
      setIsCreateOpen(false);
      refetch();
      router.push(`/admin/applications/${result.applicationInterfaceId}/deployments`);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : "Failed to create interface";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Create application interface error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (app: ApplicationInterfaceDescription) => {
    setEditingApp(app);
    setIsEditOpen(true);
  };

  const handleUpdateInterface = async (interfaceData: any) => {
    if (!editingApp) return;
    
    setIsSaving(true);
    try {
      await apiClient.put(`/api/v1/application-interfaces/${editingApp.applicationInterfaceId}`, {
        ...interfaceData,
        applicationInterfaceId: editingApp.applicationInterfaceId,
      });
      toast({
        title: "Application updated",
        description: "Application interface updated successfully.",
      });
      setIsEditOpen(false);
      setEditingApp(null);
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : "Failed to update interface";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Update application interface error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingApp) return;
    
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/application-interfaces/${deletingApp.applicationInterfaceId}`);
      toast({
        title: "Application deleted",
        description: "Application interface deleted successfully.",
      });
      setDeletingApp(null);
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : "Failed to delete application";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Delete application interface error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Management</h1>
            <p className="text-muted-foreground">
              Manage application interfaces and deployments
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Application
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !applications || applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AppWindow className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No applications configured</h3>
            <p className="text-muted-foreground mt-1">
              Add your first application to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <Card 
              key={app.applicationInterfaceId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenEdit(app)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <AppWindow className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{app.applicationName}</CardTitle>
                    <CardDescription className="text-xs mt-1 line-clamp-2">
                      {app.applicationDescription || "No description"}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(app);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Interface
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/applications/${app.applicationInterfaceId}/deployments`}>
                        <Server className="h-4 w-4 mr-2" />
                        Deployments
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingApp(app);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {app.applicationInputs?.length || 0} inputs
                  </Badge>
                  <Badge variant="outline">
                    {app.applicationOutputs?.length || 0} outputs
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Application Wizard Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Application</DialogTitle>
            <DialogDescription>
              Follow the steps below to create and configure your application
            </DialogDescription>
          </DialogHeader>
          
          <CreateApplicationWizard
            gatewayId={gatewayId}
            onCreateModule={handleCreateModule}
            onCreateInterface={handleCreateInterface}
            onCancel={() => setIsCreateOpen(false)}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Application Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setEditingApp(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Application Interface</DialogTitle>
            <DialogDescription>
              Update the application configuration, inputs, and outputs
            </DialogDescription>
          </DialogHeader>
          
          {editingApp && (
            <ApplicationInterfaceForm
              appInterface={editingApp}
              appModuleId={editingApp.applicationModules?.[0] || ""}
              onSubmit={handleUpdateInterface}
              onCancel={() => {
                setIsEditOpen(false);
                setEditingApp(null);
              }}
              isLoading={isSaving}
              gatewayId={gatewayId}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingApp} onOpenChange={(open) => !open && setDeletingApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingApp?.applicationName}&quot;? 
              This will also delete all associated deployments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
