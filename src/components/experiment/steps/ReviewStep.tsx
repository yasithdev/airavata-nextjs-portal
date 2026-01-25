"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Props {
  data: any;
  onBack: () => void;
  onSubmit: (launchImmediately: boolean) => Promise<void>;
  isSubmitting: boolean;
}

export function ReviewStep({ data, onBack, onSubmit, isSubmitting }: Props) {
  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Experiment Details</h3>
          <div className="grid gap-3">
            <div>
              <Label className="text-muted-foreground">Experiment Name</Label>
              <p className="font-medium">{data.experimentName}</p>
            </div>
            {data.description && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="font-medium">{data.description}</p>
              </div>
            )}
            {data.projectId && (
              <div>
                <Label className="text-muted-foreground">Project</Label>
                <p className="font-medium">{data.projectId}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Application</h3>
          <div className="grid gap-3">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="font-medium">{data.application?.applicationName}</p>
            </div>
            {data.application?.applicationDescription && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="font-medium">{data.application?.applicationDescription}</p>
              </div>
            )}
            {data.applicationDeploymentId && (
              <div>
                <Label className="text-muted-foreground">Deployment</Label>
                <p className="font-medium">{data.applicationDeploymentId}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Inputs</h3>
          {data.inputs && data.inputs.length > 0 ? (
            <div className="grid gap-3">
              {data.inputs.map((input: any) => (
                <div key={input.name}>
                  <Label className="text-muted-foreground">
                    {input.userFriendlyDescription || input.name}
                  </Label>
                  <p className="font-medium break-all">{input.value || "(not set)"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No inputs configured</p>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Compute Settings</h3>
          <div className="grid gap-3">
            <div>
              <Label className="text-muted-foreground">Compute Resource</Label>
              <p className="font-medium">{data.computeResourceId}</p>
            </div>
            {data.groupResourceProfileId && (
              <div>
                <Label className="text-muted-foreground">Group Resource Profile</Label>
                <p className="font-medium">{data.groupResourceProfileId}</p>
              </div>
            )}
            {data.scheduling?.queueName && (
              <div>
                <Label className="text-muted-foreground">Queue</Label>
                <p className="font-medium">{data.scheduling.queueName}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {data.scheduling?.nodeCount && (
                <div>
                  <Label className="text-muted-foreground">Nodes</Label>
                  <p className="font-medium">{data.scheduling.nodeCount}</p>
                </div>
              )}
              {data.scheduling?.totalCPUCount && (
                <div>
                  <Label className="text-muted-foreground">CPUs</Label>
                  <p className="font-medium">{data.scheduling.totalCPUCount}</p>
                </div>
              )}
              {data.scheduling?.wallTimeLimit && (
                <div>
                  <Label className="text-muted-foreground">Wall Time</Label>
                  <p className="font-medium">{data.scheduling.wallTimeLimit} min</p>
                </div>
              )}
              {data.scheduling?.totalPhysicalMemory && (
                <div>
                  <Label className="text-muted-foreground">Memory</Label>
                  <p className="font-medium">{data.scheduling.totalPhysicalMemory} MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => onSubmit(false)}
            disabled={isSubmitting}
          >
            Save Draft
          </Button>
          <Button onClick={() => onSubmit(true)} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create & Launch"}
          </Button>
        </div>
      </div>
    </div>
  );
}
