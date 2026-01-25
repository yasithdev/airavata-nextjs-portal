"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Server, MoreVertical, Pencil, Trash2, Wifi } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { computeResourcesApi } from "@/lib/api";
import { ComputeResourceForm } from "@/components/compute/ComputeResourceForm";
import { TestConnectionModal } from "@/components/connectivity/TestConnectionModal";
import { toast } from "@/hooks/useToast";
import type { ComputeResourceDescription } from "@/types";

export default function ComputeResourcesPage() {
  const [resources, setResources] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ComputeResourceDescription | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingResource, setDeletingResource] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [testingResource, setTestingResource] = useState<{ id: string; hostname: string } | null>(null);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await computeResourcesApi.list();
      
      // Handle both object and array responses
      if (Array.isArray(data)) {
        const resourcesMap: Record<string, string> = {};
        data.forEach((resource: any) => {
          const id = resource.computeResourceId || resource.id || resource.hostName;
          const name = resource.hostName || resource.name || id;
          resourcesMap[id] = name;
        });
        setResources(resourcesMap);
      } else if (typeof data === 'object' && data !== null) {
        setResources(data);
      } else {
        setResources({});
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : "Failed to load compute resources. Please check your connection and try again.";
      setError(errorMessage);
      setResources({});
      toast({
        title: "Error loading resources",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (resourceData: Partial<ComputeResourceDescription>) => {
    setIsSaving(true);
    try {
      const result = await computeResourcesApi.create(resourceData);
      toast({
        title: "Compute resource created",
        description: `The compute resource has been registered successfully. ID: ${result.computeResourceId}`,
      });
      setIsCreateOpen(false);
      loadResources();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : "Failed to create resource";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (resourceId: string) => {
    try {
      const resource = await computeResourcesApi.get(resourceId);
      setEditingResource(resource);
      setIsEditOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load resource",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (resourceData: Partial<ComputeResourceDescription>) => {
    if (!editingResource?.computeResourceId) return;
    setIsSaving(true);
    try {
      await computeResourcesApi.update(editingResource.computeResourceId, resourceData);
      toast({
        title: "Compute resource updated",
        description: "The compute resource has been updated successfully.",
      });
      setIsEditOpen(false);
      setEditingResource(null);
      loadResources();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : "Failed to update resource";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingResource) return;
    setIsDeleting(true);
    try {
      await computeResourcesApi.delete(deletingResource);
      toast({
        title: "Compute resource deleted",
        description: "The compute resource has been deleted.",
      });
      setDeletingResource(null);
      loadResources();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete resource",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resourceList = Object.entries(resources);

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
            <h1 className="text-3xl font-bold tracking-tight">Compute Resources</h1>
            <p className="text-muted-foreground">
              Manage HPC clusters and compute infrastructure
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Compute Resource</DialogTitle>
            <DialogDescription>
              Register a new HPC cluster or compute resource
            </DialogDescription>
          </DialogHeader>
          <ComputeResourceForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Compute Resource</DialogTitle>
            <DialogDescription>
              Update compute resource configuration
            </DialogDescription>
          </DialogHeader>
          {editingResource && (
            <ComputeResourceForm
              resource={editingResource}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditOpen(false);
                setEditingResource(null);
              }}
              isLoading={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error loading resources</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={loadResources}
                >
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !error && resourceList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Server className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No compute resources</h3>
            <p className="text-muted-foreground mt-1">
              Add your first compute resource to get started
            </p>
          </CardContent>
        </Card>
      ) : !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resourceList.map(([id, name]) => (
            <Card 
              key={id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEdit(id)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Server className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{name}</CardTitle>
                    <CardDescription className="text-xs mt-1">{id}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(id)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setTestingResource({ id, hostname: name });
                      }}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Test Connection
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingResource(id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Active
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Resource Dialog */}
      <AlertDialog open={!!deletingResource} onOpenChange={(open) => !open && setDeletingResource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Compute Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingResource && resources[deletingResource]}&quot;? 
              This action cannot be undone.
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

      {/* Test Connection Modal */}
      {testingResource && (
        <TestConnectionModal
          open={!!testingResource}
          onOpenChange={(open) => !open && setTestingResource(null)}
          resourceType="compute"
          hostname={testingResource.hostname}
          port={22}
        />
      )}
    </div>
  );
}
