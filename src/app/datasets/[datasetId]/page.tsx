"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "@/lib/api/catalog";
import { ResourceDetail } from "@/components/catalog/ResourceDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NoPermissions } from "@/components/errors/NoPermissions";
import { NotFound } from "@/components/errors/NotFound";
import type { CatalogResource } from "@/types/catalog";
import { ResourceType } from "@/types/catalog";

export default function DatasetPermalinkPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const datasetId = params.datasetId as string;

  const { data: resource, isLoading, error } = useQuery<CatalogResource | null>({
    queryKey: ["catalog-resource", datasetId],
    queryFn: async () => {
      try {
        const resource = await catalogApi.get(datasetId);
        // Verify it's a dataset
        if (resource.type !== ResourceType.DATASET) {
          return null;
        }
        return resource;
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
    enabled: !!datasetId && !!session?.accessToken,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    if (error.message === "NO_PERMISSIONS") {
      return <NoPermissions resourceType="dataset" resourceId={datasetId} />;
    }
    return <NotFound resourceType="dataset" resourceId={datasetId} />;
  }

  if (!resource) {
    return <NotFound resourceType="dataset" resourceId={datasetId} />;
  }

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" size="icon" asChild>
        <Link href="/catalog">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <ResourceDetail resource={resource} />
    </div>
  );
}
