"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApplicationInterfaces, useProjects } from "@/hooks";
import { ApplicationSearchSelect } from "../ApplicationSearchSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export function ApplicationSelectStep({ data, onUpdate, onNext }: Props) {
  const { data: applications, isLoading } = useApplicationInterfaces();
  const { data: projects } = useProjects();

  const handleSelectApplication = (app: any) => {
    onUpdate({
      application: app,
      experimentName: `${app.applicationName} Experiment`,
      inputs: app.applicationInputs || [],
    });
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
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Select Application *</Label>
        <ApplicationSearchSelect
          applications={applications}
          selectedApplication={data.application}
          onSelect={handleSelectApplication}
          isLoading={isLoading}
          placeholder="Search and select an application..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project">Project <span className="text-destructive">*</span></Label>
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
          <p className="text-xs text-muted-foreground">
            You must create a project before creating experiments.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="experiment-name">Experiment Name *</Label>
        <Input
          id="experiment-name"
          value={data.experimentName}
          onChange={(e) => onUpdate({ experimentName: e.target.value })}
          placeholder="Enter experiment name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={data.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Enter experiment description (optional)"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}
