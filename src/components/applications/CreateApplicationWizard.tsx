"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Package, Settings, Server, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationModule, InputDataObjectType, OutputDataObjectType } from "@/types";
import { DataType } from "@/types";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "module",
    title: "Application Module",
    description: "Basic module information",
    icon: Package,
  },
  {
    id: "interface",
    title: "Interface Configuration",
    description: "Inputs and outputs",
    icon: Settings,
  },
  {
    id: "review",
    title: "Review & Create",
    description: "Confirm your settings",
    icon: Server,
  },
];

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
  isLoading,
}: CreateApplicationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [createdModuleId, setCreatedModuleId] = useState<string | null>(null);
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  
  // Module form data
  const [moduleData, setModuleData] = useState({
    appModuleName: "",
    appModuleVersion: "",
    appModuleDescription: "",
  });

  // Interface form data
  const [interfaceData, setInterfaceData] = useState({
    applicationName: "",
    applicationDescription: "",
    applicationInputs: [] as InputDataObjectType[],
    applicationOutputs: [] as OutputDataObjectType[],
  });

  // New input/output state
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

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 1: // Interface Configuration
        return !!moduleData.appModuleName && !!moduleData.appModuleVersion;
      case 2: // Review
        return !!interfaceData.applicationName;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // Create the module first
      if (!canProceedToStep(1)) {
        return;
      }
      
      setIsCreatingModule(true);
      try {
        const result = await onCreateModule(moduleData);
        setCreatedModuleId(result.moduleId);
        // Pre-fill the application name from module name
        if (!interfaceData.applicationName) {
          setInterfaceData({
            ...interfaceData,
            applicationName: moduleData.appModuleName,
          });
        }
        setCurrentStep(currentStep + 1);
      } catch (error) {
        // Error is handled by parent
      } finally {
        setIsCreatingModule(false);
      }
    } else if (currentStep < WIZARD_STEPS.length - 1) {
      if (canProceedToStep(currentStep + 1)) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (!createdModuleId) return;
    
    await onCreateInterface({
      ...interfaceData,
      applicationModules: [createdModuleId],
    });
  };

  const addInput = () => {
    if (!newInput.name) return;
    setInterfaceData({
      ...interfaceData,
      applicationInputs: [
        ...interfaceData.applicationInputs,
        { ...newInput, inputOrder: interfaceData.applicationInputs.length } as InputDataObjectType,
      ],
    });
    setNewInput({ name: "", type: DataType.STRING, isRequired: false, userFriendlyDescription: "" });
  };

  const removeInput = (index: number) => {
    setInterfaceData({
      ...interfaceData,
      applicationInputs: interfaceData.applicationInputs.filter((_, i) => i !== index),
    });
  };

  const addOutput = () => {
    if (!newOutput.name) return;
    setInterfaceData({
      ...interfaceData,
      applicationOutputs: [...interfaceData.applicationOutputs, newOutput as OutputDataObjectType],
    });
    setNewOutput({ name: "", type: DataType.STRING, metaData: "" });
  };

  const removeOutput = (index: number) => {
    setInterfaceData({
      ...interfaceData,
      applicationOutputs: interfaceData.applicationOutputs.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Step Indicators */}
      <div className="relative">
        <div className="flex justify-between">
          {WIZARD_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center relative z-10",
                  index < WIZARD_STEPS.length - 1 ? "flex-1" : ""
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                      ? "border-primary bg-background text-primary"
                      : "border-muted bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <StepIcon className="h-6 w-6" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden md:block">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted -z-0">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / (WIZARD_STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Module Configuration */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Application Module</CardTitle>
              <CardDescription>
                Define the basic information for your application module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="module-name">Module Name *</Label>
                  <Input
                    id="module-name"
                    value={moduleData.appModuleName}
                    onChange={(e) => setModuleData({ ...moduleData, appModuleName: e.target.value })}
                    placeholder="e.g., Gaussian, OpenFOAM, GROMACS"
                  />
                  <p className="text-xs text-muted-foreground">
                    A unique name for the application module
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version *</Label>
                  <Input
                    id="version"
                    value={moduleData.appModuleVersion}
                    onChange={(e) => setModuleData({ ...moduleData, appModuleVersion: e.target.value })}
                    placeholder="e.g., 16.C.01, 2.0.0"
                  />
                  <p className="text-xs text-muted-foreground">
                    The version of the application
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={moduleData.appModuleDescription}
                  onChange={(e) => setModuleData({ ...moduleData, appModuleDescription: e.target.value })}
                  placeholder="Describe the application module and its purpose"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Interface Configuration */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Application Interface</CardTitle>
                <CardDescription>
                  Configure the application interface name and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Application Name *</Label>
                  <Input
                    value={interfaceData.applicationName}
                    onChange={(e) => setInterfaceData({ ...interfaceData, applicationName: e.target.value })}
                    placeholder="e.g., Gaussian Quantum Chemistry"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={interfaceData.applicationDescription}
                    onChange={(e) => setInterfaceData({ ...interfaceData, applicationDescription: e.target.value })}
                    placeholder="Describe the application"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Input Fields</CardTitle>
                    <CardDescription>Define the inputs required by the application</CardDescription>
                  </div>
                </div>
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
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={newInput.type}
                        onValueChange={(value) => setNewInput({ ...newInput, type: value as DataType })}
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
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="required"
                          checked={newInput.isRequired}
                          onCheckedChange={(checked) => setNewInput({ ...newInput, isRequired: checked as boolean })}
                        />
                        <Label htmlFor="required" className="text-xs">Required</Label>
                      </div>
                      <Button type="button" size="sm" onClick={addInput} disabled={!newInput.name}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {interfaceData.applicationInputs.length > 0 && (
                  <div className="space-y-2">
                    {interfaceData.applicationInputs.map((input, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                          <span className="font-medium">{input.name}</span>
                          <span className="text-muted-foreground">{input.type}</span>
                          <span className="text-muted-foreground truncate">{input.userFriendlyDescription || "-"}</span>
                          <span className={input.isRequired ? "text-orange-600" : "text-muted-foreground"}>
                            {input.isRequired ? "Required" : "Optional"}
                          </span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeInput(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {interfaceData.applicationInputs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No inputs defined yet. Add inputs above.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Output Fields</CardTitle>
                    <CardDescription>Define the outputs produced by the application</CardDescription>
                  </div>
                </div>
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
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={newOutput.type}
                        onValueChange={(value) => setNewOutput({ ...newOutput, type: value as DataType })}
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
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="button" size="sm" onClick={addOutput} disabled={!newOutput.name}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {interfaceData.applicationOutputs.length > 0 && (
                  <div className="space-y-2">
                    {interfaceData.applicationOutputs.map((output, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                          <span className="font-medium">{output.name}</span>
                          <span className="text-muted-foreground">{output.type}</span>
                          <span className="text-muted-foreground truncate">{output.metaData || "-"}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeOutput(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {interfaceData.applicationOutputs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No outputs defined yet. Add outputs above.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Review Application Configuration</CardTitle>
                <CardDescription>
                  Review your application settings before creating
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Module Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{moduleData.appModuleName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Version:</span>
                        <span className="font-medium">{moduleData.appModuleVersion}</span>
                      </div>
                      {moduleData.appModuleDescription && (
                        <div>
                          <span className="text-muted-foreground">Description:</span>
                          <p className="mt-1 text-xs">{moduleData.appModuleDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Interface Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{interfaceData.applicationName}</span>
                      </div>
                      {interfaceData.applicationDescription && (
                        <div>
                          <span className="text-muted-foreground">Description:</span>
                          <p className="mt-1 text-xs">{interfaceData.applicationDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">
                      Inputs ({interfaceData.applicationInputs.length})
                    </h4>
                    {interfaceData.applicationInputs.length > 0 ? (
                      <div className="space-y-2">
                        {interfaceData.applicationInputs.map((input, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{input.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {input.type} {input.isRequired && "(required)"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No inputs defined</p>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">
                      Outputs ({interfaceData.applicationOutputs.length})
                    </h4>
                    {interfaceData.applicationOutputs.length > 0 ? (
                      <div className="space-y-2">
                        {interfaceData.applicationOutputs.map((output, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{output.name}</span>
                            <span className="text-xs text-muted-foreground">{output.type}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No outputs defined</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isLoading || isCreatingModule}>
          Cancel
        </Button>
        
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isLoading || isCreatingModule}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          
          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={
                isLoading ||
                isCreatingModule ||
                (currentStep === 0 && (!moduleData.appModuleName || !moduleData.appModuleVersion)) ||
                (currentStep === 1 && !interfaceData.applicationName)
              }
            >
              {isCreatingModule ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Module...
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Create Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
