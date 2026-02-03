"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, ArrowRight, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { gatewaysApi } from "@/lib/api/gateways";
import { useGateway } from "@/contexts/GatewayContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GatewayModal } from "@/components/gateways/GatewayModal";

export default function GatewaysPage() {
  const router = useRouter();
  const { needsFirstGateway, isLoading: gatewaysLoading } = useGateway();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ["gateways"],
    queryFn: () => gatewaysApi.list(),
  });

  useEffect(() => {
    if (!gatewaysLoading && needsFirstGateway) {
      router.replace("/onboarding/create-gateway");
    }
  }, [gatewaysLoading, needsFirstGateway, router]);

  const filteredGateways = gateways.filter(
    (gateway) =>
      gateway.gatewayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gateway.gatewayId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (needsFirstGateway) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gateways</h1>
            <p className="text-muted-foreground">
              Manage gateway configurations
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Gateway
        </Button>
      </div>

      <SearchBar
        placeholder="Search gateways..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <GatewayModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredGateways.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No gateways available</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm ? "No gateways found" : "Create your first gateway to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGateways.map((gateway) => (
            <GatewayCard key={gateway.gatewayId} gateway={gateway} />
          ))}
        </div>
      )}
    </div>
  );
}

// Gateway Card Component (similar to ApplicationCard)
// Links to the gateway's statistics page for a consistent view
function GatewayCard({ gateway }: { gateway: { gatewayId: string; gatewayName?: string; gatewayDescription?: string } }) {
  return (
    <Link href={`/${gateway.gatewayId}/admin/statistics`} className="block">
      <Card className={cn("transition-shadow hover:shadow-md cursor-pointer h-full")}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg hover:text-primary">{gateway.gatewayName || gateway.gatewayId}</CardTitle>
                <CardDescription className="mt-1 line-clamp-2">
                  {gateway.gatewayDescription || gateway.gatewayId || "No description available"}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary">Gateway</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-muted-foreground" title="Gateway ID">
                <Server className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {gateway.gatewayId.length > 12 ? `${gateway.gatewayId.substring(0, 12)}...` : gateway.gatewayId}
                </span>
              </div>
            </div>
            <Button>
              View Statistics
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
