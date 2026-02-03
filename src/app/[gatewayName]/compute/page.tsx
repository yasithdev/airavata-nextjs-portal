"use client";

import { useState } from "react";
import Link from "next/link";
import { Cpu, Plus, Globe, Users, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import * as Table from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { computeResourcesApi } from "@/lib/api/compute-resources";
import { useGateway } from "@/contexts/GatewayContext";
import { ComputeResourceModal } from "@/components/compute/ComputeResourceModal";
import { toast } from "@/hooks/useToast";

export default function ComputeResourcesPage() {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: computeResources = {}, isLoading } = useQuery({
    queryKey: ["computeResources", gatewayId],
    queryFn: () => computeResourcesApi.list(),
  });

  const filteredResources = Object.entries(computeResources).filter(([id, name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compute</h1>
            <p className="text-muted-foreground">
              Manage compute resources and clusters
            </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      <SearchBar
        placeholder="Search compute resources..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <div className="border rounded-lg">
        <Table.Table>
          <Table.TableHeader>
            <Table.TableRow>
              <Table.TableHead>Name</Table.TableHead>
              <Table.TableHead>Type</Table.TableHead>
              <Table.TableHead>Scope</Table.TableHead>
              <Table.TableHead>Status</Table.TableHead>
            </Table.TableRow>
          </Table.TableHeader>
          <Table.TableBody>
            {isLoading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <Table.TableRow key={i}>
                    <Table.TableCell><Skeleton className="h-4 w-32" /></Table.TableCell>
                    <Table.TableCell><Skeleton className="h-4 w-12" /></Table.TableCell>
                    <Table.TableCell><Skeleton className="h-4 w-16" /></Table.TableCell>
                    <Table.TableCell><Skeleton className="h-4 w-20" /></Table.TableCell>
                  </Table.TableRow>
                ))}
              </>
            ) : filteredResources.length === 0 ? (
              <Table.TableRow>
                <Table.TableCell colSpan={4} className="text-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <Cpu className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? "No compute resources found" : "No compute resources configured"}
                    </p>
                  </div>
                </Table.TableCell>
              </Table.TableRow>
            ) : (
              filteredResources.map(([id, name]) => (
                <ComputeResourceTableRow
                  key={id}
                  resourceId={id}
                  name={name}
                  gatewayId={gatewayId}
                />
              ))
            )}
          </Table.TableBody>
        </Table.Table>
      </div>

      {/* Add Compute Resource Modal */}
      <ComputeResourceModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}

// Compute Resource Table Row with hierarchy checking
function ComputeResourceTableRow({ resourceId, name, gatewayId }: { resourceId: string; name: string; gatewayId: string }) {
  const { data: resource, isLoading: resourceLoading } = useQuery({
    queryKey: ["compute-resources", resourceId],
    queryFn: () => computeResourcesApi.get(resourceId),
    enabled: !!resourceId,
  });
  const { data: hierarchy, isLoading: hierarchyLoading } = useQuery({
    queryKey: ["computeResourceHierarchy", resourceId, gatewayId],
    queryFn: () => computeResourcesApi.getHierarchy(resourceId, gatewayId),
    enabled: !!gatewayId && !!resourceId,
  });

  const copyResourceId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(resourceId);
    toast({ title: "Copied", description: "Resource ID copied to clipboard." });
  };

  const resourceTypeLabel = resource?.resourceType ?? "PLAIN";

  return (
    <Table.TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => window.location.href = `/${gatewayId}/compute/${resourceId}`}>
      <Table.TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span>{name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-70 hover:opacity-100"
            onClick={copyResourceId}
            title={`Copy ${resourceId}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Table.TableCell>
      <Table.TableCell>
        {resourceLoading ? (
          <Skeleton className="h-5 w-14" />
        ) : (
          <Badge variant="outline">{resourceTypeLabel}</Badge>
        )}
      </Table.TableCell>
      <Table.TableCell>
        {hierarchyLoading ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          <Badge variant="outline" className="text-xs">
            {hierarchy?.level === "GATEWAY" ? (
              <Globe className="h-3 w-3 mr-1 inline" />
            ) : hierarchy?.level === "GROUP" ? (
              <Users className="h-3 w-3 mr-1 inline" />
            ) : null}
            {hierarchy?.level === "GATEWAY" ? "GATEWAY" : hierarchy?.level === "GROUP" ? "DELEGATED" : "USER"}
          </Badge>
        )}
      </Table.TableCell>
      <Table.TableCell>
        <Badge variant="secondary">Active</Badge>
      </Table.TableCell>
    </Table.TableRow>
  );
}
