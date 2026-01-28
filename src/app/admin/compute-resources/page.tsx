"use client";

import { useState } from "react";
import Link from "next/link";
import { Server, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { computeResourcesApi } from "@/lib/api/compute-resources";
import { toast } from "@/hooks/useToast";

export default function ComputeResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: computeResources = {}, isLoading } = useQuery({
    queryKey: ["computeResources"],
    queryFn: () => computeResourcesApi.list(),
  });

  const filteredResources = Object.entries(computeResources).filter(([id, name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compute Resources</h1>
          <p className="text-muted-foreground">
            Manage compute resources and HPC clusters
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Compute Resource
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search compute resources..."
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
            <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "No compute resources found" : "No compute resources configured"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map(([id, name]) => {
            // Truncate ID to show only first 8 characters
            const shortId = id.length > 8 ? `${id.substring(0, 8)}...` : id;
            return (
              <Link key={id} href={`/admin/compute-resources/${id}`}>
                <Card className="h-full transition-colors hover:bg-accent cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-muted-foreground" />
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
