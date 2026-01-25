"use client";

import { FlaskConical, FolderKanban, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExperimentModel, Project } from "@/types";
import { ExperimentState } from "@/types";

interface DashboardStatsProps {
  experiments?: ExperimentModel[];
  projects?: Project[];
  isLoading?: boolean;
}

export function DashboardStats({ experiments = [], projects = [], isLoading }: DashboardStatsProps) {
  const stats = {
    totalExperiments: experiments.length,
    runningExperiments: experiments.filter(
      (e) => e.experimentStatus?.[0]?.state === ExperimentState.EXECUTING
    ).length,
    completedExperiments: experiments.filter(
      (e) => e.experimentStatus?.[0]?.state === ExperimentState.COMPLETED
    ).length,
    failedExperiments: experiments.filter(
      (e) => e.experimentStatus?.[0]?.state === ExperimentState.FAILED
    ).length,
    totalProjects: projects.length,
  };

  const statCards = [
    {
      title: "Total Experiments",
      value: stats.totalExperiments,
      icon: FlaskConical,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Running",
      value: stats.runningExperiments,
      icon: Loader2,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Completed",
      value: stats.completedExperiments,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Failed",
      value: stats.failedExperiments,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Projects",
      value: stats.totalProjects,
      icon: FolderKanban,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`rounded-full p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
