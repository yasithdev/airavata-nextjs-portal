"use client";

import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApplicationInterfaces, useProjects, useApplicationInputs } from "@/hooks";
import { ApplicationSearchSelect } from "../ApplicationSearchSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputEditorFactory } from "../input-editors/InputEditorFactory";
import type { InputDataObjectType } from "@/types";

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export function ConfigureApplicationStep({ data, onUpdate, onNext }: Props) {
  const { data: applications, isLoading } = useApplicationInterfaces();
  const { data: projects } = useProjects();
  
  // Fetch inputs when application is selected
  const applicationId = data.application?.applicationInterfaceId || "";
  const { data: fetchedInputs, isLoading: isLoadingInputs } = useApplicationInputs(applicationId);

  // Update inputs when they're fetched or when application changes
  useEffect(() => {
    if (!data.application) {
      // Clear inputs if no application selected
      if (data.inputs && data.inputs.length > 0) {
        onUpdate({ inputs: [] });
      }
      return;
    }
    
    const currentAppId = data.application.applicationInterfaceId;
    const currentInputs = data.inputs || [];
    
    // If inputs are being fetched, wait
    if (isLoadingInputs) {
      return;
    }
    
    // Use fetched inputs if available
    if (fetchedInputs && fetchedInputs.length > 0) {
      // Check if we need to update (different app or different inputs)
      const needsUpdate = 
        currentInputs.length === 0 ||
        currentInputs.length !== fetchedInputs.length ||
        currentInputs.some((input: InputDataObjectType, idx: number) => 
          input.name !== fetchedInputs[idx]?.name
        );
      
      if (needsUpdate) {
        // Preserve existing values when updating inputs
        const inputsWithValues = fetchedInputs.map((newInput: InputDataObjectType) => {
          const existingInput = currentInputs.find((i: InputDataObjectType) => i.name === newInput.name);
          return existingInput && existingInput.value !== undefined
            ? { ...newInput, value: existingInput.value }
            : newInput;
        });
        onUpdate({ inputs: inputsWithValues });
      }
    } else {
      // Fetch completed with no inputs - try using inputs from application object
      const appInputs = data.application.applicationInputs || [];
      if (appInputs.length > 0) {
        if (currentInputs.length === 0 || 
            currentInputs.length !== appInputs.length ||
            currentInputs.some((input: InputDataObjectType, idx: number) => 
              input.name !== appInputs[idx]?.name
            )) {
          onUpdate({ inputs: appInputs });
        }
      } else if (appInputs.length === 0 && currentInputs.length > 0) {
        // Clear inputs if application has no inputs but we have old inputs
        onUpdate({ inputs: [] });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.application?.applicationInterfaceId, fetchedInputs, isLoadingInputs]);

  const handleSelectApplication = (app: any) => {
    // Clear inputs first, they will be loaded via the hook
    onUpdate({
      application: app,
      experimentName: `${app.applicationName} Experiment`,
      inputs: [], // Will be populated by useEffect when fetched
    });
  };

  const handleInputChange = (name: string, value: string | undefined) => {
    const updatedInputs = data.inputs.map((input: InputDataObjectType) =>
      input.name === name ? { ...input, value } : input
    );
    onUpdate({ inputs: updatedInputs });
  };

  const validateInputs = () => {
    // Check required inputs
    const missingRequired = data.inputs.some(
      (input: InputDataObjectType) => input.isRequired && !input.value
    );
    if (missingRequired) {
      alert("Please fill in all required inputs");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!data.projectId) {
      alert("Please select a project. Experiments must be created within a project.");
      return;
    }
    if (!data.application) {
      alert("Please select an application");
      return;
    }
    if (!data.experimentName.trim()) {
      alert("Please enter an experiment name");
      return;
    }
    if (!validateInputs()) {
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
        <Label className="md:text-right">Application <span className="text-destructive">*</span></Label>
        <div>
          <ApplicationSearchSelect
            applications={applications}
            selectedApplication={data.application}
            onSelect={handleSelectApplication}
            isLoading={isLoading}
            placeholder="Search and select an application..."
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
        <Label htmlFor="project" className="md:text-right">Project <span className="text-destructive">*</span></Label>
        <div>
          <Select
            value={data.projectId || ""}
            onValueChange={(value) => onUpdate({ projectId: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project (required)" />
            </SelectTrigger>
            <SelectContent>
              {projects && projects.length > 0 ? (
                projects.map((project) => (
                  <SelectItem key={project.projectID} value={project.projectID}>
                    {project.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  No projects available. Please create a project first.
                </div>
              )}
            </SelectContent>
          </Select>
          {(!projects || projects.length === 0) && (
            <p className="text-xs text-muted-foreground mt-1">
              You must create a project before creating experiments.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
        <Label htmlFor="experiment-name" className="md:text-right">Experiment Name <span className="text-destructive">*</span></Label>
        <Input
          id="experiment-name"
          value={data.experimentName}
          onChange={(e) => onUpdate({ experimentName: e.target.value })}
          placeholder="Enter experiment name"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
        <Label htmlFor="description" className="md:text-right">Description</Label>
        <Input
          id="description"
          value={data.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Enter experiment description (optional)"
        />
      </div>

      {/* Application Inputs */}
      {data.application && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold mb-4">Application Inputs</h3>
          {isLoadingInputs ? (
            <div className="text-center text-muted-foreground py-4">
              Loading inputs...
            </div>
          ) : data.inputs && data.inputs.length > 0 ? (
            <div className="space-y-4">
              {data.inputs.map((input: InputDataObjectType) => (
                <div key={input.name} className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
                  <Label className="md:text-right pt-2">
                    {input.userFriendlyDescription || input.name}
                    {input.isRequired && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <div>
                    {input.metaData && (
                      <p className="text-sm text-muted-foreground mb-2">{input.metaData}</p>
                    )}
                    <InputEditorFactory
                      input={input}
                      value={input.value}
                      onChange={(value) => handleInputChange(input.name, value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No inputs required for this application
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}
