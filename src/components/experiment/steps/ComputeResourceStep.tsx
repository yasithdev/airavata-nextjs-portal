"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiClient, applicationsApi } from "@/lib/api";
import type { ComputeResourceDescription, GroupResourceProfile, ApplicationDeploymentDescription } from "@/types";

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ComputeResourceStep({ data, onUpdate, onNext, onBack }: Props) {
  const { data: computeResourcesMap } = useQuery({
    queryKey: ["compute-resources"],
    queryFn: () => apiClient.get<Record<string, string>>("/api/v1/compute-resources"),
  });

  const { data: groupProfiles } = useQuery({
    queryKey: ["group-resource-profiles"],
    queryFn: () => apiClient.get<GroupResourceProfile[]>("/api/v1/group-resource-profiles"),
  });

  // Get application module ID from the selected application
  const appModuleId = data.application?.applicationModules?.[0];
  
  // Fetch deployments for the selected application module
  const { data: deployments } = useQuery({
    queryKey: ["application-deployments", appModuleId],
    queryFn: () => appModuleId ? applicationsApi.listDeployments(appModuleId) : Promise.resolve([]),
    enabled: !!appModuleId,
  });

  // Convert compute resources map to array for rendering
  const computeResources = computeResourcesMap
    ? Object.entries(computeResourcesMap).map(([id, name]) => ({ computeResourceId: id, hostName: name }))
    : [];

  // Filter deployments by selected compute resource
  const filteredDeployments = data.computeResourceId
    ? deployments?.filter((d) => d.computeHostId === data.computeResourceId)
    : [];

  const handleSelectResource = (resourceId: string) => {
    // Clear deployment selection when resource changes
    onUpdate({
      computeResourceId: resourceId,
      applicationDeploymentId: undefined,
      scheduling: {
        ...data.scheduling,
        resourceHostId: resourceId,
      },
    });
  };

  const handleSelectDeployment = (deploymentId: string) => {
    onUpdate({
      applicationDeploymentId: deploymentId,
    });
  };

  const handleNext = () => {
    if (!data.computeResourceId) {
      alert("Please select a compute resource");
      return;
    }
    if (!data.applicationDeploymentId && filteredDeployments && filteredDeployments.length > 0) {
      alert("Please select an application deployment");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Group Resource Profile (Optional)</Label>
        <Select
          value={data.groupResourceProfileId || ""}
          onValueChange={(value) => onUpdate({ groupResourceProfileId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a group resource profile" />
          </SelectTrigger>
          <SelectContent>
            {groupProfiles?.map((profile) => (
              <SelectItem key={profile.groupResourceProfileId} value={profile.groupResourceProfileId}>
                {profile.groupResourceProfileName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Optional: Select a group resource profile to apply specific resource preferences
        </p>
      </div>

      <div className="space-y-2">
        <Label>Compute Resource *</Label>
        <div className="grid gap-3 md:grid-cols-2">
          {computeResources.map((resource) => (
            <Card
              key={resource.computeResourceId}
              className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                data.computeResourceId === resource.computeResourceId
                  ? "border-primary bg-accent"
                  : ""
              }`}
              onClick={() => handleSelectResource(resource.computeResourceId)}
            >
              <h3 className="font-semibold">{resource.hostName}</h3>
              <p className="text-sm text-muted-foreground">
                Click to select this resource
              </p>
            </Card>
          ))}
        </div>
        {computeResources.length === 0 && (
          <p className="text-sm text-muted-foreground">No compute resources available. Please configure them in Admin.</p>
        )}
      </div>

      {data.computeResourceId && filteredDeployments && filteredDeployments.length > 0 && (
        <div className="space-y-2">
          <Label>Application Deployment *</Label>
          <Select
            value={data.applicationDeploymentId || ""}
            onValueChange={handleSelectDeployment}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select deployment" />
            </SelectTrigger>
            <SelectContent>
              {filteredDeployments.map((deployment) => (
                <SelectItem key={deployment.appDeploymentId} value={deployment.appDeploymentId}>
                  {deployment.appDeploymentDescription || deployment.appDeploymentId}
                  {deployment.executablePath && ` (${deployment.executablePath})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Select the deployment configuration for this application on the selected compute resource
          </p>
        </div>
      )}

      {data.computeResourceId && (!filteredDeployments || filteredDeployments.length === 0) && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            No deployments found for this application on the selected compute resource. 
            Please create a deployment in Admin → App Management → [Your App] → Deployments.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}
