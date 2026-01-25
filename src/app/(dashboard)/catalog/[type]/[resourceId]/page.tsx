"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceDetail } from "@/components/catalog/ResourceDetail";
import { useCatalogResource } from "@/hooks";

export default function ResourceDetailPage() {
  const params = useParams();
  const resourceId = params.resourceId as string;

  const { data: resource, isLoading } = useCatalogResource(resourceId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold">Resource not found</h2>
        <Button asChild className="mt-4">
          <Link href="/catalog">Back to Catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="icon" asChild>
        <Link href="/catalog">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>

      <ResourceDetail resource={resource} />
    </div>
  );
}
