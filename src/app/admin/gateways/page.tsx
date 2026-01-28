"use client";

import { Building2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { gatewaysApi } from "@/lib/api/gateways";
import { useState } from "react";

export default function GatewaysPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ["gateways"],
    queryFn: () => gatewaysApi.list(),
  });

  const filteredGateways = gateways.filter(
    (gateway) =>
      gateway.gatewayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gateway.gatewayId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gateways</h1>
          <p className="text-muted-foreground">
            Manage gateway configurations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Gateway
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search gateways..."
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
      ) : filteredGateways.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "No gateways found" : "No gateways configured"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGateways.map((gateway) => (
            <Card key={gateway.gatewayId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{gateway.gatewayName || gateway.gatewayId}</CardTitle>
                    <CardDescription className="mt-1 font-mono text-xs">
                      {gateway.gatewayId}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  Manage
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
