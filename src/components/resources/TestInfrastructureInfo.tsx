"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

export function TestInfrastructureInfo({ type }: { type: "compute" | "storage" }) {
  if (type === "compute") {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm">Test SLURM Cluster Available</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Use this for testing compute resource connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Host:</span>
            <code className="px-2 py-1 bg-white rounded">localhost</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">SSH Port:</span>
            <Badge variant="outline">10022</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">SLURM Port:</span>
            <Badge variant="outline">6817</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">User:</span>
            <code className="px-2 py-1 bg-white rounded">testuser</code>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-green-600" />
          <CardTitle className="text-sm">Test SFTP Server Available</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Use this for testing storage resource connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Host:</span>
          <code className="px-2 py-1 bg-white rounded">localhost</code>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">SFTP Port:</span>
          <Badge variant="outline">10023</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">User:</span>
          <code className="px-2 py-1 bg-white rounded">testuser</code>
        </div>
      </CardContent>
    </Card>
  );
}
