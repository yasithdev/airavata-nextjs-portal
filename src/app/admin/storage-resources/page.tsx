"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { storageResourcesApi } from "@/lib/api/storage-resources";
import { toast } from "@/hooks/useToast";

export default function StorageResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredResources = resourcesArray.filter((resource) => {
    const id = resource.storageResourceId || "";
    const name = resource.hostName || "";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage Resources</h1>
          <p className="text-muted-foreground">
            Manage storage resources and file systems
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Storage Resource
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search storage resources..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "No storage resources found" : "No storage resources configured"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => {
            const id = resource.storageResourceId || "";
            const name = resource.hostName || id;
            // Truncate ID to show only first 8 characters
            const shortId = id.length > 8 ? `${id.substring(0, 8)}...` : id;
            return (
              <Link key={id} href={`/admin/storage-resources/${id}`}>
                <Card className="h-full transition-colors hover:bg-accent cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg line-clamp-1">{name}</CardTitle>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="font-mono text-xs">
                      {shortId}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
