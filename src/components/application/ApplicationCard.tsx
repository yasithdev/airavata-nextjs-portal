"use client";

import Link from "next/link";
import { AppWindow, ArrowRight, Download, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApplicationInterfaceDescription } from "@/types";
import { getApplicationPermalink } from "@/lib/permalink";
import { useCreateExperimentModal } from "@/contexts/CreateExperimentModalContext";

interface ApplicationCardProps {
  application: ApplicationInterfaceDescription;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const appPermalink = getApplicationPermalink(application.applicationInterfaceId);
  const { openModal } = useCreateExperimentModal();

  const handleCreateExperiment = (e: React.MouseEvent) => {
    e.preventDefault();
    openModal({ application });
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <Link href={appPermalink} className="block">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <AppWindow className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg hover:text-primary">{application.applicationName}</CardTitle>
                <CardDescription className="mt-1 line-clamp-2">
                  {application.applicationDescription || "No description available"}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary">Application</Badge>
          </div>
        </Link>
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
          <Button onClick={handleCreateExperiment}>
            Create Experiment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
