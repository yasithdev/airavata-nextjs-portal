"use client";

import { useState, Suspense, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, FlaskConical, FolderKanban, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardStats, RecentExperiments, QuickActions } from "@/components/dashboard";
import { ProjectForm } from "@/components/project";
import { ExperimentTable } from "@/components/experiment/ExperimentTable";
import { useProjects, useCreateProject, useDeleteProject, useExperiments, useDeleteExperiment } from "@/hooks";
import type { Project, ExperimentModel } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function DashboardContent() {
  const params = useParams();
  const gatewayName = (params?.gatewayName as string) || "default";
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const initialOpen = searchParams.get("action") === "new";

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(initialOpen);
  const [isCreateExperimentOpen, setIsCreateExperimentOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [experimentToDelete, setExperimentToDelete] = useState<ExperimentModel | null>(null);
  const [search, setSearch] = useState("");

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: allExperiments, isLoading: experimentsLoading } = useExperiments({ limit: 1000 });
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const deleteExperiment = useDeleteExperiment();

  const experimentsByProject = useMemo(() => {
    if (!allExperiments) return {};
    const grouped: Record<string, ExperimentModel[]> = {};
    allExperiments.forEach((exp) => {
      const projectId = exp.projectId || "unassigned";
      if (!grouped[projectId]) grouped[projectId] = [];
      grouped[projectId].push(exp);
    });
    Object.keys(grouped).forEach((projectId) => {
      grouped[projectId].sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0));
    });
    return grouped;
  }, [allExperiments]);

  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    return [...projects].sort((a, b) => {
      const aExperiments = experimentsByProject[a.projectID] || [];
      const bExperiments = experimentsByProject[b.projectID] || [];
      const aLatest = aExperiments.length > 0 ? aExperiments[0].creationTime || 0 : 0;
      const bLatest = bExperiments.length > 0 ? bExperiments[0].creationTime || 0 : 0;
      if (aLatest > 0 && bLatest > 0) return bLatest - aLatest;
      if (aLatest > 0) return -1;
      if (bLatest > 0) return 1;
      return (b.creationTime || 0) - (a.creationTime || 0);
    });
  }, [projects, experimentsByProject]);

  const toggleProjectFilter = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const filteredProjects = useMemo(() => {
    if (!sortedProjects || !search) return sortedProjects;
    const searchLower = search.toLowerCase();
    return sortedProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        experimentsByProject[p.projectID]?.some((e) =>
          e.experimentName.toLowerCase().includes(searchLower)
        )
    );
  }, [sortedProjects, search, experimentsByProject]);

  const filteredExperiments = useMemo(() => {
    if (!allExperiments) return [];
    let filtered = allExperiments;
    if (selectedProjectIds.size > 0) {
      filtered = filtered.filter((exp) => exp.projectId && selectedProjectIds.has(exp.projectId));
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (exp) =>
          exp.experimentName.toLowerCase().includes(searchLower) ||
          exp.projectId?.toLowerCase().includes(searchLower) ||
          projects?.find((p) => p.projectID === exp.projectId)?.name.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  }, [allExperiments, search, selectedProjectIds, projects]);

  const recentExperimentsToShow = useMemo(() => filteredExperiments, [filteredExperiments]);
  const recentProjectsToShow = useMemo(() => {
    if (selectedProjectIds.size > 0) {
      return sortedProjects?.filter((p) => selectedProjectIds.has(p.projectID)) || [];
    }
    return sortedProjects || [];
  }, [sortedProjects, selectedProjectIds]);

  const handleCreateProject = async (data: { name: string; description?: string }) => {
    const owner = session?.user?.email || session?.user?.name || "unknown";
    const result = await createProject.mutateAsync({
      name: data.name,
      description: data.description,
      owner,
    });
    setIsCreateProjectOpen(false);
    if (result?.projectId) setSelectedProjectIds(new Set([result.projectId]));
  };

  const handleDeleteProject = async () => {
    if (projectToDelete) {
      await deleteProject.mutateAsync(projectToDelete.projectID);
      setProjectToDelete(null);
    }
  };

  const handleDeleteExperiment = async () => {
    if (experimentToDelete) {
      await deleteExperiment.mutateAsync(experimentToDelete.experimentId);
      setExperimentToDelete(null);
    }
  };

  const handleCreateExperimentFromProject = (projectId: string) => {
    router.push(`/experiments/create?projectId=${projectId}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || "User"}
        </p>
      </div>

      <DashboardStats
        experiments={allExperiments}
        projects={projects}
        isLoading={experimentsLoading || projectsLoading}
      />

      <div className="space-y-4">
        <SearchBar
          placeholder="Search projects and experiments..."
          value={search}
          onChange={setSearch}
        >
          {(search || selectedProjectIds.size > 0) && (
            <>
              <div className="h-6 w-px bg-border" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedProjectIds(new Set());
                }}
                className="h-8 w-8 p-0"
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </SearchBar>

        {projectsLoading ? (
          <div className="flex gap-2 flex-wrap">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        ) : sortedProjects && sortedProjects.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            {sortedProjects.map((project) => {
              const isSelected = selectedProjectIds.has(project.projectID);
              const experimentCount = experimentsByProject[project.projectID]?.length || 0;
              return (
                <button
                  key={project.projectID}
                  onClick={() => toggleProjectFilter(project.projectID)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    isSelected ? "bg-blue-500 text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <FolderKanban className="h-4 w-4" />
                  <span>{project.name}</span>
                  {experimentCount > 0 && (
                    <Badge
                      variant={isSelected ? "secondary" : "outline"}
                      className={cn("ml-1", isSelected ? "bg-white/20 text-white" : "")}
                    >
                      {experimentCount}
                    </Badge>
                  )}
                </button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateProjectOpen(true)}
              className="rounded-full text-sm font-medium"
            >
              <Plus className="mr-1 h-4 w-4" />
              New Project
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateProjectOpen(true)}
              className="rounded-full text-sm font-medium"
            >
              <Plus className="mr-1 h-4 w-4" />
              New Project
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-1">
          <QuickActions gatewayName={gatewayName} onCreateProject={() => setIsCreateProjectOpen(true)} />
        </div>
        <div className="md:col-span-3">
          <RecentExperiments
            experiments={recentExperimentsToShow}
            projects={recentProjectsToShow}
            isLoading={experimentsLoading || projectsLoading}
            onDelete={setExperimentToDelete}
          />
        </div>
      </div>

      <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Create a new project to organize your experiments</DialogDescription>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => setIsCreateProjectOpen(false)}
            isLoading={createProject.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateExperimentOpen} onOpenChange={setIsCreateExperimentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Experiment</DialogTitle>
            <DialogDescription>
              {selectedProjectIds.size === 1
                ? `Create an experiment in "${projects?.find((p) => p.projectID === Array.from(selectedProjectIds)[0])?.name || "selected project"}"`
                : "Select a project to create an experiment in"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {projectsLoading ? (
              <div className="text-center py-4">Loading projects...</div>
            ) : !projects || projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You need to create a project first before creating experiments.
                </p>
                <Button
                  onClick={() => {
                    setIsCreateExperimentOpen(false);
                    setIsCreateProjectOpen(true);
                  }}
                >
                  Create Project
                </Button>
              </div>
            ) : selectedProjectIds.size === 1 ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <p className="text-sm font-medium mb-2">Selected Project:</p>
                  <p className="text-sm text-muted-foreground">
                    {projects.find((p) => p.projectID === Array.from(selectedProjectIds)[0])?.name}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateExperimentOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      router.push(`/experiments/create?projectId=${Array.from(selectedProjectIds)[0]}`);
                    }}
                  >
                    Create Experiment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {projects.map((project) => (
                  <Button
                    key={project.projectID}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => {
                      setSelectedProjectIds(new Set([project.projectID]));
                      router.push(`/experiments/create?projectId=${project.projectID}`);
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <FolderKanban className="h-5 w-5 text-purple-600" />
                      <div className="flex-1 text-left">
                        <p className="font-semibold">{project.name}</p>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{projectToDelete?.name}&quot;? This action cannot be undone
              and all associated experiments will be removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setProjectToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={deleteProject.isPending}>
              {deleteProject.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!experimentToDelete} onOpenChange={() => setExperimentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Experiment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{experimentToDelete?.experimentName}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setExperimentToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteExperiment} disabled={deleteExperiment.isPending}>
              {deleteExperiment.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
