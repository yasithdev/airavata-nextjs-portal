"use client";

import { useState } from "react";
import { Trash2, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useWorkflows, useUpdateWorkflow, useDeleteWorkflow } from "@/hooks/useWorkflows";
import { toast } from "@/hooks/useToast";
import type { AiravataWorkflow } from "@/types";

export default function WorkflowsPage() {
  const [viewingWorkflow, setViewingWorkflow] = useState<AiravataWorkflow | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<AiravataWorkflow | null>(null);
  const [deletingWorkflow, setDeletingWorkflow] = useState<AiravataWorkflow | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "", graph: "" });

  const { data: workflows, isLoading } = useWorkflows();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();

  const handleOpenEdit = (workflow: AiravataWorkflow) => {
    setEditFormData({
      name: workflow.name || "",
      graph: workflow.graph || "",
    });
    setEditingWorkflow(workflow);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkflow) return;
    
    try {
      await updateWorkflow.mutateAsync({
        workflowId: editingWorkflow.workflowId,
        workflow: {
          name: editFormData.name,
          graph: editFormData.graph,
        },
      });
      toast({
        title: "Workflow updated",
        description: "Workflow has been updated successfully.",
      });
      setEditingWorkflow(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update workflow",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingWorkflow) return;
    
    try {
      await deleteWorkflow.mutateAsync(deletingWorkflow.workflowId);
      toast({
        title: "Workflow deleted",
        description: "Workflow has been deleted successfully.",
      });
      setDeletingWorkflow(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete workflow",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
        <p className="text-muted-foreground">
          View and manage Airavata workflows
        </p>
      </div>

      {workflows && workflows.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Inputs</TableHead>
                <TableHead>Outputs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.workflowId}>
                  <TableCell className="font-mono text-sm">{workflow.workflowId}</TableCell>
                  <TableCell className="font-medium">{workflow.name}</TableCell>
                  <TableCell>{workflow.workflowInputs?.length || 0}</TableCell>
                  <TableCell>{workflow.workflowOutputs?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingWorkflow(workflow)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(workflow)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingWorkflow(workflow)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            {workflows === undefined
              ? "Workflow listing is not available. Workflows are typically associated with experiments."
              : "No workflows found. Workflows are created when experiments are registered."}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!viewingWorkflow} onOpenChange={(open) => !open && setViewingWorkflow(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingWorkflow?.name}</DialogTitle>
            <DialogDescription>Workflow details</DialogDescription>
          </DialogHeader>
          {viewingWorkflow && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Workflow ID</p>
                <p className="font-mono text-sm break-all">{viewingWorkflow.workflowId}</p>
              </div>
              {viewingWorkflow.graph && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Workflow Graph</p>
                  <Card>
                    <CardContent className="pt-4">
                      <pre className="text-xs overflow-auto">{viewingWorkflow.graph}</pre>
                    </CardContent>
                  </Card>
                </div>
              )}
              {viewingWorkflow.workflowInputs && viewingWorkflow.workflowInputs.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Inputs</p>
                  <div className="space-y-2">
                    {viewingWorkflow.workflowInputs.map((input, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{input.name}</span>
                            <Badge variant="secondary">{input.type}</Badge>
                          </div>
                          {input.value && (
                            <p className="text-sm text-muted-foreground mt-1">{input.value}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {viewingWorkflow.workflowOutputs && viewingWorkflow.workflowOutputs.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Outputs</p>
                  <div className="space-y-2">
                    {viewingWorkflow.workflowOutputs.map((output, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{output.name}</span>
                            <Badge variant="secondary">{output.type}</Badge>
                          </div>
                          {output.value && (
                            <p className="text-sm text-muted-foreground mt-1">{output.value}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Workflow Dialog */}
      <Dialog open={!!editingWorkflow} onOpenChange={(open) => !open && setEditingWorkflow(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workflow</DialogTitle>
            <DialogDescription>Update the workflow details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Workflow Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter workflow name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-graph">Workflow Graph</Label>
              <Textarea
                id="edit-graph"
                value={editFormData.graph}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, graph: e.target.value }))}
                placeholder="Enter workflow graph definition"
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingWorkflow(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateWorkflow.isPending}>
                {updateWorkflow.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingWorkflow} onOpenChange={(open) => !open && setDeletingWorkflow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete workflow "{deletingWorkflow?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteWorkflow.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
