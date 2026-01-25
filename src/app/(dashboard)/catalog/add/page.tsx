"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogResourceForm } from "@/components/catalog/CatalogResourceForm";
import { useCreateResource } from "@/hooks";
import { toast } from "@/hooks/useToast";
import type { CatalogResource } from "@/types/catalog";

export default function AddCatalogResourcePage() {
  const router = useRouter();
  const createResource = useCreateResource();

  const handleSubmit = async (resource: Partial<CatalogResource>) => {
    try {
      const result = await createResource.mutateAsync(resource);
      toast({
        title: "Resource created",
        description: "Your catalog resource has been created successfully.",
      });
      router.push(`/catalog/${resource.type}/${result.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create resource",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/catalog">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Resource</h1>
          <p className="text-muted-foreground">
            Share your research resource with the community
          </p>
        </div>
      </div>

      <CatalogResourceForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/catalog")}
        isLoading={createResource.isPending}
      />
    </div>
  );
}
