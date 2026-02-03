"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Server, Clock, Copy, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
import { computeResourcesApi } from "@/lib/api/compute-resources";
import { useGateway } from "@/contexts/GatewayContext";
import { ComputeResourceModal } from "@/components/compute/ComputeResourceModal";
import { ComputeTestConnectionCard } from "@/components/compute/ComputeTestConnectionCard";
import { CredentialsAndPermissionsTable } from "@/components/resources/CredentialsAndPermissionsTable";
import { toast } from "@/hooks/useToast";
import { PreferenceResourceType, ComputeResourceType } from "@/types";

export default function ComputeResourceDetailPage() {
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
    queryKey: ["compute-resources", resourceId],
    queryFn: () => computeResourcesApi.get(resourceId),
    enabled: !!resourceId,
  });

  const { data: hierarchy } = useQuery({
    queryKey: ["computeResourceHierarchy", resourceId, gatewayId],
    queryFn: () => computeResourcesApi.getHierarchy(resourceId, gatewayId),
    enabled: !!gatewayId && !!resourceId,
  });

  const isInherited = hierarchy?.level && hierarchy.level !== "NONE";
  const canOverride = hierarchy?.canOverride || false;
  const canEdit = !isInherited || canOverride;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await computeResourcesApi.delete(resourceId);
      toast({
        title: "Compute resource deleted",
        description: "The compute resource has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["computeResources"] });
      router.push(`/${gatewayId}/compute`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete compute resource",
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
            <Link href={`/${gatewayId}/compute`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compute Resource</h1>
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
            <Link href={`/${gatewayId}/compute`}>
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
              {resource.resourceDescription || "Compute resource details"}
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

      {/* First row: Basic Information + Test Connection (equal height) */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <Badge variant="outline">{resource.resourceType ?? "PLAIN"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {/* Row 1: URL, Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">URL</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm truncate" title={`ssh://${resource.hostName}:22`}>
                    ssh://{resource.hostName}:22
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(resource.computeResourceId);
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
            {resource.resourceDescription && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{resource.resourceDescription}</p>
              </div>
            )}
            {/* Host Aliases & IP Addresses */}
            {((resource.hostAliases?.length ?? 0) > 0 || (resource.ipAddresses?.length ?? 0) > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {resource.hostAliases && resource.hostAliases.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Host Aliases</p>
                    <div className="flex flex-wrap gap-1">
                      {resource.hostAliases.map((alias, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{alias}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {resource.ipAddresses && resource.ipAddresses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">IP Addresses</p>
                    <div className="flex flex-wrap gap-1">
                      {resource.ipAddresses.map((ip, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{ip}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Row: Created, Last Updated */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Created</p>
                <p className="text-sm">{resource.creationTime ? new Date(resource.creationTime).toLocaleString() : "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm">{resource.updateTime ? new Date(resource.updateTime).toLocaleString() : "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ComputeTestConnectionCard hostName={resource.hostName} port={22} />
      </div>

      {/* Scheduling Section (SLURM only) */}
      {(resource.resourceType === ComputeResourceType.SLURM || (!resource.resourceType && (resource.batchQueues?.length ?? 0) > 0)) &&
       resource.batchQueues &&
       resource.batchQueues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Partitions Table */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Partitions</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium w-8"></th>
                      <th className="px-3 py-2 text-left font-medium">Queue</th>
                      <th className="px-3 py-2 text-left font-medium">Walltime</th>
                      <th className="px-3 py-2 text-left font-medium">Nodes</th>
                      <th className="px-3 py-2 text-left font-medium">RAM</th>
                      <th className="px-3 py-2 text-left font-medium">CPUs</th>
                      <th className="px-3 py-2 text-left font-medium">GPUs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resource.batchQueues.map((queue, index) => {
                      const partitionColors = [
                        "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
                        "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
                      ];
                      const color = partitionColors[index % partitionColors.length];
                      return (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </td>
                          <td className="px-3 py-2 font-medium">
                            {queue.queueName}
                            {queue.isDefaultQueue && (
                              <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{queue.maxRunTime ?? "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{queue.maxNodes ?? "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{queue.maxMemory ?? "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{queue.cpuPerNode ?? "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{queue.gpuPerNode ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Projects Table */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Projects</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Project</th>
                      {resource.batchQueues.map((queue, index) => {
                        const partitionColors = [
                          "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
                          "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
                        ];
                        const color = partitionColors[index % partitionColors.length];
                        return (
                          <th key={queue.queueName} className="px-2 py-2 text-center font-medium w-8">
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                              title={queue.queueName}
                            />
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {resource.projects && resource.projects.length > 0 ? (
                      resource.projects.map((project) => (
                        <tr key={project.projectName} className="border-t">
                          <td className="px-3 py-2 font-medium">{project.projectName}</td>
                          {(resource.batchQueues ?? []).map((queue) => (
                            <td key={queue.queueName} className="px-2 py-2 text-center">
                              {project.allowedQueues?.includes(queue.queueName) && (
                                <Check className="h-4 w-4 text-green-600 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={(resource.batchQueues?.length ?? 0) + 1} className="px-3 py-6 text-center text-muted-foreground">
                          No projects configured for this resource.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credentials & Effective Permissions (moved to last) */}
      <CredentialsAndPermissionsTable
        resourceType={PreferenceResourceType.COMPUTE}
        resourceId={resourceId}
      />

      {/* Edit Modal */}
      <ComputeResourceModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        resource={resource}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Compute Resource</AlertDialogTitle>
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
