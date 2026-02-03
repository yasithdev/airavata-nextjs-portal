"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Server, Copy, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { storageResourcesApi } from "@/lib/api/storage-resources";
import { useGateway } from "@/contexts/GatewayContext";
import { CredentialsAndPermissionsTable } from "@/components/resources/CredentialsAndPermissionsTable";
import { toast } from "@/hooks/useToast";
import { StorageTestConnectionCard } from "@/components/storage/StorageTestConnectionCard";
import { StorageResourceModal } from "@/components/storage/StorageResourceModal";
import { PreferenceResourceType } from "@/types";

export default function StorageResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || "";
  const resourceId = params.resourceId as string;
  const queryClient = useQueryClient();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: resource, isLoading, error } = useQuery({
    queryKey: ["storage-resources", resourceId],
    queryFn: () => storageResourcesApi.get(resourceId),
    enabled: !!resourceId,
  });

  const { data: hierarchy } = useQuery({
    queryKey: ["storageResourceHierarchy", resourceId, gatewayId],
    queryFn: () => storageResourcesApi.getHierarchy(resourceId, gatewayId),
    enabled: !!gatewayId && !!resourceId,
  });

  const isInherited = hierarchy?.level && hierarchy.level !== "NONE";
  const canOverride = hierarchy?.canOverride || false;
  const canEdit = !isInherited || canOverride;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await storageResourcesApi.delete(resourceId);
      toast({
        title: "Storage resource deleted",
        description: "The storage resource has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["storageResources"] });
      router.push(`/${gatewayId}/storage`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete storage resource",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${gatewayId}/storage`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Storage Resource</h1>
            <p className="text-muted-foreground">Resource not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${gatewayId}/storage`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{resource.hostName}</h1>
              {isInherited && (
                <Badge variant="outline">
                  Inherited from {hierarchy?.level}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {resource.storageResourceDescription || "Storage resource details"}
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Resource Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <Badge variant="outline">SFTP</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {/* Row 1: URL, Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">URL</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm truncate" title={`sftp://${resource.hostName}:22`}>
                    sftp://{resource.hostName}:22
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(resource.storageResourceId);
                      toast({ title: "Copied", description: "Resource ID copied to clipboard." });
                    }}
                    title="Copy resource ID"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                <Badge variant={resource.enabled ? "default" : "secondary"}>
                  {resource.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
            {/* Description (if present) */}
            {resource.storageResourceDescription && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{resource.storageResourceDescription}</p>
              </div>
            )}
            {/* Row 2: Created, Last Updated */}
            <div className="grid grid-cols-2 gap-4">
              {resource.creationTime && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Created</p>
                  <p className="text-sm">{new Date(resource.creationTime).toLocaleString()}</p>
                </div>
              )}
              {resource.updateTime && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm">{new Date(resource.updateTime).toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <StorageTestConnectionCard hostName={resource.hostName} port={22} />
      </div>

      {/* Credentials & Effective Permissions */}
      <CredentialsAndPermissionsTable
        resourceType={PreferenceResourceType.STORAGE}
        resourceId={resourceId}
      />

      {/* Edit Modal */}
      <StorageResourceModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        resource={resource}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Storage Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{resource.hostName}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
