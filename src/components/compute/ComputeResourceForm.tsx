"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectivityTest } from "@/components/resources/ConnectivityTest";
import type { ComputeResourceDescription, BatchQueue } from "@/types";

interface Props {
  resource?: ComputeResourceDescription;
  onSubmit: (resource: Partial<ComputeResourceDescription>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function ComputeResourceForm({ resource, onSubmit, onCancel, isLoading }: Props) {
  const [formData, setFormData] = useState<Partial<ComputeResourceDescription>>({
    hostName: resource?.hostName || "",
    resourceDescription: resource?.resourceDescription || "",
    maxMemoryPerNode: resource?.maxMemoryPerNode || 0,
    cpusPerNode: resource?.cpusPerNode || 0,
    defaultNodeCount: resource?.defaultNodeCount || 1,
    defaultCPUCount: resource?.defaultCPUCount || 1,
    defaultWalltime: resource?.defaultWalltime || 30,
    batchQueues: resource?.batchQueues || [],
  });

  const [newQueue, setNewQueue] = useState<Partial<BatchQueue>>({
    queueName: "",
    maxRunTime: 60,
    maxNodes: 10,
    maxProcessors: 100,
    maxMemory: 64,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hostName) {
      alert("Host name is required");
      return;
    }
    await onSubmit(formData);
  };

  const addQueue = () => {
    if (!newQueue.queueName) {
      alert("Queue name is required");
      return;
    }
    setFormData({
      ...formData,
      batchQueues: [...(formData.batchQueues || []), newQueue as BatchQueue],
    });
    setNewQueue({
      queueName: "",
      maxRunTime: 60,
      maxNodes: 10,
      maxProcessors: 100,
      maxMemory: 64,
    });
  };

  const removeQueue = (index: number) => {
    setFormData({
      ...formData,
      batchQueues: formData.batchQueues?.filter((_, i) => i !== index),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>CPUs Per Node</Label>
              <Input
                type="number"
                value={formData.cpusPerNode}
                onChange={(e) => setFormData({ ...formData, cpusPerNode: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Memory Per Node (GB)</Label>
              <Input
                type="number"
                value={formData.maxMemoryPerNode}
                onChange={(e) => setFormData({ ...formData, maxMemoryPerNode: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Default Node Count</Label>
              <Input
                type="number"
                value={formData.defaultNodeCount}
                onChange={(e) => setFormData({ ...formData, defaultNodeCount: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Default CPU Count</Label>
              <Input
                type="number"
                value={formData.defaultCPUCount}
                onChange={(e) => setFormData({ ...formData, defaultCPUCount: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Default Walltime (min)</Label>
              <Input
                type="number"
                value={formData.defaultWalltime}
                onChange={(e) => setFormData({ ...formData, defaultWalltime: parseInt(e.target.value) })}
              />
            </div>
          </div>
          {formData.hostName && (
            <div className="mt-4">
              <ConnectivityTest
                host={formData.hostName}
                port={6817}
                type="slurm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Batch Queues</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addQueue}>
              <Plus className="mr-2 h-4 w-4" />
              Add Queue
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Queue Name</Label>
              <Input
                value={newQueue.queueName}
                onChange={(e) => setNewQueue({ ...newQueue, queueName: e.target.value })}
                placeholder="e.g., normal"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Runtime (min)</Label>
              <Input
                type="number"
                value={newQueue.maxRunTime}
                onChange={(e) => setNewQueue({ ...newQueue, maxRunTime: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Nodes</Label>
              <Input
                type="number"
                value={newQueue.maxNodes}
                onChange={(e) => setNewQueue({ ...newQueue, maxNodes: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Processors</Label>
              <Input
                type="number"
                value={newQueue.maxProcessors}
                onChange={(e) => setNewQueue({ ...newQueue, maxProcessors: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Memory (GB)</Label>
              <Input
                type="number"
                value={newQueue.maxMemory}
                onChange={(e) => setNewQueue({ ...newQueue, maxMemory: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {formData.batchQueues && formData.batchQueues.length > 0 && (
            <div className="space-y-2">
              {formData.batchQueues.map((queue, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{queue.queueName}</span>
                    </div>
                    <div className="text-muted-foreground">{queue.maxRunTime} min</div>
                    <div className="text-muted-foreground">{queue.maxNodes} nodes</div>
                    <div className="text-muted-foreground">{queue.maxProcessors} procs</div>
                    <div className="text-muted-foreground">{queue.maxMemory} GB</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQueue(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
