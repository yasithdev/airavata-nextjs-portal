"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExperimentTable } from "@/components/experiment/ExperimentTable";
import type { ExperimentModel, Project } from "@/types";

interface RecentExperimentsProps {
  experiments?: ExperimentModel[];
  projects?: Project[];
  isLoading?: boolean;
  onDelete?: (experiment: ExperimentModel) => void;
}

export function RecentExperiments({ experiments = [], projects = [], isLoading, onDelete }: RecentExperimentsProps) {

  // Group experiments by project
  const experimentsByProject = useMemo(() => {
    if (!experiments) return {};
    const grouped: Record<string, ExperimentModel[]> = {};
    experiments.forEach((exp) => {
      const projectId = exp.projectId || "unassigned";
      if (!grouped[projectId]) {
        grouped[projectId] = [];
      }
      grouped[projectId].push(exp);
    });
    // Sort experiments within each project by creation time (newest first)
    Object.keys(grouped).forEach((projectId) => {
      grouped[projectId].sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0));
    });
    return grouped;
  }, [experiments]);

  // Get all projects with their experiments, sorted by most recent experiment time
  const projectsWithExperiments = useMemo(() => {
    if (!projects || projects.length === 0) {
      // If no projects provided, show experiments without project grouping
      return [];
    }

    // Create a map of projectId to most recent experiment time
    const projectLatestExperiment: Record<string, number> = {};
    Object.entries(experimentsByProject).forEach(([projectId, exps]) => {
      if (exps.length > 0) {
        projectLatestExperiment[projectId] = exps[0].creationTime || 0;
      }
    });

    // Sort projects by most recent experiment time (projects with experiments first, then by time)
    // Projects without experiments go to the end
    const sortedProjects = [...projects].sort((a, b) => {
      const aTime = projectLatestExperiment[a.projectID] || 0;
      const bTime = projectLatestExperiment[b.projectID] || 0;
      
      // If both have experiments, sort by time
      if (aTime > 0 && bTime > 0) {
        return bTime - aTime;
      }
      // If only one has experiments, it comes first
      if (aTime > 0) return -1;
      if (bTime > 0) return 1;
      // If neither has experiments, sort by project creation time
      return (b.creationTime || 0) - (a.creationTime || 0);
    });

    return sortedProjects.map((project) => ({
      project,
      experiments: experimentsByProject[project.projectID] || [],
    }));
  }, [projects, experimentsByProject]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recently Used</CardTitle>
          <CardDescription>Your projects and recently used experiments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no projects provided or no projects with experiments, show all experiments in a single table
  if (!projects || projects.length === 0 || projectsWithExperiments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recently Used</CardTitle>
          <CardDescription>Your projects and recently used experiments</CardDescription>
        </CardHeader>
        <CardContent>
          {experiments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No experiments found</p>
            </div>
          ) : (
            <ExperimentTable
              experiments={experiments}
              onDelete={onDelete}
              showProject={true}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recently Used</CardTitle>
        <CardDescription>Your projects and recently used experiments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {projectsWithExperiments.map(({ project, experiments: projectExperiments }) => {
            if (projectExperiments.length === 0) {
              return null; // Skip projects with no experiments
            }
            
            return (
              <div key={project.projectID} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <Link
                    href={`/projects/${project.projectID}`}
                    className="text-sm font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                  >
                    {project.name}
                  </Link>
                </div>
                <ExperimentTable
                  experiments={projectExperiments}
                  onDelete={onDelete}
                  showProject={false}
                />
              </div>
            );
          })}
          {projectsWithExperiments.every(({ experiments: exps }) => exps.length === 0) && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No experiments found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
