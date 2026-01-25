"use client";

import { useSession } from "next-auth/react";
import { DashboardStats, RecentExperiments, RecentProjects, QuickActions } from "@/components/dashboard";
import { useExperiments, useProjects } from "@/hooks";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: experiments, isLoading: experimentsLoading } = useExperiments({ limit: 10 });
  const { data: projects, isLoading: projectsLoading } = useProjects({ limit: 10 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || "User"}
        </p>
      </div>

      <DashboardStats
        experiments={experiments}
        projects={projects}
        isLoading={experimentsLoading || projectsLoading}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentExperiments experiments={experiments} isLoading={experimentsLoading} />
        <div className="space-y-6">
          <QuickActions />
          <RecentProjects projects={projects} isLoading={projectsLoading} />
        </div>
      </div>
    </div>
  );
}
