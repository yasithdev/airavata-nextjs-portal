"use client";

import { useRouter } from "next/navigation";
import { FlaskConical, MoreVertical, Eye, Pencil, Trash2, StopCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExperimentModel } from "@/types";
import { ExperimentState } from "@/types";
import { getExperimentStatusColor, isTerminalState } from "@/lib/utils";
import { getExperimentPermalink } from "@/lib/permalink";

interface ExperimentTableProps {
  experiments: ExperimentModel[];
  onDelete?: (experiment: ExperimentModel) => void;
  onCancel?: (experiment: ExperimentModel) => void;
  showProject?: boolean;
  onCreateExperiment?: () => void;
}

export function ExperimentTable({ experiments, onDelete, onCancel, showProject = false, onCreateExperiment }: ExperimentTableProps) {
  const router = useRouter();

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {experiments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showProject ? 4 : 3} className="text-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <FlaskConical className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No experiments found</p>
                  {onCreateExperiment && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onCreateExperiment}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Experiment
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            <>
              {experiments.map((experiment) => {
                const status = experiment.experimentStatus?.[0]?.state || "UNKNOWN";
                const canEdit = status === ExperimentState.CREATED;
                const canCancel = [ExperimentState.EXECUTING, ExperimentState.LAUNCHED, ExperimentState.SCHEDULED].includes(status as ExperimentState);
                const experimentPermalink = getExperimentPermalink(experiment.experimentId);

                return (
                  <TableRow 
                    key={experiment.experimentId} 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(experimentPermalink)}
                  >
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-blue-600" />
                        {experiment.experimentName}
                      </div>
                    </TableCell>
                    {showProject && (
                      <TableCell className="text-muted-foreground">
                        {experiment.projectId ? experiment.projectId.substring(0, 8) + "..." : "N/A"}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={`${getExperimentStatusColor(status)} text-white`}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(experimentPermalink)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem onClick={() => router.push(`${experimentPermalink}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canCancel && (
                            <DropdownMenuItem onClick={(e) => {
                              e.preventDefault();
                              onCancel?.(experiment);
                            }}>
                              <StopCircle className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          {isTerminalState(status) && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.preventDefault();
                                onDelete?.(experiment);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
