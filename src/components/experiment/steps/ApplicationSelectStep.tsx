"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApplicationInterfaces, useProjects } from "@/hooks";
import type { ApplicationInterfaceDescription } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export function ApplicationSelectStep({ data, onUpdate, onNext }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: applications, isLoading } = useApplicationInterfaces();
  const { data: projects } = useProjects();

  const filteredApps = applications?.filter((app) =>
    app.applicationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectApplication = (app: ApplicationInterfaceDescription) => {
    onUpdate({
      application: app,
      experimentName: `${app.applicationName} Experiment`,
      inputs: app.applicationInputs || [],
    });
  };

  const handleNext = () => {
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
        <Label htmlFor="project">Project (Optional)</Label>
        <Select
          value={data.projectId || ""}
          onValueChange={(value) => onUpdate({ projectId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects?.map((project) => (
              <SelectItem key={project.projectID} value={project.projectID}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <div className="space-y-2">
        <Label>Select Application *</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading applications...</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredApps?.map((app) => (
            <Card
              key={app.applicationInterfaceId}
              className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                data.application?.applicationInterfaceId === app.applicationInterfaceId
                  ? "border-primary bg-accent"
                  : ""
              }`}
              onClick={() => handleSelectApplication(app)}
            >
              <h3 className="font-semibold">{app.applicationName}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {app.applicationDescription || "No description"}
              </p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}
