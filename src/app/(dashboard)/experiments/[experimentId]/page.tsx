"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, Pencil, RefreshCw, Calendar, User, Server, FolderKanban, Play, StopCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ExperimentStatus } from "@/components/experiment";
import { useExperiment, useExperimentProcesses, useLaunchExperiment, useCancelExperiment, useCloneExperiment } from "@/hooks";
import { formatDate, isTerminalState } from "@/lib/utils";
import { ExperimentState, ProcessState } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/useToast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ExperimentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const experimentId = params.experimentId as string;
  const queryClient = useQueryClient();

  const { data: experiment, isLoading: expLoading, refetch } = useExperiment(experimentId);
  const { data: processes, isLoading: processLoading } = useExperimentProcesses(experimentId);
  const launchExperiment = useLaunchExperiment();
  const cancelExperiment = useCancelExperiment();
  const cloneExperiment = useCloneExperiment();

  const status = experiment?.experimentStatus?.[0]?.state || "UNKNOWN";
  const canEdit = status === ExperimentState.CREATED;
  const canLaunch = status === ExperimentState.CREATED;
  const canCancel = status === ExperimentState.EXECUTING || status === ExperimentState.SCHEDULED || status === ExperimentState.LAUNCHED;
  const isRunning = !isTerminalState(status);

  // Auto-refresh every 10 seconds for running experiments
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ["experiment-processes", experimentId] });
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isRunning, refetch, queryClient, experimentId]);

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["experiment-processes", experimentId] });
  };

  const handleLaunch = async () => {
    try {
      await launchExperiment.mutateAsync(experimentId);
      toast({
        title: "Experiment launched",
        description: "Your experiment has been submitted for execution.",
      });
    } catch (error) {
      toast({
        title: "Launch failed",
        description: error instanceof Error ? error.message : "Failed to launch experiment",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this experiment?")) {
      return;
    }
    try {
      await cancelExperiment.mutateAsync(experimentId);
      toast({
        title: "Experiment cancelled",
        description: "Your experiment has been cancelled.",
      });
    } catch (error) {
      toast({
        title: "Cancel failed",
        description: error instanceof Error ? error.message : "Failed to cancel experiment",
        variant: "destructive",
      });
    }
  };

  const handleClone = async () => {
    try {
      const result = await cloneExperiment.mutateAsync(experimentId);
      toast({
        title: "Experiment cloned",
        description: "A copy of this experiment has been created.",
      });
      router.push(`/experiments/${result.experimentId}`);
    } catch (error) {
      toast({
        title: "Clone failed",
        description: error instanceof Error ? error.message : "Failed to clone experiment",
        variant: "destructive",
      });
    }
  };

  if (expLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold">Experiment not found</h2>
        <p className="text-muted-foreground mt-2">The requested experiment could not be found.</p>
        <Button asChild className="mt-4">
          <Link href="/experiments">Back to Experiments</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/experiments">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{experiment.experimentName}</h1>
              <ExperimentStatus status={status} />
            </div>
            <p className="text-muted-foreground">{experiment.description || "No description"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
          {canLaunch && (
            <Button onClick={handleLaunch} disabled={launchExperiment.isPending}>
              <Play className="mr-2 h-4 w-4" />
              Launch
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={handleCancel} disabled={cancelExperiment.isPending}>
              <StopCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link href={`/experiments/${experimentId}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleClone} disabled={cloneExperiment.isPending}>
                <Copy className="mr-2 h-4 w-4" />
                Clone
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">User</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{experiment.userName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{formatDate(experiment.creationTime)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Project</CardTitle>
          </CardHeader>
          <CardContent>
            {experiment.projectId ? (
              <Link href={`/projects/${experiment.projectId}`} className="font-semibold text-primary hover:underline">
                View Project
              </Link>
            ) : (
              <p className="text-muted-foreground">None</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Compute Resource</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold truncate">
              {experiment.userConfigurationData?.computationalResourceScheduling?.resourceHostId || "Not specified"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="processes">
        <TabsList>
          <TabsTrigger value="processes">Processes</TabsTrigger>
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="outputs">Outputs</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Processes</CardTitle>
              <CardDescription>Execution processes for this experiment</CardDescription>
            </CardHeader>
            <CardContent>
              {processLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : processes?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No processes yet</p>
              ) : (
                <div className="space-y-4">
                  {processes?.map((process) => {
                    const processStatus = process.processStatuses?.[0]?.state || "UNKNOWN";
                    return (
                      <div key={process.processId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Process: {process.processId.substring(0, 8)}...</p>
                            <p className="text-sm text-muted-foreground">
                              Created: {formatDate(process.creationTime)}
                            </p>
                          </div>
                          <Badge variant={processStatus === ProcessState.COMPLETED ? "default" : "secondary"}>
                            {processStatus}
                          </Badge>
                        </div>
                        {process.tasks && process.tasks.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Tasks:</p>
                            <div className="grid gap-2">
                              {process.tasks.map((task) => (
                                <div key={task.taskId} className="text-sm bg-muted p-2 rounded">
                                  <span className="font-medium">{task.taskType}</span>
                                  <span className="mx-2">-</span>
                                  <span className="text-muted-foreground">
                                    {task.taskStatuses?.[0]?.state || "UNKNOWN"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inputs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Inputs</CardTitle>
              <CardDescription>Input parameters for this experiment</CardDescription>
            </CardHeader>
            <CardContent>
              {experiment.experimentInputs?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No inputs defined</p>
              ) : (
                <div className="space-y-4">
                  {experiment.experimentInputs?.map((input, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{input.name}</p>
                          <p className="text-sm text-muted-foreground">{input.userFriendlyDescription}</p>
                        </div>
                        <Badge variant="outline">{input.type}</Badge>
                      </div>
                      <div className="mt-2 p-2 bg-muted rounded text-sm font-mono">
                        {input.value || <span className="text-muted-foreground">No value</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outputs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Outputs</CardTitle>
              <CardDescription>Output files and results</CardDescription>
            </CardHeader>
            <CardContent>
              {experiment.experimentOutputs?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No outputs yet</p>
              ) : (
                <div className="space-y-4">
                  {experiment.experimentOutputs?.map((output, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{output.name}</p>
                        </div>
                        <Badge variant="outline">{output.type}</Badge>
                      </div>
                      {output.value && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm font-mono break-all">
                          {output.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Errors</CardTitle>
              <CardDescription>Any errors encountered during execution</CardDescription>
            </CardHeader>
            <CardContent>
              {experiment.errors?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No errors</p>
              ) : (
                <div className="space-y-4">
                  {experiment.errors?.map((error, idx) => (
                    <div key={idx} className="border border-red-200 bg-red-50 rounded-lg p-4">
                      <p className="font-medium text-red-800">{error.userFriendlyMessage || "Error"}</p>
                      {error.actualErrorMessage && (
                        <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                          {error.actualErrorMessage}
                        </pre>
                      )}
                      <p className="text-xs text-red-600 mt-2">
                        {formatDate(error.creationTime)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
