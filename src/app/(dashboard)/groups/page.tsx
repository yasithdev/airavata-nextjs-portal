"use client";

import { useState, useMemo } from "react";
import { Plus, Key, Server, Database, Filter, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGroups, useCreateGroup } from "@/hooks/useGroups";
import { useResourceAccess } from "@/hooks/useResourceAccess";
import { toast } from "@/hooks/useToast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGateway } from "@/contexts/GatewayContext";
import { PreferenceLevel, PreferenceResourceType } from "@/types";
import { cn } from "@/lib/utils";
import { computeResourcesApi, storageResourcesApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function SharingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
  const userId = session?.user?.email || "admin";
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  
  const { data: groups, isLoading: isLoadingGroups } = useGroups();
  const createGroup = useCreateGroup();
  const { useAccessGrantsByOwner } = useResourceAccess();

  // Get all groups owned by the user
  const userGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter(g => g.ownerId === userId);
  }, [groups, userId]);

  // Get all access grants where user is owner (direct sharing)
  const { data: userAccessGrants, isLoading: isLoadingUserGrants } = useAccessGrantsByOwner(
    userId,
    PreferenceLevel.USER
  );

  // Get all access grants for each group owned by user
  const groupGrantsQueries = useQuery({
    queryKey: ['groupAccessGrants', userGroups.map(g => g.id)],
    queryFn: async () => {
      const { resourceAccessApi } = await import('@/lib/api/resource-access');
      const allGrants: Array<{ groupId: string; grants: any[] }> = [];
      for (const group of userGroups) {
        try {
          const grants = await resourceAccessApi.getAccessGrantsByOwner(group.id, PreferenceLevel.GROUP);
          allGrants.push({ groupId: group.id, grants });
        } catch (err) {
          console.error(`Failed to fetch grants for group ${group.id}:`, err);
        }
      }
      return allGrants;
    },
    enabled: userGroups.length > 0,
  });

  // Fetch compute and storage resource names
  const { data: computeResourcesMap } = useQuery({
    queryKey: ["compute-resources"],
    queryFn: () => computeResourcesApi.list(),
  });

  const { data: storageResources } = useQuery({
    queryKey: ["storage-resources"],
    queryFn: () => storageResourcesApi.list(),
  });

  const storageResourcesMap = useMemo(() => {
    if (!storageResources) return {};
    if (Array.isArray(storageResources)) {
      return storageResources.reduce((acc, r) => {
        acc[r.storageResourceId] = r.hostName || r.storageResourceId;
        return acc;
      }, {} as Record<string, string>);
    }
    return storageResources as Record<string, string>;
  }, [storageResources]);

  // Combine all shared resources
  const allSharedResources = useMemo(() => {
    const resources: Array<{
      resourceType: PreferenceResourceType;
      resourceId: string;
      resourceName: string;
      sharingMethod: "direct" | "group";
      groupId?: string;
      groupName?: string;
      credentialToken?: string;
      enabled: boolean;
    }> = [];

    // Add direct shares
    if (userAccessGrants) {
      userAccessGrants.forEach(grant => {
        const resourceName = grant.resourceType === PreferenceResourceType.COMPUTE
          ? (computeResourcesMap?.[grant.resourceId] || grant.resourceId)
          : grant.resourceType === PreferenceResourceType.STORAGE
          ? (storageResourcesMap[grant.resourceId] || grant.resourceId)
          : grant.resourceId;
        
        resources.push({
          resourceType: grant.resourceType,
          resourceId: grant.resourceId,
          resourceName,
          sharingMethod: "direct",
          credentialToken: grant.credentialToken,
          enabled: grant.enabled,
        });
      });
    }

    // Add group shares
    if (groupGrantsQueries.data) {
      groupGrantsQueries.data.forEach(({ groupId, grants }) => {
        const group = userGroups.find(g => g.id === groupId);
        grants.forEach(grant => {
          const resourceName = grant.resourceType === PreferenceResourceType.COMPUTE
            ? (computeResourcesMap?.[grant.resourceId] || grant.resourceId)
            : grant.resourceType === PreferenceResourceType.STORAGE
            ? (storageResourcesMap[grant.resourceId] || grant.resourceId)
            : grant.resourceId;
          
          resources.push({
            resourceType: grant.resourceType,
            resourceId: grant.resourceId,
            resourceName,
            sharingMethod: "group",
            groupId: groupId,
            groupName: group?.name,
            credentialToken: grant.credentialToken,
            enabled: grant.enabled,
          });
        });
      });
    }

    return resources;
  }, [userAccessGrants, groupGrantsQueries.data, userGroups, computeResourcesMap, storageResourcesMap]);

  // Filter resources by selected group
  const filteredResources = useMemo(() => {
    if (selectedGroupFilter === "all") return allSharedResources;
    if (selectedGroupFilter === "direct") {
      return allSharedResources.filter(r => r.sharingMethod === "direct");
    }
    return allSharedResources.filter(r => r.groupId === selectedGroupFilter);
  }, [allSharedResources, selectedGroupFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Group name is required");
      return;
    }

    try {
      const result = await createGroup.mutateAsync({
        name: formData.name,
        description: formData.description,
        ownerId: userId,
        gatewayId,
      });
      toast({
        title: "Group created",
        description: "The group has been created successfully.",
      });
      setIsCreateOpen(false);
      setFormData({ name: "", description: "" });
      router.push(`/groups/${result.groupId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create group",
        variant: "destructive",
      });
    }
  };

  const isLoading = isLoadingGroups || isLoadingUserGrants || groupGrantsQueries.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sharing</h1>
          <p className="text-muted-foreground">
            View and manage resources you&apos;ve shared with others
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Group
        </Button>
      </div>

      {/* Filter by Group */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="group-filter" className="whitespace-nowrap">Filter by:</Label>
            <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
              <SelectTrigger id="group-filter" className="w-[250px]">
                <SelectValue placeholder="All shared resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All shared resources</SelectItem>
                <SelectItem value="direct">Direct sharing</SelectItem>
                {userGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedGroupFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGroupFilter("all")}
              >
                <X className="h-4 w-4 mr-1" />
                Clear filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shared Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Resources</CardTitle>
          <CardDescription>
            {selectedGroupFilter === "all" 
              ? `All resources you've shared (${filteredResources.length})`
              : selectedGroupFilter === "direct"
              ? `Resources shared directly (${filteredResources.length})`
              : `Resources shared via ${userGroups.find(g => g.id === selectedGroupFilter)?.name} (${filteredResources.length})`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : filteredResources.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              {selectedGroupFilter === "all"
                ? "You haven't shared any resources yet."
                : "No resources shared with this filter."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource Type</TableHead>
                  <TableHead>Resource Name</TableHead>
                  <TableHead>Sharing Method</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Credential</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.map((resource, idx) => (
                  <TableRow key={`${resource.resourceId}-${resource.sharingMethod}-${resource.groupId || 'direct'}-${idx}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {resource.resourceType === PreferenceResourceType.COMPUTE ? (
                          <Server className="h-4 w-4 text-muted-foreground" />
                        ) : resource.resourceType === PreferenceResourceType.STORAGE ? (
                          <Database className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Key className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Badge variant="outline">
                          {resource.resourceType === PreferenceResourceType.COMPUTE
                            ? "Compute"
                            : resource.resourceType === PreferenceResourceType.STORAGE
                            ? "Storage"
                            : resource.resourceType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{resource.resourceName}</TableCell>
                    <TableCell>
                      <Badge variant={resource.sharingMethod === "group" ? "default" : "secondary"}>
                        {resource.sharingMethod === "group" ? "Group" : "Direct"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {resource.groupName ? (
                        <Link
                          href={`/groups/${resource.groupId}`}
                          className="text-primary hover:underline"
                        >
                          {resource.groupName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {resource.credentialToken ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {resource.credentialToken.substring(0, 16)}...
                        </code>
                      ) : (
                        <span className="text-muted-foreground">No credential</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={resource.enabled ? "default" : "secondary"}>
                        {resource.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Groups Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Groups</CardTitle>
          <CardDescription>
            Groups are one way to share resources. Each group can have associated credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingGroups ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : userGroups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userGroups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {group.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {group.members?.length || 0} member(s)
                      </div>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/groups/${group.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No groups found. Create your first group to start sharing resources.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Create a new group to organize users and share resources. Groups can have associated credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name *</Label>
              <Input
                id="group-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter group name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter group description (optional)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={createGroup.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createGroup.isPending}>
                {createGroup.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
