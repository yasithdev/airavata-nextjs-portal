"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StorageResourceForm, type StorageResourceFormPayload } from "./StorageResourceForm";
import { useCreateStorageResource, useUpdateStorageResource } from "@/hooks";
import { resourceAccessApi } from "@/lib/api/resource-access";
import { toast } from "@/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";
import type { StorageResourceDescription } from "@/types";
import { useGateway } from "@/contexts/GatewayContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: StorageResourceDescription;
}

export function StorageResourceModal({ open, onOpenChange, resource }: Props) {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || "";
  const queryClient = useQueryClient();
  const createMutation = useCreateStorageResource();
  const updateMutation = useUpdateStorageResource();

  const isEditing = !!resource;

  const handleSubmit = async (formData: StorageResourceFormPayload) => {
    const { credentialToken, port: _port, ...resourcePayload } = formData;
    const payload: Partial<StorageResourceDescription> = { ...resourcePayload };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          storageResourceId: resource.storageResourceId,
          resource: payload,
        });
        toast({
          title: "Storage resource updated",
          description: "The storage resource has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["storageResources", gatewayId] });
        queryClient.invalidateQueries({ queryKey: ["storage-resources", resource.storageResourceId] });
      } else {
        const result = await createMutation.mutateAsync(payload);
        if (credentialToken && gatewayId) {
          try {
            await resourceAccessApi.grantGatewayStorageAccess(result.storageResourceId, gatewayId, credentialToken);
            queryClient.invalidateQueries({ queryKey: ["accessControl"] });
          } catch (grantError) {
            toast({
              title: "Resource created, credential link failed",
              description: grantError instanceof Error ? (grantError as Error).message : "Could not link credential to resource.",
              variant: "destructive",
            });
          }
        }
        toast({
          title: "Storage resource created",
          description: "The storage resource has been added successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["storageResources", gatewayId] });
        queryClient.invalidateQueries({ queryKey: ["storage-resources"] });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? "update" : "create"} storage resource`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Storage Resource" : "Add Storage Resource"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the storage resource settings."
              : "Add a new storage resource (e.g. SFTP server)"}
          </DialogDescription>
        </DialogHeader>
        <StorageResourceForm
          resource={resource}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
