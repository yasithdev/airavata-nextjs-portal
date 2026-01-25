"use client";

import { Suspense } from "react";
import { CreateExperimentWizard } from "@/components/experiment/CreateExperimentWizard";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreateExperimentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Experiment</h1>
        <p className="text-muted-foreground">
          Set up a new computational experiment
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        }
      >
        <CreateExperimentWizard />
      </Suspense>
    </div>
  );
}
