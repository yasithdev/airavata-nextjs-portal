"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeResourcesApi } from "@/lib/api";
import type { ApplicationDeploymentDescription } from "@/types";
import { ApplicationParallelismType } from "@/types";

interface Props {
  appModuleId: string;
  deployment?: ApplicationDeploymentDescription;
  onSubmit: (deployment: Partial<ApplicationDeploymentDescription>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function ApplicationDeploymentForm({ appModuleId, deployment, onSubmit, onCancel, isLoading }: Props) {
  const [formData, setFormData] = useState<Partial<ApplicationDeploymentDescription>>({
    appModuleId: deployment?.appModuleId || appModuleId,
    computeHostId: deployment?.computeHostId || "",
    executablePath: deployment?.executablePath || "",
    appDeploymentDescription: deployment?.appDeploymentDescription || "",
    parallelism: deployment?.parallelism || ApplicationParallelismType.SERIAL,
  });

  const [computeResources, setComputeResources] = useState<Record<string, string>>({});

  useEffect(() => {
    loadComputeResources();
  }, []);

  const loadComputeResources = async () => {
    try {
      const resources = await computeResourcesApi.list();
      setComputeResources(resources);
    } catch (error) {
      console.error("Failed to load compute resources:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.computeHostId || !formData.executablePath) {
      alert("Compute resource and executable path are required");
      return;
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deployment Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Compute Resource *</Label>
            <Select
              value={formData.computeHostId}
              onValueChange={(value) => setFormData({ ...formData, computeHostId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select compute resource" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(computeResources).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Executable Path *</Label>
            <Input
              value={formData.executablePath}
              onChange={(e) => setFormData({ ...formData, executablePath: e.target.value })}
              placeholder="/usr/bin/jupyter-lab"
            />
            <p className="text-xs text-muted-foreground">
              Full path to the executable on the compute resource
            </p>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.appDeploymentDescription}
              onChange={(e) => setFormData({ ...formData, appDeploymentDescription: e.target.value })}
              placeholder="Describe this deployment"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Parallelism</Label>
            <Select
              value={formData.parallelism}
              onValueChange={(value) => setFormData({ ...formData, parallelism: value as ApplicationParallelismType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SERIAL">Serial</SelectItem>
                <SelectItem value="MPI">MPI</SelectItem>
                <SelectItem value="OPENMP">OpenMP</SelectItem>
                <SelectItem value="MPI_OPENMP">MPI + OpenMP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : deployment ? "Update" : "Create Deployment"}
        </Button>
      </div>
    </form>
  );
}
