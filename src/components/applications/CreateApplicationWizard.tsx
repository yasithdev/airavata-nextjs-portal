"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { ApplicationModule, InputDataObjectType, OutputDataObjectType } from "@/types";
import { DataType } from "@/types";

interface CreateApplicationWizardProps {
  gatewayId: string;
  onCreateModule: (moduleData: Partial<ApplicationModule>) => Promise<{ moduleId: string }>;
  onCreateInterface: (interfaceData: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function CreateApplicationWizard({
  gatewayId,
  onCreateModule,
  onCreateInterface,
  onCancel,
  isLoading: parentIsLoading,
}: CreateApplicationWizardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Combined form data - module + interface in one
  const [formData, setFormData] = useState({
    // Module fields
    appModuleName: "",
    appModuleVersion: "",
    appModuleDescription: "",
    // Interface fields (derived from module name by default)
    applicationName: "",
    applicationDescription: "",
    applicationInputs: [] as InputDataObjectType[],
    applicationOutputs: [] as OutputDataObjectType[],
  });

  // New input/output state for adding
  const [newInput, setNewInput] = useState<Partial<InputDataObjectType>>({
    name: "",
    type: DataType.STRING,
    isRequired: false,
    userFriendlyDescription: "",
  });

  const [newOutput, setNewOutput] = useState<Partial<OutputDataObjectType>>({
    name: "",
    type: DataType.STRING,
    metaData: "",
  });

  const isLoading = parentIsLoading || isSubmitting;

  // Auto-sync application name from module name if not manually edited
  const handleModuleNameChange = (value: string) => {
    setFormData({
      ...formData,
      appModuleName: value,
      // Only auto-update if it was empty or matched the old name
      applicationName: !formData.applicationName || formData.applicationName === formData.appModuleName 
        ? value 
        : formData.applicationName,
    });
  };

  const addInput = () => {
    if (!newInput.name) return;
    setFormData({
      ...formData,
      applicationInputs: [
        ...formData.applicationInputs,
        { ...newInput, inputOrder: formData.applicationInputs.length } as InputDataObjectType,
      ],
    });
    setNewInput({ name: "", type: DataType.STRING, isRequired: false, userFriendlyDescription: "" });
  };

  const removeInput = (index: number) => {
    setFormData({
      ...formData,
      applicationInputs: formData.applicationInputs.filter((_, i) => i !== index),
    });
  };

  const addOutput = () => {
    if (!newOutput.name) return;
    setFormData({
      ...formData,
      applicationOutputs: [...formData.applicationOutputs, newOutput as OutputDataObjectType],
    });
    setNewOutput({ name: "", type: DataType.STRING, metaData: "" });
  };

  const removeOutput = (index: number) => {
    setFormData({
      ...formData,
      applicationOutputs: formData.applicationOutputs.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    if (!formData.appModuleName || !formData.appModuleVersion) {
      setError("Module name and version are required");
      return;
    }
    if (!formData.applicationName) {
      setError("Application name is required");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Step 1: Create the module
      const moduleResult = await onCreateModule({
        appModuleName: formData.appModuleName,
        appModuleVersion: formData.appModuleVersion,
        appModuleDescription: formData.appModuleDescription,
      });

      // Step 2: Create the interface with the module ID
      await onCreateInterface({
        applicationName: formData.applicationName,
        applicationDescription: formData.applicationDescription,
        applicationModules: [moduleResult.moduleId],
        applicationInputs: formData.applicationInputs,
        applicationOutputs: formData.applicationOutputs,
      });

      // Success - the parent will handle navigation/closing
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      {/* Module & Interface Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>
            Define the application name, version, and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="module-name">Name *</Label>
              <Input
                id="module-name"
                value={formData.appModuleName}
                onChange={(e) => handleModuleNameChange(e.target.value)}
                placeholder="e.g., Gaussian, OpenFOAM, GROMACS"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                value={formData.appModuleVersion}
                onChange={(e) => setFormData({ ...formData, appModuleVersion: e.target.value })}
                placeholder="e.g., 16.C.01, 2.0.0"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.appModuleDescription}
              onChange={(e) => setFormData({ ...formData, appModuleDescription: e.target.value, applicationDescription: e.target.value })}
              placeholder="Describe the application and its purpose"
              rows={3}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Input Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Input Fields</CardTitle>
          <CardDescription>Define the inputs required by the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 p-4 border rounded-lg bg-muted/30">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={newInput.name}
                  onChange={(e) => setNewInput({ ...newInput, name: e.target.value })}
                  placeholder="Input name"
                  className="h-9"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select
                  value={newInput.type}
                  onValueChange={(value) => setNewInput({ ...newInput, type: value as DataType })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DataType.STRING}>String</SelectItem>
                    <SelectItem value={DataType.INTEGER}>Integer</SelectItem>
                    <SelectItem value={DataType.FLOAT}>Float</SelectItem>
                    <SelectItem value={DataType.URI}>File/URI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  value={newInput.userFriendlyDescription || ""}
                  onChange={(e) => setNewInput({ ...newInput, userFriendlyDescription: e.target.value })}
                  placeholder="Description"
                  className="h-9"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="required"
                    checked={newInput.isRequired}
                    onCheckedChange={(checked) => setNewInput({ ...newInput, isRequired: checked as boolean })}
                    disabled={isLoading}
                  />
                  <Label htmlFor="required" className="text-xs">Required</Label>
                </div>
                <Button type="button" size="sm" onClick={addInput} disabled={!newInput.name || isLoading}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {formData.applicationInputs.length > 0 ? (
            <div className="space-y-2">
              {formData.applicationInputs.map((input, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                    <span className="font-medium">{input.name}</span>
                    <span className="text-muted-foreground">{input.type}</span>
                    <span className="text-muted-foreground truncate">{input.userFriendlyDescription || "-"}</span>
                    <span className={input.isRequired ? "text-orange-600" : "text-muted-foreground"}>
                      {input.isRequired ? "Required" : "Optional"}
                    </span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeInput(idx)} disabled={isLoading}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No inputs defined yet. Add inputs above.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Output Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Output Fields</CardTitle>
          <CardDescription>Define the outputs produced by the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 p-4 border rounded-lg bg-muted/30">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={newOutput.name}
                  onChange={(e) => setNewOutput({ ...newOutput, name: e.target.value })}
                  placeholder="Output name"
                  className="h-9"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select
                  value={newOutput.type}
                  onValueChange={(value) => setNewOutput({ ...newOutput, type: value as DataType })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DataType.STRING}>String</SelectItem>
                    <SelectItem value={DataType.URI}>File/URI</SelectItem>
                    <SelectItem value={DataType.STDOUT}>Stdout</SelectItem>
                    <SelectItem value={DataType.STDERR}>Stderr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  value={newOutput.metaData || ""}
                  onChange={(e) => setNewOutput({ ...newOutput, metaData: e.target.value })}
                  placeholder="Description"
                  className="h-9"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-end">
                <Button type="button" size="sm" onClick={addOutput} disabled={!newOutput.name || isLoading}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {formData.applicationOutputs.length > 0 ? (
            <div className="space-y-2">
              {formData.applicationOutputs.map((output, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                    <span className="font-medium">{output.name}</span>
                    <span className="text-muted-foreground">{output.type}</span>
                    <span className="text-muted-foreground truncate">{output.metaData || "-"}</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeOutput(idx)} disabled={isLoading}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No outputs defined yet. Add outputs above.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || !formData.appModuleName || !formData.appModuleVersion || !formData.applicationName}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Application"
          )}
        </Button>
      </div>
    </div>
  );
}
