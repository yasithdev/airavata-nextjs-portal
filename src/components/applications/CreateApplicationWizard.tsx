"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApplicationModule, InputDataObjectType, OutputDataObjectType } from "@/types";
import { DataType, DEFAULT_SYSTEM_INPUT, DEFAULT_SYSTEM_OUTPUTS, isSystemInputName, isSystemOutputName } from "@/types";

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
    applicationInputs: [{ ...DEFAULT_SYSTEM_INPUT }] as InputDataObjectType[],
    applicationOutputs: DEFAULT_SYSTEM_OUTPUTS.map((o) => ({ ...o })) as OutputDataObjectType[],
  });

  // New input/output state for adding
  const [newInput, setNewInput] = useState<Partial<InputDataObjectType>>({
    name: "",
    type: DataType.STRING,
    applicationArgument: "",
    isRequired: false,
  });

  const [newOutput, setNewOutput] = useState<Partial<OutputDataObjectType>>({
    name: "",
    type: DataType.STRING,
    applicationArgument: "",
    isRequired: false,
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
    const name = (newInput.name ?? "").trim().toUpperCase();
    if (isSystemInputName(name)) return; // avoid duplicate STDIN
    setFormData({
      ...formData,
      applicationInputs: [
        ...formData.applicationInputs,
        {
          name: newInput.name ?? "",
          type: newInput.type ?? DataType.STRING,
          applicationArgument: newInput.applicationArgument ?? "",
          isRequired: newInput.isRequired ?? false,
        } as InputDataObjectType,
      ],
    });
    setNewInput({ name: "", type: DataType.STRING, applicationArgument: "", isRequired: false });
  };

  const removeInput = (index: number) => {
    const input = formData.applicationInputs[index];
    if (input && isSystemInputName(input.name)) return;
    setFormData({
      ...formData,
      applicationInputs: formData.applicationInputs.filter((_, i) => i !== index),
    });
  };

  const addOutput = () => {
    if (!newOutput.name) return;
    const name = (newOutput.name ?? "").trim().toUpperCase();
    if (isSystemOutputName(name)) return; // avoid duplicate STDOUT/STDERR
    setFormData({
      ...formData,
      applicationOutputs: [
        ...formData.applicationOutputs,
        {
          name: newOutput.name ?? "",
          type: newOutput.type ?? DataType.STRING,
          applicationArgument: newOutput.applicationArgument ?? "",
          isRequired: newOutput.isRequired ?? false,
        } as OutputDataObjectType,
      ],
    });
    setNewOutput({ name: "", type: DataType.STRING, applicationArgument: "", isRequired: false });
  };

  const removeOutput = (index: number) => {
    const output = formData.applicationOutputs[index];
    if (output && isSystemOutputName(output.name)) return;
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
      // Backend will automatically add STDIN, STDOUT, and STDERR
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

      {/* Inputs */}
        <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
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
                    <SelectItem value={DataType.STDIN}>Stdin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CLI Args</Label>
                <Input
                  value={newInput.applicationArgument || ""}
                  onChange={(e) => setNewInput({ ...newInput, applicationArgument: e.target.value })}
                  placeholder="e.g. --input"
                  className="h-9 font-mono text-sm"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant={newInput.isRequired ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 min-w-[5.5rem] text-xs",
                    newInput.isRequired ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background border border-input hover:bg-muted/50"
                  )}
                  onClick={() => setNewInput({ ...newInput, isRequired: !newInput.isRequired })}
                  disabled={isLoading}
                >
                  {newInput.isRequired ? "Required" : "Optional"}
                </Button>
                <Button type="button" size="sm" onClick={addInput} disabled={!newInput.name || isLoading}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {formData.applicationInputs.length > 0 ? (
            <div className="space-y-2">
              {formData.applicationInputs.map((input, idx) => {
                const isSystem = isSystemInputName(input.name);
                return (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-4 gap-4 text-sm items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{input.name}</span>
                        {isSystem && <Badge variant="secondary" className="text-xs">System</Badge>}
                      </div>
                      <span className="text-muted-foreground">{input.type}</span>
                      <span className="text-muted-foreground font-mono truncate">{input.applicationArgument || "—"}</span>
                      <Button
                        type="button"
                        variant={input.isRequired ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 min-w-[5.5rem] text-xs pointer-events-none",
                          input.isRequired ? "bg-primary text-primary-foreground" : "bg-background border border-input"
                        )}
                        disabled
                      >
                        {input.isRequired ? "Required" : "Optional"}
                      </Button>
                    </div>
                    {!isSystem && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeInput(idx)} disabled={isLoading}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No inputs defined yet. Add inputs above.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Outputs */}
        <Card>
        <CardHeader>
          <CardTitle>Outputs</CardTitle>
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
                <Label className="text-xs">CLI Args</Label>
                <Input
                  value={newOutput.applicationArgument || ""}
                  onChange={(e) => setNewOutput({ ...newOutput, applicationArgument: e.target.value })}
                  placeholder="e.g. --output"
                  className="h-9 font-mono text-sm"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant={newOutput.isRequired ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 min-w-[5.5rem] text-xs",
                    newOutput.isRequired ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background border border-input hover:bg-muted/50"
                  )}
                  onClick={() => setNewOutput({ ...newOutput, isRequired: !newOutput.isRequired })}
                  disabled={isLoading}
                >
                  {newOutput.isRequired ? "Required" : "Optional"}
                </Button>
                <Button type="button" size="sm" onClick={addOutput} disabled={!newOutput.name || isLoading}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {formData.applicationOutputs.length > 0 ? (
            <div className="space-y-2">
              {formData.applicationOutputs.map((output, idx) => {
                const isSystem = isSystemOutputName(output.name);
                return (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-4 gap-4 text-sm items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{output.name}</span>
                        {isSystem && <Badge variant="secondary" className="text-xs">System</Badge>}
                      </div>
                      <span className="text-muted-foreground">{output.type}</span>
                      <span className="text-muted-foreground font-mono truncate">{output.applicationArgument || "—"}</span>
                      <Button
                        type="button"
                        variant={output.isRequired ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 min-w-[5.5rem] text-xs pointer-events-none",
                          output.isRequired ? "bg-primary text-primary-foreground" : "bg-background border border-input"
                        )}
                        disabled
                      >
                        {output.isRequired ? "Required" : "Optional"}
                      </Button>
                    </div>
                    {!isSystem && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeOutput(idx)} 
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No outputs defined yet. Add outputs above. STDIN, STDOUT, and STDERR are always present.
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
