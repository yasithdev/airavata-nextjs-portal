"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ComputeResourceDescription } from "@/types";

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function QueueSettingsStep({ data, onUpdate, onNext, onBack }: Props) {
  const { data: computeResource } = useQuery({
    queryKey: ["compute-resource", data.computeResourceId],
    queryFn: () =>
      apiClient.get<ComputeResourceDescription>(`/api/v1/compute-resources/${data.computeResourceId}`),
    enabled: !!data.computeResourceId,
  });

  const updateScheduling = (field: string, value: any) => {
    onUpdate({
      scheduling: {
        ...data.scheduling,
        [field]: value,
      },
    });
  };

  const handleNext = () => {
    if (!data.scheduling?.queueName) {
      alert("Please select a queue");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Queue Name *</Label>
          <Select
            value={data.scheduling?.queueName || ""}
            onValueChange={(value) => updateScheduling("queueName", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a queue" />
            </SelectTrigger>
            <SelectContent>
              {computeResource?.batchQueues?.map((queue) => (
                <SelectItem key={queue.queueName} value={queue.queueName}>
                  {queue.queueName} ({queue.maxNodes || "N/A"} max nodes)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Node Count</Label>
            <Input
              type="number"
              min="1"
              value={data.scheduling?.nodeCount || 1}
              onChange={(e) => updateScheduling("nodeCount", parseInt(e.target.value))}
              placeholder="Number of nodes"
            />
          </div>

          <div className="space-y-2">
            <Label>Total CPU Count</Label>
            <Input
              type="number"
              min="1"
              value={data.scheduling?.totalCPUCount || 1}
              onChange={(e) => updateScheduling("totalCPUCount", parseInt(e.target.value))}
              placeholder="Total CPUs"
            />
          </div>

          <div className="space-y-2">
            <Label>Wall Time Limit (minutes)</Label>
            <Input
              type="number"
              min="1"
              value={data.scheduling?.wallTimeLimit || 30}
              onChange={(e) => updateScheduling("wallTimeLimit", parseInt(e.target.value))}
              placeholder="Wall time in minutes"
            />
          </div>

          <div className="space-y-2">
            <Label>Total Physical Memory (MB)</Label>
            <Input
              type="number"
              min="0"
              value={data.scheduling?.totalPhysicalMemory || 0}
              onChange={(e) => updateScheduling("totalPhysicalMemory", parseInt(e.target.value))}
              placeholder="Memory in MB"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Allocation Project Number</Label>
          <Input
            value={data.scheduling?.overrideAllocationProjectNumber || ""}
            onChange={(e) => updateScheduling("overrideAllocationProjectNumber", e.target.value)}
            placeholder="Project allocation number (optional)"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}
