"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { userProfilesApi, computeResourcesApi, storageResourcesApi } from "@/lib/api";
import Link from "next/link";

export default function UserResourceProfileDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const userId = params.userId as string;
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["user-resource-profile", userId, gatewayId],
    queryFn: () => userProfilesApi.get(userId, gatewayId),
    enabled: !!userId && !!gatewayId,
  });

  const { data: computeResources } = useQuery({
    queryKey: ["compute-resources"],
    queryFn: () => computeResourcesApi.list(),
  });

  const { data: storageResources } = useQuery({
    queryKey: ["storage-resources"],
    queryFn: () => storageResourcesApi.list(),
  });

  if (isLoadingProfile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/resource-profiles">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">User Resource Profile</h1>
        </div>
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Profile not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/resource-profiles">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">User Resource Profile</h1>
          <p className="text-muted-foreground">User: {profile.userId} | Gateway: {profile.gatewayID}</p>
        </div>
      </div>

      <Tabs defaultValue="compute" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compute">Compute Preferences</TabsTrigger>
          <TabsTrigger value="storage">Storage Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="compute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compute Resource Preferences</CardTitle>
              <CardDescription>
                Configure compute resource preferences for this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.userComputeResourcePreferences && profile.userComputeResourcePreferences.length > 0 ? (
                <div className="space-y-4">
                  {profile.userComputeResourcePreferences.map((pref, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Compute Resource</p>
                            <p className="font-medium">{pref.computeResourceId}</p>
                          </div>
                          {pref.loginUserName && (
                            <div>
                              <p className="text-sm text-muted-foreground">Login Username</p>
                              <p className="font-medium">{pref.loginUserName}</p>
                            </div>
                          )}
                          {pref.preferredBatchQueue && (
                            <div>
                              <p className="text-sm text-muted-foreground">Preferred Queue</p>
                              <p className="font-medium">{pref.preferredBatchQueue}</p>
                            </div>
                          )}
                          {pref.scratchLocation && (
                            <div>
                              <p className="text-sm text-muted-foreground">Scratch Location</p>
                              <p className="font-medium">{pref.scratchLocation}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No compute preferences configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Preferences</CardTitle>
              <CardDescription>
                Configure storage preferences for this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.userStoragePreferences && profile.userStoragePreferences.length > 0 ? (
                <div className="space-y-4">
                  {profile.userStoragePreferences.map((pref, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Storage Resource</p>
                            <p className="font-medium">{pref.storageResourceId}</p>
                          </div>
                          {pref.loginUserName && (
                            <div>
                              <p className="text-sm text-muted-foreground">Login Username</p>
                              <p className="font-medium">{pref.loginUserName}</p>
                            </div>
                          )}
                          {pref.fileSystemRootLocation && (
                            <div>
                              <p className="text-sm text-muted-foreground">File System Root</p>
                              <p className="font-medium">{pref.fileSystemRootLocation}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No storage preferences configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
