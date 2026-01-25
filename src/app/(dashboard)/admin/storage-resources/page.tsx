"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Database, MoreVertical, Pencil, Trash2, Wifi } from "lucide-react";
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
import { storageResourcesApi } from "@/lib/api";
import { StorageResourceForm } from "@/components/storage/StorageResourceForm";
import { TestConnectionModal } from "@/components/connectivity/TestConnectionModal";
import { toast } from "@/hooks/useToast";
import type { StorageResourceDescription } from "@/types";

export default function StorageResourcesPage() {
  const [resources, setResources] = useState<StorageResourceDescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<StorageResourceDescription | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingResource, setDeletingResource] = useState<StorageResourceDescription | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [testingResource, setTestingResource] = useState<StorageResourceDescription | null>(null);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await storageResourcesApi.list();
      
      // Ensure we always have an array
      if (Array.isArray(data)) {
        setResources(data);
      } else if (typeof data === 'object' && data !== null) {
        // Handle object response (map of id -> hostname) - fetch full details for each
        const resourceIds = Object.keys(data);
        
        // Fetch full details for each resource
        const resourcePromises = resourceIds.map(async (id) => {
          try {
            return await storageResourcesApi.get(id);
          } catch (err) {
            console.error(`Failed to fetch storage resource ${id}:`, err);
            // Return a partial object if fetch fails
            return {
              storageResourceId: id,
              hostName: (data as Record<string, string>)[id],
              enabled: true,
            } as StorageResourceDescription;
          }
        });
        
        const resourcesArray = await Promise.all(resourcePromises);
        setResources(resourcesArray);
      } else {
        console.warn("Unexpected data format:", data);
        setResources([]);
      }
    } catch (error) {
      console.error("Failed to load storage resources:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : "Failed to load storage resources. Please check your connection and try again.";
      setError(errorMessage);
      setResources([]);
      toast({
        title: "Error loading resources",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (resourceData: Partial<StorageResourceDescription>) => {
    setIsSaving(true);
    try {
      const result = await storageResourcesApi.create(resourceData);
      toast({
        title: "Storage resource created",
        description: `The storage resource has been registered successfully. ID: ${result.storageResourceId}`,
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
      console.error("Create storage resource error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (resource: StorageResourceDescription) => {
    setEditingResource(resource);
    setIsEditOpen(true);
  };

  const handleUpdate = async (resourceData: Partial<StorageResourceDescription>) => {
    if (!editingResource?.storageResourceId) return;
    setIsSaving(true);
    try {
      await storageResourcesApi.update(editingResource.storageResourceId, resourceData);
      toast({
        title: "Storage resource updated",
        description: "The storage resource has been updated successfully.",
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
      console.error("Update storage resource error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingResource?.storageResourceId) return;
    setIsDeleting(true);
    try {
      await storageResourcesApi.delete(deletingResource.storageResourceId);
      toast({
        title: "Storage resource deleted",
        description: "The storage resource has been deleted.",
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
            <h1 className="text-3xl font-bold tracking-tight">Storage Resources</h1>
            <p className="text-muted-foreground">
              Manage storage systems and file transfers
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Storage Resource</DialogTitle>
            <DialogDescription>
              Register a new storage resource for data management
            </DialogDescription>
          </DialogHeader>
          <StorageResourceForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Storage Resource</DialogTitle>
            <DialogDescription>
              Update storage resource configuration
            </DialogDescription>
          </DialogHeader>
          {editingResource && (
            <StorageResourceForm
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
              <Database className="h-5 w-5 text-red-600" />
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
      ) : !error && resources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Database className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No storage resources</h3>
            <p className="text-muted-foreground mt-1">
              Add your first storage resource to get started
            </p>
          </CardContent>
        </Card>
      ) : !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card 
              key={resource.storageResourceId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEdit(resource)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Database className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{resource.hostName}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {resource.storageResourceDescription || "No description"}
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
                    <DropdownMenuItem onClick={() => handleEdit(resource)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); setTestingResource(resource); }}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Test Connection
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeletingResource(resource); }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant="outline" 
                  className={resource.enabled ? "text-green-600 border-green-600" : "text-gray-600 border-gray-600"}
                >
                  {resource.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </CardContent>
            </Card>
          )          )}
        </div>
      )}

      {/* Delete Storage Resource Dialog */}
      <AlertDialog open={!!deletingResource} onOpenChange={(open) => !open && setDeletingResource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Storage Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingResource?.hostName}&quot;? 
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
          resourceType="storage"
          hostname={testingResource.hostName}
          port={22}
        />
      )}
    </div>
  );
}
