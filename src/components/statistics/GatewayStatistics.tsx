"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Activity, Users, Server, Database, AppWindow, Building2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { statisticsApi, gatewaysApi } from "@/lib/api";
import { usePortalConfig } from "@/contexts/PortalConfigContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GatewayStatisticsProps {
  /** Gateway ID to show statistics for. If not provided, uses the session's gateway */
  gatewayId?: string;
  /** Whether to show the back button and gateway header (for standalone gateway view) */
  showGatewayHeader?: boolean;
  /** Back link URL when showing gateway header */
  backHref?: string;
}

export function GatewayStatistics({ 
  gatewayId: propGatewayId, 
  showGatewayHeader = false,
  backHref = "/admin/gateways" 
}: GatewayStatisticsProps) {
  const { data: session } = useSession();
  const { defaultGatewayId, appVersion } = usePortalConfig();
  const gatewayId = propGatewayId || session?.user?.gatewayId || defaultGatewayId;

  // Fetch gateway details if showing header
  const { data: gateway, isLoading: loadingGateway } = useQuery({
    queryKey: ["gateway", gatewayId],
    queryFn: () => gatewaysApi.get(gatewayId!),
    enabled: showGatewayHeader && !!gatewayId,
  });

  // Fetch experiment statistics from the new API
  const { data: expStats, isLoading: isLoadingExpStats } = useQuery({
    queryKey: ["experiment-statistics", gatewayId],
    queryFn: () => statisticsApi.getExperimentStatistics(gatewayId),
    enabled: !!gatewayId,
  });

  // Fetch system-wide statistics
  const { data: systemStats, isLoading: isLoadingSystemStats } = useQuery({
    queryKey: ["system-statistics", gatewayId],
    queryFn: () => statisticsApi.getSystemStatistics(gatewayId),
    enabled: !!gatewayId,
  });

  const totalExperiments = expStats?.total || 0;
  const completed = expStats?.byStatus?.["COMPLETED"] || 0;
  const failed = expStats?.byStatus?.["FAILED"] || 0;
  const successRate = totalExperiments > 0 ? ((completed / totalExperiments) * 100).toFixed(1) : "0";
  const uniqueUsers = expStats ? Object.keys(expStats.byUser || {}).length : 0;

  const isLoading = isLoadingExpStats || isLoadingSystemStats || (showGatewayHeader && loadingGateway);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // If showing gateway header and gateway not found
  if (showGatewayHeader && !gateway) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">Gateway not found</h2>
          <Button asChild className="mt-4">
            <Link href={backHref}>Back to Gateways</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - different based on context */}
      {showGatewayHeader ? (
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{gateway?.gatewayName || gateway?.gatewayId || gatewayId}</h1>
              <p className="text-muted-foreground">
                Statistics for gateway <span className="font-mono">{gatewayId}</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
          <p className="text-muted-foreground">
            View usage statistics and system overview
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Experiments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExperiments}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completed} completed, {failed} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Users with experiments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Resources</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(systemStats?.totalComputeResources || 0) + (systemStats?.totalStorageResources || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Compute + Storage resources</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="experiments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="experiments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Experiments by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {expStats?.byStatus && Object.keys(expStats.byStatus).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(expStats.byStatus)
                      .filter(([, count]) => (count as number) > 0)
                      .map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <Badge variant="secondary">{status}</Badge>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No experiments found</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Users</CardTitle>
              </CardHeader>
              <CardContent>
                {expStats?.byUser && Object.keys(expStats.byUser).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(expStats.byUser)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([user, count]) => (
                        <div key={user} className="flex items-center justify-between">
                          <span className="text-sm">{user}</span>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No user data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {expStats?.recent && expStats.recent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Experiments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expStats.recent.slice(0, 10).map((exp) => (
                      <TableRow key={exp.experimentId}>
                        <TableCell className="font-medium">{exp.experimentName}</TableCell>
                        <TableCell>{exp.userName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {exp.experimentStatus || "UNKNOWN"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {exp.creationTime
                            ? new Date(exp.creationTime).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {/* Airavata services status */}
          <Card>
            <CardHeader>
              <CardTitle>Airavata Services</CardTitle>
              <CardDescription>Status and versions of core services</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">API</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary shrink-0" title="Operational" />
                        <span className="text-sm">Operational</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">IAM</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary shrink-0" title="Operational" />
                        <span className="text-sm">Operational</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">State Store</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary shrink-0" title="Operational" />
                        <span className="text-sm">Operational</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Dashboard</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500 shrink-0" title="Running" />
                        <span className="text-sm">Running</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{appVersion || "0.1.0"}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gateways</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.totalGateways || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Compute Resources</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStats?.totalComputeResources || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Storage Resources</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStats?.totalStorageResources || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <AppWindow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.totalApplications || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
