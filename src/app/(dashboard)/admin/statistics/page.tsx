"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Activity, Clock, Users, Server, Database, AppWindow } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { statisticsApi, experimentsApi, gatewaysApi, computeResourcesApi, storageResourcesApi, applicationsApi } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StatisticsPage() {
  const { data: session } = useSession();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID;

  // Fetch experiment statistics
  const { data: expStats, isLoading: isLoadingExpStats } = useQuery({
    queryKey: ["experiment-statistics", gatewayId],
    queryFn: async () => {
      try {
        return await statisticsApi.aggregateStatistics(gatewayId);
      } catch (error) {
        // If aggregation fails, return empty stats
        console.error("Failed to aggregate statistics:", error);
        return {
          total: 0,
          byStatus: {},
          byGateway: {},
          byUser: {},
          recent: [],
        };
      }
    },
    enabled: !!gatewayId,
  });

  // Fetch system-wide statistics
  const { data: experiments } = useQuery({
    queryKey: ["experiments", gatewayId],
    queryFn: () => experimentsApi.list({ gatewayId: gatewayId! }),
    enabled: !!gatewayId,
  });

  const { data: gateways } = useQuery({
    queryKey: ["gateways"],
    queryFn: () => gatewaysApi.list(),
  });

  const { data: computeResources } = useQuery({
    queryKey: ["compute-resources"],
    queryFn: () => computeResourcesApi.list(),
  });

  const { data: storageResources } = useQuery({
    queryKey: ["storage-resources"],
    queryFn: () => storageResourcesApi.list(),
  });

  const { data: applications } = useQuery({
    queryKey: ["application-interfaces", gatewayId],
    queryFn: () => applicationsApi.listInterfaces(gatewayId),
    enabled: !!gatewayId,
  });

  const totalExperiments = expStats?.total || experiments?.length || 0;
  const completed = expStats?.byStatus?.["COMPLETED"] || 0;
  const failed = expStats?.byStatus?.["FAILED"] || 0;
  const successRate = totalExperiments > 0 ? ((completed / totalExperiments) * 100).toFixed(1) : "0";
  const uniqueUsers = expStats ? Object.keys(expStats.byUser || {}).length : 0;

  if (isLoadingExpStats) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground">
          View usage statistics and system overview
        </p>
      </div>

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
                  {((computeResources && Object.keys(computeResources).length) || 0) + 
                   ((storageResources && Array.isArray(storageResources) ? storageResources.length : 0))}
                </div>
                <p className="text-xs text-muted-foreground">Compute + Storage resources</p>
              </CardContent>
            </Card>
      </div>

      <Tabs defaultValue="experiments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="system">System Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="experiments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Experiments by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {expStats?.byStatus ? (
                  <div className="space-y-2">
                    {Object.entries(expStats.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <Badge variant="secondary">{status}</Badge>
                        <span className="font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Users</CardTitle>
              </CardHeader>
              <CardContent>
                {expStats?.byUser ? (
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
                  <p className="text-muted-foreground">No data available</p>
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
                            {exp.experimentStatus?.[0]?.state || "UNKNOWN"}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gateways</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gateways?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Compute Resources</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {computeResources ? Object.keys(computeResources).length : 0}
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
                  {storageResources && Array.isArray(storageResources) ? storageResources.length : 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <AppWindow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{applications?.length || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
