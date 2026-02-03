"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, applicationsApi, preferencesApi, clusterInfoApi } from "@/lib/api";
import { useCredentials } from "@/hooks/useCredentials";
import { useGateway } from "@/contexts/GatewayContext";
import { ClusterInfoPanel } from "@/components/cluster/ClusterInfoPanel";
import type { ComputeResourceDescription } from "@/types";
import type { ClusterInfo, PartitionInfo } from "@/lib/api/clusterInfo";

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ConfigureRuntimeStep({ data, onUpdate, onNext, onBack }: Props) {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || "";
  const userId = "";
  const queryClient = useQueryClient();
  const { data: credentials } = useCredentials();
  const sshCredentials = credentials?.filter((c) => c.type === "SSH") || [];
  const [clusterInfoCredentialToken, setClusterInfoCredentialToken] = useState<string>("");

  const credentialTokenForClusterInfo = clusterInfoCredentialToken || (sshCredentials.length === 1 ? sshCredentials[0].token : "");

  // Fetch compute resources
  const { data: computeResourcesMap } = useQuery({
    queryKey: ["compute-resources"],
    queryFn: () => apiClient.get<Record<string, string>>("/api/v1/compute-resources"),
  });

  // Get application module ID from the selected application
  const appModuleId = data.application?.applicationModules?.[0];
  
  // Fetch deployments for the selected application module
  const { data: deployments } = useQuery({
    queryKey: ["application-deployments", appModuleId],
    queryFn: () => appModuleId ? applicationsApi.listDeployments(appModuleId) : Promise.resolve([]),
    enabled: !!appModuleId,
  });

  // Fetch compute resource details for queue settings
  const { data: computeResource } = useQuery({
    queryKey: ["compute-resource", data.computeResourceId],
    queryFn: () =>
      apiClient.get<ComputeResourceDescription>(`/api/v1/compute-resources/${data.computeResourceId}`),
    enabled: !!data.computeResourceId,
  });

  // Fetch resolved preferences for the selected compute resource
  const { data: resolvedPreferences } = useQuery({
    queryKey: ["preferences", "resolved", "COMPUTE", data.computeResourceId, gatewayId, userId],
    queryFn: () => preferencesApi.resolveComputePreferences(
      data.computeResourceId,
      gatewayId,
      userId,
      []
    ),
    enabled: !!data.computeResourceId && !!gatewayId,
  });

  // Fetch cached cluster info when credential and compute resource are selected
  const { data: clusterInfo } = useQuery({
    queryKey: ["cluster-info", credentialTokenForClusterInfo, data.computeResourceId],
    queryFn: () => clusterInfoApi.get(credentialTokenForClusterInfo, data.computeResourceId),
    enabled: !!credentialTokenForClusterInfo && !!data.computeResourceId && !!gatewayId,
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

  const updateScheduling = (field: string, value: any) => {
    onUpdate({
      scheduling: {
        ...data.scheduling,
        [field]: value,
      },
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
    if (!data.scheduling?.queueName) {
      alert("Please select a queue");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-4">
      {/* Compute Resource Selection */}
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

      {/* Show resolved preferences when a resource is selected */}
      {data.computeResourceId && resolvedPreferences && Object.keys(resolvedPreferences).length > 0 && (
        <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
          <Label className="md:text-right pt-2">Resource Configuration</Label>
          <div className="p-3 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-2">
              Preferences applied from gateway, group, and user settings:
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(resolvedPreferences).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="font-mono text-xs">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Application Deployment */}
      {data.computeResourceId && filteredDeployments && filteredDeployments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
          <Label className="md:text-right">Deployment <span className="text-destructive">*</span></Label>
          <div>
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
            <p className="text-sm text-muted-foreground mt-1">
              Select the deployment configuration for this application on the selected compute resource
            </p>
          </div>
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

      {/* Queue Settings */}
      {data.computeResourceId && (
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold mb-2">Queue Settings</h3>

          {/* Cluster info: optional credential and fetch */}
          {sshCredentials.length > 0 && computeResource?.hostName && (
            <div className="space-y-2">
              {sshCredentials.length > 1 && (
                <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
                  <Label className="md:text-right">Credential for cluster info</Label>
                  <Select
                    value={credentialTokenForClusterInfo}
                    onValueChange={setClusterInfoCredentialToken}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credential to fetch partitions" />
                    </SelectTrigger>
                    <SelectContent>
                      {sshCredentials.map((c) => (
                        <SelectItem key={c.token} value={c.token}>
                          {c.name || c.description || c.token.substring(0, 12)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <ClusterInfoPanel
                credentialToken={credentialTokenForClusterInfo}
                computeResourceId={data.computeResourceId}
                hostname={computeResource.hostName}
                port={22}
                compact
                onClusterInfoFetched={() => {
                  queryClient.invalidateQueries({ queryKey: ["cluster-info", credentialTokenForClusterInfo, data.computeResourceId] });
                }}
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
            <Label className="md:text-right">Queue / Partition <span className="text-destructive">*</span></Label>
            <Select
              value={data.scheduling?.queueName || ""}
              onValueChange={(value) => updateScheduling("queueName", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a queue or partition" />
              </SelectTrigger>
              <SelectContent>
                {clusterInfo?.partitions && clusterInfo.partitions.length > 0
                  ? clusterInfo.partitions.map((p: PartitionInfo) => (
                      <SelectItem key={p.partitionName} value={p.partitionName}>
                        {p.partitionName} ({p.nodeCount} nodes, {p.maxCpusPerNode} CPUs/node
                        {p.maxGpusPerNode > 0 ? `, ${p.maxGpusPerNode} GPUs/node` : ""})
                      </SelectItem>
                    ))
                  : computeResource?.batchQueues?.map((queue) => (
                      <SelectItem key={queue.queueName} value={queue.queueName}>
                        {queue.queueName} ({queue.maxNodes || "N/A"} max nodes)
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
            <Label className="md:text-right">Node Count</Label>
            <Input
              type="number"
              min="1"
              value={data.scheduling?.nodeCount || 1}
              onChange={(e) => updateScheduling("nodeCount", parseInt(e.target.value))}
              placeholder="Number of nodes"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
            <Label className="md:text-right">Total CPU Count</Label>
            <Input
              type="number"
              min="1"
              value={data.scheduling?.totalCPUCount || 1}
              onChange={(e) => updateScheduling("totalCPUCount", parseInt(e.target.value))}
              placeholder="Total CPUs"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
            <Label className="md:text-right">Wall Time Limit (minutes)</Label>
            <Input
              type="number"
              min="1"
              value={data.scheduling?.wallTimeLimit || 30}
              onChange={(e) => updateScheduling("wallTimeLimit", parseInt(e.target.value))}
              placeholder="Wall time in minutes"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
            <Label className="md:text-right">Total Physical Memory (MB)</Label>
            <Input
              type="number"
              min="0"
              value={data.scheduling?.totalPhysicalMemory || 0}
              onChange={(e) => updateScheduling("totalPhysicalMemory", parseInt(e.target.value))}
              placeholder="Memory in MB"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
            <Label className="md:text-right">Allocation Project Number</Label>
            <Input
              value={data.scheduling?.overrideAllocationProjectNumber || ""}
              onChange={(e) => updateScheduling("overrideAllocationProjectNumber", e.target.value)}
              placeholder="Project allocation number (optional)"
            />
          </div>
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
