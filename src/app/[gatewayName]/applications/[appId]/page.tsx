"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pencil, Trash2, AppWindow, Server, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi, apiClient, computeResourcesApi } from "@/lib/api";
import { ApplicationInterfaceForm } from "@/components/applications/ApplicationInterfaceForm";
import { useCreateExperimentModal } from "@/contexts/CreateExperimentModalContext";
import { useUserRole } from "@/contexts/AdvancedFeaturesContext";
import { useGateway } from "@/contexts/GatewayContext";
import { usePortalConfig } from "@/contexts/PortalConfigContext";
import { toast } from "@/hooks/useToast";
import { useGatewayRouteGuard, getGatewayIdFromName } from "@/lib/route-guards";
import type { ApplicationInterfaceDescription, ApplicationModule, InputDataObjectType, OutputDataObjectType } from "@/types";
import { DataType } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gatewayName = params.gatewayName as string;
  const appId = params.appId as string;
  const { effectiveGatewayId, accessibleGateways, getGatewayName } = useGateway();
  const { defaultGatewayId } = usePortalConfig();
  const { selectedRole } = useUserRole();
  const { openModal } = useCreateExperimentModal();
  
  // Guard ensures user has access to this gateway
  useGatewayRouteGuard(gatewayName);
  
  // Get gateway ID from route
  const gatewayId = effectiveGatewayId || getGatewayIdFromName(gatewayName, accessibleGateways) || defaultGatewayId;
  const isAdmin = selectedRole === "gateway-admin" || selectedRole === "system-admin";

  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Field editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingInputIndex, setEditingInputIndex] = useState<number | null>(null);
  const [editingOutputIndex, setEditingOutputIndex] = useState<number | null>(null);
  const [fieldValues, setFieldValues] = useState({
    applicationName: "",
    applicationDescription: "",
  });
  const [editingInput, setEditingInput] = useState<Partial<InputDataObjectType>>({
    name: "",
    type: DataType.STRING,
    isRequired: false,
    userFriendlyDescription: "",
  });
  const [editingOutput, setEditingOutput] = useState<Partial<OutputDataObjectType>>({
    name: "",
    type: DataType.STRING,
    metaData: "",
  });
  const [newInput, setNewInput] = useState<Partial<InputDataObjectType>>({
    name: "",
    type: DataType.STRING,
    isRequired: false,
    userFriendlyDescription: "",
  });

  // Fetch the application interface
  const { 
    data: appInterface, 
    isLoading: isLoadingInterface, 
    error: interfaceError,
  } = useQuery({
    queryKey: ["application-interface", appId],
    queryFn: async () => {
      const result = await apiClient.get<ApplicationInterfaceDescription>(`/api/v1/application-interfaces/${appId}`);
      return result;
    },
    enabled: !!appId,
    retry: 2,
    staleTime: 30000,
  });

  // Update field values when appInterface loads
  useEffect(() => {
    if (appInterface) {
      setFieldValues({
        applicationName: appInterface.applicationName,
        applicationDescription: appInterface.applicationDescription || "",
      });
    }
  }, [appInterface]);

  // Extract module ID from the interface
  const appModuleId = appInterface?.applicationModules?.[0];

  // Fetch application module to get version
  const { 
    data: appModule,
  } = useQuery({
    queryKey: ["application-module", appModuleId],
    queryFn: async () => {
      if (!appModuleId) return null;
      return applicationsApi.getModule(appModuleId);
    },
    enabled: !!appModuleId,
    retry: 2,
  });

  // Fetch deployments for the module
  const { 
    data: deployments, 
    isLoading: isLoadingDeployments,
  } = useQuery({
    queryKey: ["application-deployments", appModuleId],
    queryFn: async () => {
      if (!appModuleId) return [];
      return applicationsApi.listDeployments(appModuleId);
    },
    enabled: !!appModuleId,
    retry: 2,
  });

  // Fetch compute resources to get names
  const { data: computeResourcesMap } = useQuery({
    queryKey: ["compute-resources"],
    queryFn: () => computeResourcesApi.list(),
  });

  const updateInterfaceMutation = useMutation({
    mutationFn: (interfaceData: any) =>
      apiClient.put(`/api/v1/application-interfaces/${appId}`, interfaceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-interface", appId] });
      queryClient.invalidateQueries({ queryKey: ["application-module", appModuleId] });
      toast({
        title: "Application updated",
        description: "Application configuration updated successfully.",
      });
      setEditingField(null);
      setEditingInputIndex(null);
      setEditingOutputIndex(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update interface",
        variant: "destructive",
      });
    },
  });

  const handleUpdateField = async (field: string, value: string) => {
    if (!appInterface) return;
    setIsSaving(true);
    try {
      await updateInterfaceMutation.mutateAsync({
        ...appInterface,
        [field]: value,
        applicationInterfaceId: appId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInput = async () => {
    if (!appInterface || !newInput.name) return;
    setIsSaving(true);
    try {
      const updatedInputs = [
        ...(appInterface.applicationInputs || []),
        { ...newInput, inputOrder: (appInterface.applicationInputs?.length || 0) } as InputDataObjectType,
      ];
      await updateInterfaceMutation.mutateAsync({
        ...appInterface,
        applicationInputs: updatedInputs,
        applicationInterfaceId: appId,
      });
      setNewInput({ name: "", type: DataType.STRING, isRequired: false, userFriendlyDescription: "" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveInput = async (index: number) => {
    if (!appInterface) return;
    setIsSaving(true);
    try {
      const updatedInputs = (appInterface.applicationInputs || []).filter((_, i) => i !== index);
      await updateInterfaceMutation.mutateAsync({
        ...appInterface,
        applicationInputs: updatedInputs,
        applicationInterfaceId: appId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateInput = async (index: number, updatedInput: InputDataObjectType) => {
    if (!appInterface) return;
    setIsSaving(true);
    try {
      const updatedInputs = [...(appInterface.applicationInputs || [])];
      updatedInputs[index] = updatedInput;
      await updateInterfaceMutation.mutateAsync({
        ...appInterface,
        applicationInputs: updatedInputs,
        applicationInterfaceId: appId,
      });
      setEditingInputIndex(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateOutput = async (index: number, updatedOutput: OutputDataObjectType) => {
    if (!appInterface) return;
    setIsSaving(true);
    try {
      const updatedOutputs = [...(appInterface.applicationOutputs || [])];
      updatedOutputs[index] = updatedOutput;
      await updateInterfaceMutation.mutateAsync({
        ...appInterface,
        applicationOutputs: updatedOutputs,
        applicationInterfaceId: appId,
      });
      setEditingOutputIndex(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApplication = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/application-interfaces/${appId}`);
      toast({
        title: "Application deleted",
        description: "Application configuration deleted successfully.",
      });
      router.push(`/${gatewayName}/catalog`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete application";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCreateExperiment = () => {
    if (appInterface) {
      openModal({ application: appInterface });
    }
  };

  // Helper to get compute resource name
  const getComputeName = (computeHostId: string): string => {
    if (!computeResourcesMap) return computeHostId;
    return computeResourcesMap[computeHostId] || computeHostId;
  };

  if (isLoadingInterface) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (interfaceError || !appInterface) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${gatewayName}/catalog`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Not Found</h1>
            <p className="text-muted-foreground">The application you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${gatewayName}/catalog`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <AppWindow className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {appInterface.applicationName}
              </h1>
              {appModule?.appModuleVersion && (
                <p className="text-sm text-muted-foreground mt-1">
                  Version {appModule.appModuleVersion}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button 
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button onClick={handleCreateExperiment}>
            Create Experiment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Configuration Details */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Application configuration details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Application Name Field */}
              <div className="group relative">
                <Label className="text-sm text-muted-foreground mb-1 block">Application Name</Label>
                {editingField === "applicationName" ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={fieldValues.applicationName}
                      onChange={(e) => setFieldValues({ ...fieldValues, applicationName: e.target.value })}
                      onBlur={() => {
                        if (fieldValues.applicationName && fieldValues.applicationName !== appInterface.applicationName) {
                          handleUpdateField("applicationName", fieldValues.applicationName);
                        } else {
                          setEditingField(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (fieldValues.applicationName && fieldValues.applicationName !== appInterface.applicationName) {
                            handleUpdateField("applicationName", fieldValues.applicationName);
                          } else {
                            setEditingField(null);
                          }
                        } else if (e.key === "Escape") {
                          setFieldValues({ ...fieldValues, applicationName: appInterface.applicationName });
                          setEditingField(null);
                        }
                      }}
                      autoFocus
                      className="flex-1"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/item">
                    <p className="font-medium flex-1">{appInterface.applicationName}</p>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setFieldValues({ ...fieldValues, applicationName: appInterface.applicationName });
                          setEditingField("applicationName");
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Description Field */}
              <div className="group relative">
                <Label className="text-sm text-muted-foreground mb-1 block">Description</Label>
                {editingField === "applicationDescription" ? (
                  <div className="flex items-start gap-2">
                    <Textarea
                      value={fieldValues.applicationDescription}
                      onChange={(e) => setFieldValues({ ...fieldValues, applicationDescription: e.target.value })}
                      onBlur={() => {
                        if (fieldValues.applicationDescription !== (appInterface.applicationDescription || "")) {
                          handleUpdateField("applicationDescription", fieldValues.applicationDescription);
                        } else {
                          setEditingField(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setFieldValues({ ...fieldValues, applicationDescription: appInterface.applicationDescription || "" });
                          setEditingField(null);
                        }
                      }}
                      autoFocus
                      className="flex-1 min-h-[60px]"
                      rows={2}
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-2 group/item">
                    <p className="text-sm flex-1">{appInterface.applicationDescription || "No description"}</p>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                        onClick={() => {
                          setFieldValues({ ...fieldValues, applicationDescription: appInterface.applicationDescription || "" });
                          setEditingField("applicationDescription");
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Inputs */}
            <div className="group">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Input Fields ({appInterface.applicationInputs?.length || 0})</p>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setNewInput({ name: "", type: DataType.STRING, isRequired: false, userFriendlyDescription: "" });
                      setEditingInputIndex(-1); // Use -1 to indicate adding new input
                    }}
                    disabled={isSaving}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Add New Input Form */}
              {isAdmin && editingInputIndex === -1 && (
                <div className="border rounded-lg p-4 mb-3 bg-muted/50">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Name *</Label>
                      <Input
                        value={newInput.name || ""}
                        onChange={(e) => setNewInput({ ...newInput, name: e.target.value })}
                        className="text-sm"
                        placeholder="Input name"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={newInput.userFriendlyDescription || ""}
                        onChange={(e) => setNewInput({ ...newInput, userFriendlyDescription: e.target.value })}
                        className="text-sm"
                        placeholder="User-friendly description"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={newInput.isRequired || false}
                          onCheckedChange={(checked) => setNewInput({ ...newInput, isRequired: checked as boolean })}
                        />
                        <Label className="text-xs">Required</Label>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={newInput.type || DataType.STRING}
                          onValueChange={(value) => setNewInput({ ...newInput, type: value as DataType })}
                        >
                          <SelectTrigger className="text-sm h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(DataType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleAddInput}
                        disabled={isSaving || !newInput.name}
                      >
                        Add Input
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingInputIndex(null);
                          setNewInput({ name: "", type: DataType.STRING, isRequired: false, userFriendlyDescription: "" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {appInterface.applicationInputs && appInterface.applicationInputs.length > 0 ? (
                <div className="space-y-3">
                  {appInterface.applicationInputs.map((input, idx) => (
                    <div key={idx} className="border rounded-lg p-4 group/item relative">
                      {editingInputIndex === idx ? (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Name *</Label>
                            <Input
                              value={editingInput.name || input.name}
                              onChange={(e) => setEditingInput({ ...editingInput, name: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={editingInput.userFriendlyDescription || input.userFriendlyDescription || ""}
                              onChange={(e) => setEditingInput({ ...editingInput, userFriendlyDescription: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={editingInput.isRequired !== undefined ? editingInput.isRequired : input.isRequired || false}
                                onCheckedChange={(checked) => setEditingInput({ ...editingInput, isRequired: checked as boolean })}
                              />
                              <Label className="text-xs">Required</Label>
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={editingInput.type || input.type}
                                onValueChange={(value) => setEditingInput({ ...editingInput, type: value as DataType })}
                              >
                                <SelectTrigger className="text-sm h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(DataType).map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateInput(idx, { ...input, ...editingInput } as InputDataObjectType)}
                              disabled={isSaving || !editingInput.name}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingInputIndex(null);
                                setEditingInput({ name: "", type: DataType.STRING, isRequired: false, userFriendlyDescription: "" });
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{input.name}</p>
                            {input.userFriendlyDescription && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {input.userFriendlyDescription}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{input.type}</Badge>
                              {input.isRequired ? (
                                <Badge variant="default" className="text-xs bg-orange-500">Required</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Optional</Badge>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingInput({ ...input });
                                  setEditingInputIndex(idx);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveInput(idx)}
                                disabled={isSaving}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No inputs defined</p>
              )}
            </div>

            {/* Outputs */}
            <div>
              <p className="text-sm font-medium mb-3">Output Fields ({appInterface.applicationOutputs?.length || 0})</p>
              {appInterface.applicationOutputs && appInterface.applicationOutputs.length > 0 ? (
                <div className="space-y-3">
                  {appInterface.applicationOutputs.map((output, idx) => (
                    <div key={idx} className="border rounded-lg p-4 group/item relative">
                      {editingOutputIndex === idx ? (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Name *</Label>
                            <Input
                              value={editingOutput.name || output.name}
                              onChange={(e) => setEditingOutput({ ...editingOutput, name: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Metadata</Label>
                            <Input
                              value={editingOutput.metaData || output.metaData || ""}
                              onChange={(e) => setEditingOutput({ ...editingOutput, metaData: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={editingOutput.type || output.type}
                              onValueChange={(value) => setEditingOutput({ ...editingOutput, type: value as DataType })}
                            >
                              <SelectTrigger className="text-sm h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(DataType).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOutput(idx, { ...output, name: editingOutput.name || output.name, metaData: editingOutput.metaData || output.metaData, type: editingOutput.type || output.type } as OutputDataObjectType)}
                              disabled={isSaving || !editingOutput.name}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingOutputIndex(null);
                                setEditingOutput({ name: "", type: DataType.STRING, metaData: "" });
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{output.name}</p>
                            {output.metaData && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {output.metaData}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{output.type}</Badge>
                            </div>
                          </div>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity"
                              onClick={() => {
                                setEditingOutput({ name: output.name, metaData: output.metaData || "", type: output.type });
                                setEditingOutputIndex(idx);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No outputs defined</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deployments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Deployments</CardTitle>
            <CardDescription>Application deployment configurations</CardDescription>
          </CardHeader>
          <CardContent>
            {!appModuleId ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-lg font-medium text-foreground mb-2">No Application Module Found</p>
                <p>This application doesn&apos;t have an associated module. Deployments require an application module.</p>
              </div>
            ) : isLoadingDeployments ? (
              <Skeleton className="h-64 w-full" />
            ) : !deployments || deployments.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <p className="text-lg font-medium text-foreground mb-2">No deployments configured</p>
                <p>Create a deployment to run this application on a compute resource.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compute Resource</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Executable Path</TableHead>
                    <TableHead>Parallelism</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.map((deployment) => (
                    <TableRow key={deployment.appDeploymentId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          {getComputeName(deployment.computeHostId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {deployment.appDeploymentDescription || "-"}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{deployment.executablePath}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{deployment.parallelism || "SERIAL"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Application Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{appInterface.applicationName}&quot;? 
              This will also delete all associated deployments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteApplication} 
              className="bg-destructive text-destructive-foreground"
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
