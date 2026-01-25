"use client";

import { AppWindow } from "lucide-react";
import { ApplicationCard } from "./ApplicationCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApplicationInterfaceDescription } from "@/types";

interface ApplicationListProps {
  applications?: ApplicationInterfaceDescription[];
  isLoading?: boolean;
}

export function ApplicationList({ applications = [], isLoading }: ApplicationListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AppWindow className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No applications available</h3>
        <p className="text-muted-foreground mt-1">
          Contact your administrator to configure applications
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {applications.map((app) => (
        <ApplicationCard key={app.applicationInterfaceId} application={app} />
      ))}
    </div>
  );
}
