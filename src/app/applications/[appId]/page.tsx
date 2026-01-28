"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applications";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, ArrowRight, AppWindow } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApplicationInterface, useApplicationInputs, useApplicationOutputs } from "@/hooks";
import { useRouter } from "next/navigation";
import { NoPermissions } from "@/components/errors/NoPermissions";
import { NotFound } from "@/components/errors/NotFound";
import type { ApplicationInterfaceDescription } from "@/types";

export default function ApplicationPermalinkPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const appId = params.appId as string;

  const { data: application, isLoading: appLoading, error } = useQuery<ApplicationInterfaceDescription | null>({
    queryKey: ["application", appId],
    queryFn: async () => {
      try {
        return await applicationsApi.get(appId);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          return null;
        }
        if (err?.response?.status === 403 || err?.response?.status === 401) {
          throw new Error("NO_PERMISSIONS");
        }
        throw err;
      }
    },
    enabled: !!appId && !!session?.accessToken,
  });

  const { data: inputs, isLoading: inputsLoading } = useApplicationInputs(appId);
  const { data: outputs, isLoading: outputsLoading } = useApplicationOutputs(appId);

  if (appLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    if (error.message === "NO_PERMISSIONS") {
      return <NoPermissions resourceType="application" resourceId={appId} />;
    }
    return <NotFound resourceType="application" resourceId={appId} />;
  }

  if (!application) {
    return <NotFound resourceType="application" resourceId={appId} />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/catalog">
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
