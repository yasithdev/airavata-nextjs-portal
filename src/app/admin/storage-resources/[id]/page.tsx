"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { storageResourcesApi } from "@/lib/api/storage-resources";

export default function StorageResourceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: storageResources, isLoading } = useQuery({
    queryKey: ["storageResources"],
    queryFn: () => storageResourcesApi.list(),
  });

  // Handle both map and array formats
  const resourcesArray = Array.isArray(storageResources)
    ? storageResources
    : storageResources && typeof storageResources === "object"
    ? Object.entries(storageResources as Record<string, string>).map(([id, name]) => ({
        storageResourceId: id,
        hostName: name || id,
      }))
    : [];

  const resource = resourcesArray.find((r) => r.storageResourceId === id);
  const resourceName = resource?.hostName || id;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/storage-resources">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{resourceName}</h1>
          <p className="text-muted-foreground">Storage Resource Configuration</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Resource Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Resource ID</p>
              <p className="font-mono text-sm">{id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resource Name</p>
              <p className="font-medium">{resourceName}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
