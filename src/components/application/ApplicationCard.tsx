"use client";

import Link from "next/link";
import { AppWindow, Play, Download, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApplicationInterfaceDescription } from "@/types";
import { useCreateExperimentModal } from "@/contexts/CreateExperimentModalContext";
import { useGateway } from "@/contexts/GatewayContext";
import { getApplicationPermalink } from "@/lib/permalink";
import { cn } from "@/lib/utils";

interface ApplicationCardProps {
  application: ApplicationInterfaceDescription;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const { openModal } = useCreateExperimentModal();
  // Link to catalog application detail page instead of gateway-scoped route
  const appPermalink = `/catalog/APPLICATION/${application.applicationInterfaceId}`;

  const handleCreateExperiment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openModal({ application });
  };

  return (
    <Link href={appPermalink} className="block">
      <Card className={cn("transition-shadow hover:shadow-md cursor-pointer h-full")}>
        <CardHeader>
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
              <Play className="mr-2 h-4 w-4" />
              Run
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
