"use client";

import Link from "next/link";
import { AppWindow, ArrowRight, Download, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ApplicationInterfaceDescription } from "@/types";

interface ApplicationCardProps {
  application: ApplicationInterfaceDescription;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <AppWindow className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{application.applicationName}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {application.applicationDescription || "No description available"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground" title={`${application.applicationInputs?.length || 0} input(s)`}>
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">
                {application.applicationInputs?.length || 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground" title={`${application.applicationOutputs?.length || 0} output(s)`}>
              <Upload className="h-4 w-4" />
              <span className="text-sm font-medium">
                {application.applicationOutputs?.length || 0}
              </span>
            </div>
          </div>
          <Button asChild>
            <Link href={`/experiments/create?appId=${application.applicationInterfaceId}`}>
              Create Experiment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
