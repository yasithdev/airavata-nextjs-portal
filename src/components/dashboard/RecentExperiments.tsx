"use client";

import Link from "next/link";
import { FlaskConical, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExperimentModel } from "@/types";
import { formatRelativeTime, getExperimentStatusColor } from "@/lib/utils";

interface RecentExperimentsProps {
  experiments?: ExperimentModel[];
  isLoading?: boolean;
}

export function RecentExperiments({ experiments = [], isLoading }: RecentExperimentsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Experiments</CardTitle>
          <CardDescription>Your most recent experiments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentExperiments = experiments.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Experiments</CardTitle>
          <CardDescription>Your most recent experiments</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/experiments">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentExperiments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No experiments yet</p>
            <Button className="mt-4" asChild>
              <Link href="/applications">Create your first experiment</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentExperiments.map((experiment) => {
              const status = experiment.experimentStatus?.[0]?.state || "UNKNOWN";
              return (
                <Link
                  key={experiment.experimentId}
                  href={`/experiments/${experiment.experimentId}`}
                  className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <FlaskConical className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{experiment.experimentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatRelativeTime(experiment.creationTime)}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${getExperimentStatusColor(status)} text-white`}
                  >
                    {status}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
