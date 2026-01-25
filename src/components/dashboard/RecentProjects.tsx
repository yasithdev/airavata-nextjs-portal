"use client";

import Link from "next/link";
import { FolderKanban, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

interface RecentProjectsProps {
  projects?: Project[];
  isLoading?: boolean;
}

export function RecentProjects({ projects = [], isLoading }: RecentProjectsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your most recent projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentProjects = projects.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your most recent projects</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No projects yet</p>
            <Button className="mt-4" asChild>
              <Link href="/projects?action=new">Create your first project</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <Link
                key={project.projectID}
                href={`/projects/${project.projectID}`}
                className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <FolderKanban className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{project.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(project.creationTime)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
