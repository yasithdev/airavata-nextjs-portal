"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, AppWindow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplicationInterface, useApplicationInputs, useApplicationOutputs } from "@/hooks";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;

  const { data: application, isLoading: appLoading } = useApplicationInterface(appId);
  const { data: inputs, isLoading: inputsLoading } = useApplicationInputs(appId);
  const { data: outputs, isLoading: outputsLoading } = useApplicationOutputs(appId);

  if (appLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold">Application not found</h2>
        <Button asChild className="mt-4">
          <Link href="/applications">Back to Applications</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/applications">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <AppWindow className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{application.applicationName}</h1>
              <p className="text-muted-foreground">{application.applicationDescription || "No description"}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => router.push(`/experiments/create?appId=${appId}`)}>
          Create Experiment
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inputs ({inputs?.length || 0})</CardTitle>
            <CardDescription>Required and optional input parameters</CardDescription>
          </CardHeader>
          <CardContent>
            {inputsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : inputs?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No inputs defined</p>
            ) : (
              <div className="space-y-3">
                {inputs?.map((input, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{input.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{input.type}</Badge>
                        {input.isRequired && <Badge variant="destructive">Required</Badge>}
                      </div>
                    </div>
                    {input.userFriendlyDescription && (
                      <p className="text-sm text-muted-foreground mt-1">{input.userFriendlyDescription}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outputs ({outputs?.length || 0})</CardTitle>
            <CardDescription>Expected output files and data</CardDescription>
          </CardHeader>
          <CardContent>
            {outputsLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : outputs?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No outputs defined</p>
            ) : (
              <div className="space-y-3">
                {outputs?.map((output, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{output.name}</p>
                      <Badge variant="outline">{output.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
