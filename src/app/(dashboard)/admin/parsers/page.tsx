"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, FileCode, MoreVertical, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parsersApi, applicationsApi } from "@/lib/api";
import { toast } from "@/hooks/useToast";
import type { ParsingTemplate, ParsingTemplateInput, ParserConnector } from "@/lib/api/parsers";

export default function ParsersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ParsingTemplate | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<ParsingTemplate | null>(null);
  const [selectedAppInterface, setSelectedAppInterface] = useState<string>("");
  const [newTemplate, setNewTemplate] = useState<Partial<ParsingTemplate>>({
    applicationInterface: "",
  });

  const { data: applications } = useQuery({
    queryKey: ["application-interfaces", gatewayId],
    queryFn: () => applicationsApi.listInterfaces(gatewayId),
    enabled: !!gatewayId,
  });

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ["parsing-templates", selectedAppInterface, gatewayId],
    queryFn: () => {
      // If "all" or empty, pass gatewayId only (no applicationInterfaceId filter)
      const appInterfaceFilter = selectedAppInterface && selectedAppInterface !== "all" 
        ? selectedAppInterface 
        : undefined;
      return parsersApi.list(appInterfaceFilter, gatewayId);
    },
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: (template: Partial<ParsingTemplate>) =>
      parsersApi.create(template, gatewayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parsing-templates"] });
      toast({
        title: "Parser created",
        description: "Parsing template has been created successfully.",
      });
      setIsCreateOpen(false);
      setNewTemplate({ applicationInterface: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create parser",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: Partial<ParsingTemplate> }) =>
      parsersApi.update(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parsing-templates"] });
      toast({
        title: "Parser updated",
        description: "Parsing template has been updated successfully.",
      });
      setEditingTemplate(null);
      setIsEditOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update parser",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (templateId: string) => parsersApi.delete(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parsing-templates"] });
      toast({
        title: "Parser deleted",
        description: "Parsing template has been deleted successfully.",
      });
      setDeletingTemplate(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete parser",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!newTemplate.applicationInterface) {
      toast({
        title: "Validation error",
        description: "Application interface is required",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newTemplate);
  };

  const handleOpenEdit = (template: ParsingTemplate) => {
    setEditingTemplate({ 
      ...template,
      initialInputs: template.initialInputs ? [...template.initialInputs] : [],
      parserConnections: template.parserConnections ? [...template.parserConnections] : [],
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingTemplate?.id) return;
    updateMutation.mutate({ templateId: editingTemplate.id, data: editingTemplate });
  };

  const handleAddInitialInput = () => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      initialInputs: [
        ...(editingTemplate.initialInputs || []),
        { name: "", value: "", type: "", applicationArgument: "" },
      ],
    });
  };

  const handleRemoveInitialInput = (index: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      initialInputs: editingTemplate.initialInputs?.filter((_, i) => i !== index) || [],
    });
  };

  const handleUpdateInitialInput = (index: number, field: keyof ParsingTemplateInput, value: string) => {
    if (!editingTemplate) return;
    const updatedInputs = [...(editingTemplate.initialInputs || [])];
    updatedInputs[index] = { ...updatedInputs[index], [field]: value };
    setEditingTemplate({
      ...editingTemplate,
      initialInputs: updatedInputs,
    });
  };

  const handleAddParserConnection = () => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      parserConnections: [
        ...(editingTemplate.parserConnections || []),
        { parserId: "", inputParserId: "", inputType: "", outputParserId: "", outputType: "" },
      ],
    });
  };

  const handleRemoveParserConnection = (index: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      parserConnections: editingTemplate.parserConnections?.filter((_, i) => i !== index) || [],
    });
  };

  const handleUpdateParserConnection = (index: number, field: keyof ParserConnector, value: string) => {
    if (!editingTemplate) return;
    const updatedConnections = [...(editingTemplate.parserConnections || [])];
    updatedConnections[index] = { ...updatedConnections[index], [field]: value };
    setEditingTemplate({
      ...editingTemplate,
      parserConnections: updatedConnections,
    });
  };

  const handleDelete = () => {
    if (!deletingTemplate?.id) return;
    deleteMutation.mutate(deletingTemplate.id);
  };

  const getApplicationName = (appInterfaceId: string) => {
    const app = applications?.find(a => a.applicationInterfaceId === appInterfaceId);
    return app?.applicationName || appInterfaceId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Parsers</h1>
          <p className="text-muted-foreground">
            Manage output data parsers for experiments
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Parser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by Application</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAppInterface} onValueChange={setSelectedAppInterface}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="All applications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All applications</SelectItem>
              {applications?.map((app) => (
                <SelectItem key={app.applicationInterfaceId} value={app.applicationInterfaceId}>
                  {app.applicationName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FileCode className="mx-auto h-12 w-12 text-destructive/50" />
              <h3 className="mt-4 text-lg font-semibold text-destructive">Failed to load parsers</h3>
              <p className="text-muted-foreground mt-2">
                {error instanceof Error ? error.message : "An error occurred"}
              </p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : templates && templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenEdit(template)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <FileCode className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {template.id?.substring(0, 8)}...
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {getApplicationName(template.applicationInterface)}
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
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(template); }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeletingTemplate(template); }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {template.initialInputs?.length || 0} inputs
                  </Badge>
                  <Badge variant="secondary">
                    {template.parserConnections?.length || 0} connections
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FileCode className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No parsing templates</h3>
              <p className="text-muted-foreground mt-2">
                {selectedAppInterface && selectedAppInterface !== "all"
                  ? "No parsers found for this application. Create a parser to get started."
                  : "No parsing templates found. Create a parser to get started."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Parser Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Parsing Template</DialogTitle>
            <DialogDescription>
              Create a new parser for processing experiment output
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Application Interface *</Label>
              <Select
                value={newTemplate.applicationInterface || ""}
                onValueChange={(value) => setNewTemplate({ ...newTemplate, applicationInterface: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {applications?.map((app) => (
                    <SelectItem key={app.applicationInterfaceId} value={app.applicationInterfaceId}>
                      {app.applicationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the application interface this parser will be used with
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={createMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Parser Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setEditingTemplate(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Parsing Template</DialogTitle>
            <DialogDescription>
              Update parser configuration
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate();
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label className="text-muted-foreground">Template ID</Label>
                <p className="font-mono text-sm bg-muted p-2 rounded">{editingTemplate.id}</p>
                <p className="text-xs text-muted-foreground">Template ID cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-application-interface">Application Interface *</Label>
                <Select
                  value={editingTemplate.applicationInterface || ""}
                  onValueChange={(value) =>
                    setEditingTemplate({ ...editingTemplate, applicationInterface: value })
                  }
                >
                  <SelectTrigger id="edit-application-interface">
                    <SelectValue placeholder="Select application" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications?.map((app) => (
                      <SelectItem key={app.applicationInterfaceId} value={app.applicationInterfaceId}>
                        {app.applicationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editingTemplate.gatewayId && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Gateway ID</Label>
                  <p className="font-medium">{editingTemplate.gatewayId}</p>
                  <p className="text-xs text-muted-foreground">Gateway ID cannot be changed</p>
                </div>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-base">Initial Inputs</CardTitle>
                    <CardDescription>Configure input files and parameters</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddInitialInput}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Input
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingTemplate.initialInputs && editingTemplate.initialInputs.length > 0 ? (
                    editingTemplate.initialInputs.map((input, idx) => (
                      <Card key={idx} className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-medium text-sm">Input {idx + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveInitialInput(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor={`input-name-${idx}`}>Name *</Label>
                            <Input
                              id={`input-name-${idx}`}
                              value={input.name || ""}
                              onChange={(e) =>
                                handleUpdateInitialInput(idx, "name", e.target.value)
                              }
                              placeholder="Input name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`input-value-${idx}`}>Value</Label>
                            <Input
                              id={`input-value-${idx}`}
                              value={input.value || ""}
                              onChange={(e) =>
                                handleUpdateInitialInput(idx, "value", e.target.value)
                              }
                              placeholder="Input value"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor={`input-type-${idx}`}>Type</Label>
                              <Input
                                id={`input-type-${idx}`}
                                value={input.type || ""}
                                onChange={(e) =>
                                  handleUpdateInitialInput(idx, "type", e.target.value)
                                }
                                placeholder="Input type"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`input-arg-${idx}`}>Application Argument</Label>
                              <Input
                                id={`input-arg-${idx}`}
                                value={input.applicationArgument || ""}
                                onChange={(e) =>
                                  handleUpdateInitialInput(idx, "applicationArgument", e.target.value)
                                }
                                placeholder="Application argument"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No initial inputs configured. Click "Add Input" to add one.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-base">Parser Connections</CardTitle>
                    <CardDescription>Configure parser input/output connections</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddParserConnection}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Connection
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingTemplate.parserConnections && editingTemplate.parserConnections.length > 0 ? (
                    editingTemplate.parserConnections.map((conn, idx) => (
                      <Card key={idx} className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-medium text-sm">Connection {idx + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveParserConnection(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor={`conn-parser-id-${idx}`}>Parser ID</Label>
                            <Input
                              id={`conn-parser-id-${idx}`}
                              value={conn.parserId || ""}
                              onChange={(e) =>
                                handleUpdateParserConnection(idx, "parserId", e.target.value)
                              }
                              placeholder="Parser ID"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor={`conn-input-parser-id-${idx}`}>Input Parser ID</Label>
                              <Input
                                id={`conn-input-parser-id-${idx}`}
                                value={conn.inputParserId || ""}
                                onChange={(e) =>
                                  handleUpdateParserConnection(idx, "inputParserId", e.target.value)
                                }
                                placeholder="Input parser ID"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`conn-input-type-${idx}`}>Input Type</Label>
                              <Input
                                id={`conn-input-type-${idx}`}
                                value={conn.inputType || ""}
                                onChange={(e) =>
                                  handleUpdateParserConnection(idx, "inputType", e.target.value)
                                }
                                placeholder="Input type"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor={`conn-output-parser-id-${idx}`}>Output Parser ID</Label>
                              <Input
                                id={`conn-output-parser-id-${idx}`}
                                value={conn.outputParserId || ""}
                                onChange={(e) =>
                                  handleUpdateParserConnection(idx, "outputParserId", e.target.value)
                                }
                                placeholder="Output parser ID"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`conn-output-type-${idx}`}>Output Type</Label>
                              <Input
                                id={`conn-output-type-${idx}`}
                                value={conn.outputType || ""}
                                onChange={(e) =>
                                  handleUpdateParserConnection(idx, "outputType", e.target.value)
                                }
                                placeholder="Output type"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No parser connections configured. Click "Add Connection" to add one.
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingTemplate(null);
                  }}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setIsEditOpen(false);
                    setDeletingTemplate(editingTemplate);
                  }}
                  disabled={updateMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Parser</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this parsing template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
