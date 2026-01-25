"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectList, ProjectForm } from "@/components/project";
import { useProjects, useCreateProject, useDeleteProject } from "@/hooks";
import type { Project } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const initialOpen = searchParams.get("action") === "new";
  
  const [isCreateOpen, setIsCreateOpen] = useState(initialOpen);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [search, setSearch] = useState("");
  
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  // Filter projects by search
  const filteredProjects = useMemo(() => {
    if (!projects || !search) return projects;
    const searchLower = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
    );
  }, [projects, search]);

  const handleCreate = async (data: { name: string; description?: string }) => {
    const owner = session?.user?.email || session?.user?.name || "unknown";
    await createProject.mutateAsync({
      name: data.name,
      description: data.description,
      owner: owner,
    });
    setIsCreateOpen(false);
  };

  const handleDelete = async () => {
    if (projectToDelete) {
      await deleteProject.mutateAsync(projectToDelete.projectID);
      setProjectToDelete(null);
    }
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
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Spotlight-style Search Bar */}
      <div className="flex items-center p-1 bg-muted/50 rounded-lg border max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ProjectList
        projects={filteredProjects}
        isLoading={isLoading}
        onEdit={(project) => window.location.href = `/projects/${project.projectID}/edit`}
        onDelete={setProjectToDelete}
      />

      {/* Create Project Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your experiments
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            isLoading={createProject.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
              onClick={handleDelete}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? "Deleting..." : "Delete"}
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
