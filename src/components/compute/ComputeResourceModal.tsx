"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ComputeResourceForm, type ComputeResourceFormPayload } from "./ComputeResourceForm";
import { useCreateComputeResource, useUpdateComputeResource } from "@/hooks";
import { resourceAccessApi } from "@/lib/api/resource-access";
import { toast } from "@/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";
import type { ComputeResourceDescription } from "@/types";
import { useRouter } from "next/navigation";
import { useGateway } from "@/contexts/GatewayContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: ComputeResourceDescription;
}

export function ComputeResourceModal({ open, onOpenChange, resource }: Props) {
  const router = useRouter();
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || "";
  const queryClient = useQueryClient();
  const createMutation = useCreateComputeResource();
  const updateMutation = useUpdateComputeResource();

  const isEditing = !!resource;

  const handleSubmit = async (formData: ComputeResourceFormPayload) => {
    try {
      const { credentialToken, ...resourcePayload } = formData;
      if (isEditing) {
        await updateMutation.mutateAsync({
          computeResourceId: resource.computeResourceId,
          resource: resourcePayload,
        });
        toast({
          title: "Compute resource updated",
          description: "The compute resource has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["computeResources"] });
        queryClient.invalidateQueries({ queryKey: ["compute-resources", resource.computeResourceId] });
      } else {
        const result = await createMutation.mutateAsync(resourcePayload);
        if (credentialToken && gatewayId) {
          try {
            await resourceAccessApi.grantGatewayComputeAccess(result.computeResourceId, gatewayId, credentialToken);
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
          title: "Compute resource created",
          description: "The compute resource has been added successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["computeResources"] });
        queryClient.invalidateQueries({ queryKey: ["compute-resources"] });
        router.push(`/${gatewayId}/compute/${result.computeResourceId}`);
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? "update" : "create"} compute resource`,
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
          <DialogTitle>{isEditing ? "Edit Compute Resource" : "Add Compute Resource"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the compute resource settings. Changes will be saved as override settings."
              : "Add a new compute resource or cluster"}
          </DialogDescription>
        </DialogHeader>
        <ComputeResourceForm
          resource={resource}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
