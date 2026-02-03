"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, RefreshCw, Check, X, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectivityTest, type TestResult } from "@/components/resources/ConnectivityTest";
import { CheckCircle2, XCircle } from "lucide-react";
import { CredentialPicker } from "@/components/resources/CredentialPicker";
import { clusterInfoApi, partitionsToBatchQueues } from "@/lib/api/clusterInfo";
import { useGateway } from "@/contexts/GatewayContext";
import type { ComputeResourceDescription, BatchQueue, DataMovementProtocol, ComputeResourceProject } from "@/types";
import { ComputeResourceType } from "@/types";

const STORAGE_PROTOCOLS: DataMovementProtocol[] = ["SFTP", "SCP", "GridFTP"];

export type ComputeResourceFormPayload = Partial<ComputeResourceDescription> & { credentialToken?: string };

interface Props {
  resource?: ComputeResourceDescription;
  onSubmit: (resource: ComputeResourceFormPayload) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function ComputeResourceForm({ resource, onSubmit, onCancel, isLoading }: Props) {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || "";

  const [formData, setFormData] = useState<ComputeResourceFormPayload>({
    hostName: resource?.hostName || "",
    resourceDescription: resource?.resourceDescription || "",
    resourceType: resource?.resourceType ?? ComputeResourceType.SLURM,
    batchQueues: resource?.batchQueues || [],
    credentialToken: "",
    storageProtocol: resource?.storageProtocol ?? "SFTP",
    linkedStorageResourceId: resource?.linkedStorageResourceId,
    projects: resource?.projects || [],
  });

  const [autoFillStatus, setAutoFillStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [autoFillError, setAutoFillError] = useState<string>("");
  const [autoFillLoginUsername, setAutoFillLoginUsername] = useState<string>("");
  const [connectionTestResult, setConnectionTestResult] = useState<TestResult | null>(null);

  // Track which queue indices are in edit mode (-1 means new row being added)
  const [editingIndices, setEditingIndices] = useState<Set<number>>(new Set());
  const [editingQueue, setEditingQueue] = useState<Partial<BatchQueue> | null>(null);
  const [newRowActive, setNewRowActive] = useState(false);
  const [newQueue, setNewQueue] = useState<Partial<BatchQueue>>({
    queueName: "",
    maxRunTime: 60,
    maxNodes: 10,
    maxMemory: 64,
    cpuPerNode: 16,
    gpuPerNode: 0,
  });

  const defaultQueueValues: Partial<BatchQueue> = {
    queueName: "",
    maxRunTime: 60,
    maxNodes: 10,
    maxMemory: 64,
    cpuPerNode: 16,
    gpuPerNode: 0,
  };

  // Partition colors for visual identification
  const partitionColors = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#14b8a6", // teal
    "#6366f1", // indigo
  ];

  // Projects (SLURM accounts) and their queue access - local UI state
  interface ProjectAccess {
    name: string;
    queueAccess: Record<string, boolean>; // queueName -> hasAccess
  }
  
  // Convert API format to local format
  const apiProjectsToLocal = (apiProjects: ComputeResourceProject[] | undefined): ProjectAccess[] => {
    if (!apiProjects) return [];
    return apiProjects.map((p) => {
      const queueAccess: Record<string, boolean> = {};
      (formData.batchQueues ?? []).forEach((q) => {
        queueAccess[q.queueName] = p.allowedQueues?.includes(q.queueName) ?? false;
      });
      return { name: p.projectName, queueAccess };
    });
  };
  
  // Convert local format to API format
  const localProjectsToApi = (localProjects: ProjectAccess[]): ComputeResourceProject[] => {
    return localProjects.map((p) => ({
      projectName: p.name,
      allowedQueues: Object.entries(p.queueAccess)
        .filter(([, hasAccess]) => hasAccess)
        .map(([queueName]) => queueName),
    }));
  };
  
  const [projects, setProjects] = useState<ProjectAccess[]>(() => apiProjectsToLocal(resource?.projects));
  const [newProjectName, setNewProjectName] = useState("");
  const [addingProject, setAddingProject] = useState(false);

  const getPartitionColor = (index: number) => partitionColors[index % partitionColors.length];

  const toggleQueueAccess = (projectIndex: number, queueName: string) => {
    setProjects((prev) => {
      const updated = prev.map((p, i) =>
        i === projectIndex
          ? { ...p, queueAccess: { ...p.queueAccess, [queueName]: !p.queueAccess[queueName] } }
          : p
      );
      // Sync to formData
      setFormData((fd) => ({ ...fd, projects: localProjectsToApi(updated) }));
      return updated;
    });
  };

  const addProject = () => {
    if (newProjectName.trim()) {
      const queueAccess: Record<string, boolean> = {};
      (formData.batchQueues ?? []).forEach((q) => {
        queueAccess[q.queueName] = false;
      });
      setProjects((prev) => {
        const updated = [...prev, { name: newProjectName.trim(), queueAccess }];
        // Sync to formData
        setFormData((fd) => ({ ...fd, projects: localProjectsToApi(updated) }));
        return updated;
      });
      setNewProjectName("");
      setAddingProject(false);
    }
  };

  const removeProject = (index: number) => {
    setProjects((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Sync to formData
      setFormData((fd) => ({ ...fd, projects: localProjectsToApi(updated) }));
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hostName) {
      alert("Host name is required");
      return;
    }
    const resourceType = formData.resourceType ?? ComputeResourceType.SLURM;
    if (resourceType === ComputeResourceType.SLURM) {
      const queues = formData.batchQueues ?? [];
      if (queues.length === 0) {
        alert("SLURM resources require at least one batch queue");
        return;
      }
    }
    const payload = { ...formData };
    if (resourceType !== ComputeResourceType.SLURM) {
      payload.batchQueues = [];
    }
    await onSubmit(payload);
  };

  const setResourceType = (value: ComputeResourceType) => {
    const next = { ...formData, resourceType: value };
    if (value !== ComputeResourceType.SLURM) {
      next.batchQueues = [];
    }
    setFormData(next);
  };

  const startAddingQueue = () => {
    setNewRowActive(true);
    setNewQueue({ ...defaultQueueValues });
  };

  const confirmNewQueue = () => {
    if (!newQueue.queueName) {
      alert("Queue name is required");
      return;
    }
    setFormData({
      ...formData,
      batchQueues: [...(formData.batchQueues || []), newQueue as BatchQueue],
    });
    setNewQueue({ ...defaultQueueValues });
    setNewRowActive(false);
  };

  const cancelNewQueue = () => {
    setNewRowActive(false);
    setNewQueue({ ...defaultQueueValues });
  };

  const startEditingQueue = (index: number) => {
    const queue = formData.batchQueues?.[index];
    if (queue) {
      setEditingIndices((prev) => new Set(prev).add(index));
      setEditingQueue({ ...queue });
    }
  };

  const confirmEditQueue = (index: number) => {
    if (!editingQueue?.queueName) {
      alert("Queue name is required");
      return;
    }
    const updatedQueues = [...(formData.batchQueues || [])];
    updatedQueues[index] = editingQueue as BatchQueue;
    setFormData({ ...formData, batchQueues: updatedQueues });
    setEditingIndices((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    setEditingQueue(null);
  };

  const cancelEditQueue = (index: number) => {
    setEditingIndices((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    setEditingQueue(null);
  };

  const removeQueue = (index: number) => {
    setFormData({
      ...formData,
      batchQueues: formData.batchQueues?.filter((_, i) => i !== index),
    });
    setEditingIndices((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const canAutoFill =
    (formData.resourceType ?? ComputeResourceType.SLURM) === ComputeResourceType.SLURM &&
    !!formData.credentialToken &&
    !!formData.hostName?.trim() &&
    !!gatewayId;

  const handleAutoFillFromCluster = async () => {
    if (!canAutoFill) return;
    setAutoFillStatus("loading");
    setAutoFillError("");
    try {
      const computeResourceId = resource?.computeResourceId ?? "form-draft";
      const info = await clusterInfoApi.fetch({
        credentialToken: formData.credentialToken!,
        computeResourceId,
        hostname: formData.hostName!.trim(),
        port: 22,
        gatewayId,
        loginUsername: autoFillLoginUsername.trim() || undefined,
      });
      const queues = partitionsToBatchQueues(info.partitions ?? []);
      if (queues.length === 0) {
        setAutoFillError("No partitions returned from cluster (slurminfo.sh).");
        setAutoFillStatus("error");
        return;
      }
      setFormData((prev) => ({ ...prev, batchQueues: queues }));
      setAutoFillStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch cluster info";
      setAutoFillError(message);
      setAutoFillStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Resource Type</Label>
            <Select
              value={formData.resourceType ?? ComputeResourceType.SLURM}
              onValueChange={(v) => setResourceType(v as ComputeResourceType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ComputeResourceType.SLURM}>SLURM (HPC)</SelectItem>
                <SelectItem value={ComputeResourceType.AWS}>AWS (Cloud)</SelectItem>
                <SelectItem value={ComputeResourceType.PLAIN}>Plain (Local)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostname">Host Name *</Label>
            <Input
              id="hostname"
              value={formData.hostName}
              onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
              placeholder="e.g., localhost (test) or stampede2.tacc.utexas.edu"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.resourceDescription}
              onChange={(e) => setFormData({ ...formData, resourceDescription: e.target.value })}
              placeholder="Describe this compute resource"
              rows={3}
            />
          </div>

          <CredentialPicker
            label="Default Credential"
            value={formData.credentialToken ?? ""}
            onChange={(token) => {
              setFormData({ ...formData, credentialToken: token });
              setConnectionTestResult(null);
            }}
            filter="SSH"
            placeholder="Select credential"
            inlineAction={
              formData.hostName && (formData.resourceType === ComputeResourceType.SLURM || formData.resourceType === ComputeResourceType.PLAIN) ? (
                <ConnectivityTest
                  host={formData.hostName}
                  port={formData.resourceType === ComputeResourceType.SLURM ? 6817 : 22}
                  type={formData.resourceType === ComputeResourceType.SLURM ? "slurm" : "ssh"}
                  inline
                  onResultChange={setConnectionTestResult}
                />
              ) : undefined
            }
            helperText={
              formData.hostName ? (
                <span className="flex items-center gap-2">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    {formData.hostName}:{formData.resourceType === ComputeResourceType.SLURM ? 6817 : 22}
                  </code>
                  {connectionTestResult && (
                    <span className={`flex items-center gap-1 ${connectionTestResult.success ? "text-green-600" : "text-destructive"}`}>
                      {connectionTestResult.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      <span className="text-xs">{connectionTestResult.success ? "Connected" : connectionTestResult.message}</span>
                    </span>
                  )}
                </span>
              ) : undefined
            }
          />

          <div className="space-y-2">
            <Label>Storage Protocol</Label>
            <Select
              value={formData.storageProtocol ?? "SFTP"}
              onValueChange={(v) => setFormData({ ...formData, storageProtocol: v as DataMovementProtocol })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select protocol" />
              </SelectTrigger>
              <SelectContent>
                {STORAGE_PROTOCOLS.map((protocol) => (
                  <SelectItem key={protocol} value={protocol}>
                    {protocol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              A linked storage resource will be created with this protocol for file transfers.
            </p>
          </div>

          {formData.linkedStorageResourceId && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">Linked Storage</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Storage resource ID: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{formData.linkedStorageResourceId}</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {(formData.resourceType ?? ComputeResourceType.SLURM) === ComputeResourceType.SLURM && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Scheduling</CardTitle>
              {canAutoFill && (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    placeholder="Login username"
                    value={autoFillLoginUsername}
                    onChange={(e) => setAutoFillLoginUsername(e.target.value)}
                    className="max-w-[180px] h-8"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoFillFromCluster}
                    disabled={autoFillStatus === "loading"}
                  >
                    {autoFillStatus === "loading" ? (
                      <>Syncing…</>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            {autoFillStatus === "success" && (
              <p className="text-sm text-muted-foreground mt-2">Partition details synced from cluster.</p>
            )}
            {autoFillStatus === "error" && autoFillError && (
              <p className="text-sm text-destructive mt-2">{autoFillError}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Partitions Section */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Partitions</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium w-8"></th>
                      <th className="px-3 py-2 text-left font-medium">Queue</th>
                      <th className="px-3 py-2 text-left font-medium">Walltime</th>
                      <th className="px-3 py-2 text-left font-medium">Nodes</th>
                      <th className="px-3 py-2 text-left font-medium">RAM</th>
                      <th className="px-3 py-2 text-left font-medium">CPUs</th>
                      <th className="px-3 py-2 text-left font-medium">GPUs</th>
                      <th className="px-3 py-2 text-right font-medium w-10">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={startAddingQueue}
                          disabled={newRowActive}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </th>
                    </tr>
                  </thead>
                <tbody>
                  {formData.batchQueues?.map((queue, index) => {
                    const isEditing = editingIndices.has(index);
                    const currentQueue = isEditing ? editingQueue : queue;
                    return (
                      <tr key={index} className="border-t">
                        {isEditing ? (
                          <>
                            <td className="px-3 py-2">
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: getPartitionColor(index) }}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={currentQueue?.queueName ?? ""}
                                onChange={(e) => setEditingQueue({ ...editingQueue, queueName: e.target.value })}
                                className="h-8"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                value={currentQueue?.maxRunTime ?? 60}
                                onChange={(e) => setEditingQueue({ ...editingQueue, maxRunTime: parseInt(e.target.value) })}
                                className="h-8"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                value={currentQueue?.maxNodes ?? 0}
                                onChange={(e) => setEditingQueue({ ...editingQueue, maxNodes: parseInt(e.target.value) })}
                                className="h-8"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                value={currentQueue?.maxMemory ?? 0}
                                onChange={(e) => setEditingQueue({ ...editingQueue, maxMemory: parseInt(e.target.value) })}
                                className="h-8"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                value={currentQueue?.cpuPerNode ?? 0}
                                onChange={(e) => setEditingQueue({ ...editingQueue, cpuPerNode: parseInt(e.target.value) })}
                                className="h-8"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                value={currentQueue?.gpuPerNode ?? 0}
                                onChange={(e) => setEditingQueue({ ...editingQueue, gpuPerNode: parseInt(e.target.value) })}
                                className="h-8"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => confirmEditQueue(index)}>
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => cancelEditQueue(index)}>
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2">
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: getPartitionColor(index) }}
                              />
                            </td>
                            <td className="px-3 py-2 font-medium">{queue.queueName}</td>
                            <td className="px-3 py-2 text-muted-foreground">{queue.maxRunTime}</td>
                            <td className="px-3 py-2 text-muted-foreground">{queue.maxNodes}</td>
                            <td className="px-3 py-2 text-muted-foreground">{queue.maxMemory}</td>
                            <td className="px-3 py-2 text-muted-foreground">{queue.cpuPerNode}</td>
                            <td className="px-3 py-2 text-muted-foreground">{queue.gpuPerNode ?? 0}</td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditingQueue(index)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeQueue(index)}>
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  {newRowActive && (
                    <tr className="border-t bg-muted/30">
                      <td className="px-3 py-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: getPartitionColor(formData.batchQueues?.length ?? 0) }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={newQueue.queueName}
                          onChange={(e) => setNewQueue({ ...newQueue, queueName: e.target.value })}
                          placeholder="e.g., normal"
                          className="h-8"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={newQueue.maxRunTime}
                          onChange={(e) => setNewQueue({ ...newQueue, maxRunTime: parseInt(e.target.value) })}
                          className="h-8"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={newQueue.maxNodes}
                          onChange={(e) => setNewQueue({ ...newQueue, maxNodes: parseInt(e.target.value) })}
                          className="h-8"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={newQueue.maxMemory}
                          onChange={(e) => setNewQueue({ ...newQueue, maxMemory: parseInt(e.target.value) })}
                          className="h-8"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={newQueue.cpuPerNode}
                          onChange={(e) => setNewQueue({ ...newQueue, cpuPerNode: parseInt(e.target.value) })}
                          className="h-8"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={newQueue.gpuPerNode}
                          onChange={(e) => setNewQueue({ ...newQueue, gpuPerNode: parseInt(e.target.value) })}
                          className="h-8"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={confirmNewQueue}>
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={cancelNewQueue}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {(!formData.batchQueues || formData.batchQueues.length === 0) && !newRowActive && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                        No partitions defined. Click the + button to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>

            {/* Projects Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Projects</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setAddingProject(true)}
                  disabled={addingProject}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {(projects.length > 0 || addingProject) ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Project</th>
                        {formData.batchQueues?.map((queue, index) => (
                          <th key={queue.queueName} className="px-2 py-2 text-center font-medium w-8">
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: getPartitionColor(index) }}
                              title={queue.queueName}
                            />
                          </th>
                        ))}
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project, projectIndex) => (
                        <tr key={projectIndex} className="border-t">
                          <td className="px-3 py-2 font-medium">{project.name}</td>
                          {formData.batchQueues?.map((queue) => (
                            <td key={queue.queueName} className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleQueueAccess(projectIndex, queue.queueName)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted"
                              >
                                {project.queueAccess[queue.queueName] && (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </button>
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeProject(projectIndex)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {addingProject && (
                        <tr className="border-t bg-muted/30">
                          <td className="px-3 py-2">
                            <Input
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              placeholder="Project name"
                              className="h-8"
                              autoFocus
                            />
                          </td>
                          {formData.batchQueues?.map((queue) => (
                            <td key={queue.queueName} className="px-2 py-2 text-center">
                              <span className="w-5 h-5 inline-block" />
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={addProject}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => { setAddingProject(false); setNewProjectName(""); }}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border rounded-lg px-3 py-8 text-center text-muted-foreground">
                  No projects defined. Click the + button to add one.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : resource ? "Update Resource" : "Create Resource"}
        </Button>
      </div>
    </form>
  );
}
