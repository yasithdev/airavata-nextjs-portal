"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Search, FlaskConical, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectForm } from "@/components/project";
import { ExperimentTable } from "@/components/experiment/ExperimentTable";
import { useProjects, useCreateProject, useDeleteProject, useExperiments, useDeleteExperiment } from "@/hooks";
import type { Project, ExperimentModel } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const initialOpen = searchParams.get("action") === "new";
  
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(initialOpen);
  const [isCreateExperimentOpen, setIsCreateExperimentOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [experimentToDelete, setExperimentToDelete] = useState<ExperimentModel | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"projects" | "experiments">("projects");
  
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: allExperiments, isLoading: experimentsLoading } = useExperiments({ limit: 1000 });
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const deleteExperiment = useDeleteExperiment();

  // Group experiments by project
  const experimentsByProject = useMemo(() => {
    if (!allExperiments) return {};
    const grouped: Record<string, ExperimentModel[]> = {};
    allExperiments.forEach((exp) => {
      const projectId = exp.projectId || "unassigned";
      if (!grouped[projectId]) {
        grouped[projectId] = [];
      }
      grouped[projectId].push(exp);
    });
    return grouped;
  }, [allExperiments]);

  // Filter projects by search
  const filteredProjects = useMemo(() => {
    if (!projects || !search) return projects;
    const searchLower = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        experimentsByProject[p.projectID]?.some((e) =>
          e.experimentName.toLowerCase().includes(searchLower)
        )
    );
  }, [projects, search, experimentsByProject]);

  // Filter experiments by search (for experiments view)
  const filteredExperiments = useMemo(() => {
    if (!allExperiments || !search) return allExperiments;
    const searchLower = search.toLowerCase();
    return allExperiments.filter((exp) =>
      exp.experimentName.toLowerCase().includes(searchLower) ||
      exp.projectId?.toLowerCase().includes(searchLower)
    );
  }, [allExperiments, search]);

  const handleCreateProject = async (data: { name: string; description?: string }) => {
    const owner = session?.user?.email || session?.user?.name || "unknown";
    await createProject.mutateAsync({
      name: data.name,
      description: data.description,
      owner: owner,
    });
    setIsCreateProjectOpen(false);
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

  const handleCreateExperiment = (projectId?: string) => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
    setIsCreateExperimentOpen(true);
  };

  const handleCreateExperimentFromProject = (projectId: string) => {
    router.push(`/experiments/create?projectId=${projectId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your research projects and organize experiments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateProjectOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Spotlight-style Search Bar with Inline View Toggle */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects and experiments..."
            className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {/* Divider */}
        <div className="h-6 w-px bg-border" />
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-0.5 px-1">
          <button
            onClick={() => setViewMode("projects")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === "projects"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Projects View</span>
          </button>
          <button
            onClick={() => setViewMode("experiments")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === "experiments"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">All Experiments</span>
          </button>
        </div>
      </div>

      {viewMode === "projects" ? (
        // Projects View with nested experiments
        projectsLoading ? (
          <div className="space-y-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <div className="border rounded-lg">
                  <div className="p-4 space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <Skeleton key={j} className="h-12 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects && filteredProjects.length > 0 ? (
          <div className="space-y-8">
            {filteredProjects.map((project) => {
              const projectExperiments = experimentsByProject[project.projectID] || [];
              
              return (
                <div key={project.projectID} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {project.name}
                    </h3>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleCreateExperimentFromProject(project.projectID)}
                    >
                      <FlaskConical className="mr-2 h-3 w-3" />
                      Create Experiment
                    </Button>
                  </div>
                  {experimentsLoading ? (
                    <div className="border rounded-lg">
                      <div className="p-4 space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    </div>
                  ) : projectExperiments.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg bg-muted/30">
                      <FlaskConical className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">No experiments in this project</p>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateExperimentFromProject(project.projectID)}
                      >
                        <FlaskConical className="mr-2 h-4 w-4" />
                        Create Experiment
                      </Button>
                    </div>
                  ) : (
                    <ExperimentTable
                      experiments={projectExperiments}
                      onDelete={setExperimentToDelete}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No projects found</h3>
            <p className="text-muted-foreground mt-1">
              Create your first project to start organizing experiments
            </p>
            <Button className="mt-4" onClick={() => setIsCreateProjectOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        )
      ) : (
        // All Experiments View
        experimentsLoading ? (
          <div className="border rounded-lg">
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <ExperimentTable
            experiments={filteredExperiments}
            onDelete={setExperimentToDelete}
            showProject={true}
          />
        )
      )}

      {/* Create Project Dialog */}
      <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your experiments
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => setIsCreateProjectOpen(false)}
            isLoading={createProject.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Create Experiment Dialog - requires project selection */}
      <Dialog open={isCreateExperimentOpen} onOpenChange={setIsCreateExperimentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Experiment</DialogTitle>
            <DialogDescription>
              Select a project to create an experiment in
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
                <Button onClick={() => {
                  setIsCreateExperimentOpen(false);
                  setIsCreateProjectOpen(true);
                }}>
                  Create Project
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {projects.map((project) => (
                  <Button
                    key={project.projectID}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => {
                      router.push(`/experiments/create?projectId=${project.projectID}`);
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <FolderKanban className="h-5 w-5 text-purple-600" />
                      <div className="flex-1 text-left">
                        <p className="font-semibold">{project.name}</p>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </p>
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

      {/* Delete Project Confirmation Dialog */}
      <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{projectToDelete?.name}&quot;? This action cannot
              be undone and all associated experiments will be removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setProjectToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Experiment Confirmation Dialog */}
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
            <Button variant="outline" onClick={() => setExperimentToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteExperiment}
              disabled={deleteExperiment.isPending}
            >
              {deleteExperiment.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}
