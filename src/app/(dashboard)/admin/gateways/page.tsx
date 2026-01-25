"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Building2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { gatewaysApi } from "@/lib/api";
import { GatewayForm } from "@/components/gateways/GatewayForm";
import { toast } from "@/hooks/useToast";
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
import type { Gateway } from "@/types";

export default function GatewaysPage() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingGateway, setDeletingGateway] = useState<Gateway | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    try {
      const data = await gatewaysApi.list();
      setGateways(data);
    } catch (error) {
      console.error("Failed to load gateways:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load gateways",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (gatewayData: Partial<Gateway>) => {
    setIsSaving(true);
    try {
      await gatewaysApi.create(gatewayData);
      toast({
        title: "Gateway created",
        description: "The gateway has been created successfully.",
      });
      setIsCreateOpen(false);
      loadGateways();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create gateway",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (gateway: Gateway) => {
    setEditingGateway(gateway);
    setIsEditOpen(true);
  };

  const handleUpdate = async (gatewayData: Partial<Gateway>) => {
    if (!editingGateway) return;
    setIsSaving(true);
    try {
      await gatewaysApi.update(editingGateway.gatewayId, gatewayData);
      toast({
        title: "Gateway updated",
        description: "The gateway has been updated successfully.",
      });
      setIsEditOpen(false);
      setEditingGateway(null);
      loadGateways();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update gateway",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (gateway: Gateway) => {
    setDeletingGateway(gateway);
  };

  const handleConfirmDelete = async () => {
    if (!deletingGateway) return;
    setIsDeleting(true);
    try {
      await gatewaysApi.delete(deletingGateway.gatewayId);
      toast({
        title: "Gateway deleted",
        description: "The gateway has been deleted.",
      });
      setDeletingGateway(null);
      loadGateways();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete gateway",
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
            <h1 className="text-3xl font-bold tracking-tight">Gateways</h1>
            <p className="text-muted-foreground">
              Manage science gateway configurations
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Gateway
        </Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Gateway</DialogTitle>
            <DialogDescription>
              Create a new science gateway configuration
            </DialogDescription>
          </DialogHeader>
          <GatewayForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Gateway</DialogTitle>
            <DialogDescription>
              Update gateway configuration
            </DialogDescription>
          </DialogHeader>
          {editingGateway && (
            <GatewayForm
              gateway={editingGateway}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditOpen(false);
                setEditingGateway(null);
              }}
              isLoading={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : gateways.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No gateways configured</h3>
            <p className="text-muted-foreground mt-1">
              Add your first gateway to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gateways.map((gateway) => (
            <Card 
              key={gateway.gatewayId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEdit(gateway)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Building2 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{gateway.gatewayName}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {gateway.gatewayId}
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
                    <DropdownMenuItem onClick={() => handleEdit(gateway)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDelete(gateway); }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2">
                {gateway.gatewayURL && (
                  <p className="text-sm text-muted-foreground truncate">
                    URL: {gateway.gatewayURL}
                  </p>
                )}
                {gateway.gatewayAdminEmail && (
                  <p className="text-sm text-muted-foreground truncate">
                    Admin: {gateway.gatewayAdminEmail}
                  </p>
                )}
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {gateway.gatewayApprovalStatus || "Active"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Gateway Dialog */}
      <AlertDialog open={!!deletingGateway} onOpenChange={(open) => !open && setDeletingGateway(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingGateway?.gatewayName}&quot;? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
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
