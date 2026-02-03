'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Key, Server, Database, Shield } from 'lucide-react';
import { useGateway } from '@/contexts/GatewayContext';
import { resourceAccessApi } from '@/lib/api/resource-access';
import { computeResourcesApi } from '@/lib/api/compute-resources';
import { storageResourcesApi } from '@/lib/api/storage-resources';
import { credentialsApi } from '@/lib/api/credentials';
import { groupsApi } from '@/lib/api/groups';
import {
  PreferenceLevel,
  PreferenceResourceType,
  ResourceAccess,
  AccessGrantRequest,
} from '@/types';
import { useToast } from '@/hooks/useToast';

export default function ResourceAccessPage() {
  const { effectiveGatewayId, accessibleGateways } = useGateway();
  const gatewayId = effectiveGatewayId || '';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'compute' | 'storage'>('compute');
  const [newGrant, setNewGrant] = useState<Partial<AccessGrantRequest>>({
    ownerType: PreferenceLevel.GATEWAY,
    enabled: true,
    resourceType: PreferenceResourceType.COMPUTE,
  });
  const [newGrantLoginUsername, setNewGrantLoginUsername] = useState('');

  // Get accessible gateway IDs
  const accessibleGatewayIds = useMemo(() => {
    return accessibleGateways.map(g => g.gatewayId);
  }, [accessibleGateways]);

  // Fetch groups for all accessible gateways
  const groupsQueries = useQuery({
    queryKey: ['groups', 'all', accessibleGatewayIds],
    queryFn: async () => {
      const allGroupsPromises = accessibleGatewayIds.map(async (gwId) => {
        try {
          const groups = await groupsApi.list(gwId);
          return groups.map(g => ({ ...g, gatewayId: gwId }));
        } catch (err) {
          console.warn(`Failed to fetch groups for gateway ${gwId}:`, err);
          return [];
        }
      });
      const allGroupsArrays = await Promise.all(allGroupsPromises);
      return allGroupsArrays.flat();
    },
    enabled: accessibleGatewayIds.length > 0,
  });

  // Filter groups by accessible gateway IDs (already done in query, but keep for safety)
  const accessibleGroups = useMemo(() => {
    if (!groupsQueries.data) return [];
    return groupsQueries.data.filter(g => accessibleGatewayIds.includes(g.gatewayId));
  }, [groupsQueries.data, accessibleGatewayIds]);

  // Fetch compute resources (returns map of id -> name)
  const { data: computeResourcesMap = {}, isLoading: loadingCompute } = useQuery({
    queryKey: ['computeResources'],
    queryFn: () => computeResourcesApi.list(),
  });

  // Fetch storage resources (returns map of id -> name, same as compute)
  const { data: storageResourcesMap = {}, isLoading: loadingStorage } = useQuery({
    queryKey: ['storageResources'],
    queryFn: () => storageResourcesApi.list(),
  });
  
  // Convert compute map to array
  const computeResources = Object.entries(computeResourcesMap).map(([id, name]) => ({
    computeResourceId: id,
    hostName: name,
  }));
  
  // Convert storage map to array (same format as compute resources from backend)
  const storageResources = Array.isArray(storageResourcesMap) 
    ? storageResourcesMap.map((r: any) => ({ storageResourceId: r.storageResourceId, hostName: r.hostName }))
    : Object.entries(storageResourcesMap).map(([id, name]) => ({
        storageResourceId: id,
        hostName: name,
      }));

  // Fetch credentials for dropdown
  const { data: credentials = [] } = useQuery({
    queryKey: ['credentials', gatewayId],
    queryFn: () => credentialsApi.list(gatewayId),
    enabled: !!gatewayId,
  });

  // Fetch all access grants for compute resources
  const computeGrantsQuery = useQuery({
    queryKey: ['resourceAccess', 'compute', 'all', gatewayId],
    queryFn: () => resourceAccessApi.getAccessGrantsByType(gatewayId, PreferenceResourceType.COMPUTE),
    enabled: !!gatewayId,
  });

  // Fetch all access grants for storage resources
  const storageGrantsQuery = useQuery({
    queryKey: ['resourceAccess', 'storage', 'all', gatewayId],
    queryFn: () => resourceAccessApi.getAccessGrantsByType(gatewayId, PreferenceResourceType.STORAGE),
    enabled: !!gatewayId,
  });

  // Create access grant mutation
  const createGrantMutation = useMutation({
    mutationFn: (request: AccessGrantRequest) => resourceAccessApi.createAccessGrant(request),
    onSuccess: () => {
      toast({ title: 'Access grant created' });
      queryClient.invalidateQueries({ queryKey: ['resourceAccess'] });
      setIsAddDialogOpen(false);
      setActiveTab('compute');
      setNewGrant({ 
        ownerType: PreferenceLevel.GATEWAY, 
        enabled: true,
        resourceType: PreferenceResourceType.COMPUTE,
      });
      setNewGrantLoginUsername('');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create access grant';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Toggle access grant mutation
  const toggleGrantMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      resourceAccessApi.setAccessGrantEnabled(id, enabled),
    onSuccess: () => {
      toast({ title: 'Access grant updated' });
      queryClient.invalidateQueries({ queryKey: ['resourceAccess'] });
    },
  });

  // Delete access grant mutation
  const deleteGrantMutation = useMutation({
    mutationFn: (id: number) => resourceAccessApi.deleteAccessGrant(id),
    onSuccess: () => {
      toast({ title: 'Access grant deleted' });
      queryClient.invalidateQueries({ queryKey: ['resourceAccess'] });
    },
  });

  // Update credential mutation
  const updateCredentialMutation = useMutation({
    mutationFn: ({ id, credentialToken }: { id: number; credentialToken: string }) =>
      resourceAccessApi.setAccessGrantCredential(id, credentialToken),
    onSuccess: () => {
      toast({ title: 'Credential updated' });
      queryClient.invalidateQueries({ queryKey: ['resourceAccess'] });
    },
  });

  const getLevelBadge = (level: PreferenceLevel) => {
    switch (level) {
      case PreferenceLevel.GATEWAY:
        return <Badge variant="outline">Gateway</Badge>;
      case PreferenceLevel.GROUP:
        return <Badge variant="secondary">Group</Badge>;
      case PreferenceLevel.USER:
        return <Badge>User</Badge>;
    }
  };

  const handleCreateGrant = () => {
    if (!newGrant.resourceId || !newGrant.ownerType || !newGrant.resourceType) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!newGrant.credentialToken || newGrant.credentialToken.trim() === '') {
      toast({
        title: 'Error',
        description: 'Please select a credential. Credential is required for access grants.',
        variant: 'destructive',
      });
      return;
    }

    const ownerId =
      newGrant.ownerType === PreferenceLevel.GATEWAY
        ? gatewayId
        : newGrant.ownerId || '';

    if (newGrant.ownerType !== PreferenceLevel.GATEWAY && !ownerId) {
      toast({
        title: 'Error',
        description: `Please ${newGrant.ownerType === PreferenceLevel.GROUP ? 'select' : 'enter'} a ${newGrant.ownerType === PreferenceLevel.GROUP ? 'group' : 'user'} ID`,
        variant: 'destructive',
      });
      return;
    }

    // For group level, get the gateway ID from the selected group
    let effectiveGatewayId = gatewayId;
    if (newGrant.ownerType === PreferenceLevel.GROUP && ownerId) {
      const selectedGroup = accessibleGroups.find(g => g.id === ownerId);
      if (selectedGroup) {
        effectiveGatewayId = selectedGroup.gatewayId;
      }
    }

    createGrantMutation.mutate({
      resourceType: newGrant.resourceType,
      resourceId: newGrant.resourceId,
      ownerId,
      ownerType: newGrant.ownerType,
      gatewayId: effectiveGatewayId,
      credentialToken: newGrant.credentialToken,
      loginUsername: newGrantLoginUsername.trim() || undefined,
      enabled: newGrant.enabled ?? true,
    });
  };

  const getResourceName = (resourceId: string, resourceType: PreferenceResourceType): string => {
    if (resourceType === PreferenceResourceType.COMPUTE) {
      const resource = computeResources.find(r => r.computeResourceId === resourceId);
      return resource?.hostName || resourceId;
    } else {
      const resource = storageResources.find(r => r.storageResourceId === resourceId);
      return resource?.hostName || resourceId;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resource Access</h1>
          <p className="text-muted-foreground mt-2">
            Manage access grants that control which users and groups can access compute and storage
            resources. Access grants link resources to credentials at different levels.
          </p>
        </div>
        <Dialog 
          open={isAddDialogOpen} 
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              // Reset form when dialog closes
              setActiveTab('compute');
              setNewGrant({ 
                ownerType: PreferenceLevel.GATEWAY, 
                enabled: true,
                resourceType: PreferenceResourceType.COMPUTE,
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Access Grant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Access Grant</DialogTitle>
              <DialogDescription>
                Grant access to a resource at a specific level
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Tabs value={activeTab} onValueChange={(v) => {
                setActiveTab(v as 'compute' | 'storage');
                setNewGrant({ 
                  ...newGrant, 
                  resourceType: v === 'compute' ? PreferenceResourceType.COMPUTE : PreferenceResourceType.STORAGE,
                  resourceId: '' 
                });
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="compute" className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Compute Resource
                  </TabsTrigger>
                  <TabsTrigger value="storage" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Storage Resource
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="compute" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Compute Resource <span className="text-destructive">*</span></Label>
                    <Select
                      value={newGrant.resourceId || ''}
                      onValueChange={(v) => setNewGrant({ ...newGrant, resourceId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a compute resource" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCompute ? (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : (
                          computeResources.map((resource: { computeResourceId?: string; hostName: string }) => (
                            <SelectItem
                              key={resource.computeResourceId}
                              value={resource.computeResourceId!}
                            >
                              {resource.hostName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="storage" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Storage Resource <span className="text-destructive">*</span></Label>
                    <Select
                      value={newGrant.resourceId || ''}
                      onValueChange={(v) => setNewGrant({ ...newGrant, resourceId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a storage resource" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingStorage ? (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : (
                          storageResources.map((resource: { storageResourceId?: string; hostName: string }) => (
                            <SelectItem
                              key={resource.storageResourceId}
                              value={resource.storageResourceId!}
                            >
                              {resource.hostName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label>Login username (for this resource)</Label>
                <Input
                  placeholder="e.g. myuser"
                  value={newGrantLoginUsername}
                  onChange={(e) => setNewGrantLoginUsername(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">SSH/login username on the resource. Required for testing connection.</p>
              </div>
              <div className="space-y-2">
                <Label>Level <span className="text-destructive">*</span></Label>
                <Select
                  value={newGrant.ownerType}
                  onValueChange={(v) =>
                    setNewGrant({ ...newGrant, ownerType: v as PreferenceLevel })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PreferenceLevel.GATEWAY}>Gateway</SelectItem>
                    <SelectItem value={PreferenceLevel.GROUP}>Group</SelectItem>
                    <SelectItem value={PreferenceLevel.USER}>User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newGrant.ownerType !== PreferenceLevel.GATEWAY && (
                <div className="space-y-2">
                  <Label>
                    {newGrant.ownerType === PreferenceLevel.GROUP ? 'Group' : 'User ID'} <span className="text-destructive">*</span>
                  </Label>
                  {newGrant.ownerType === PreferenceLevel.GROUP ? (
                    <Select
                      value={newGrant.ownerId || ''}
                      onValueChange={(v) => setNewGrant({ ...newGrant, ownerId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groupsQueries.isLoading ? (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : accessibleGroups.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No groups available in your accessible gateways
                          </div>
                        ) : (
                          accessibleGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3" />
                                <span>{group.name}</span>
                                <Badge variant="outline" className="ml-auto text-xs">
                                  {group.gatewayId}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={newGrant.ownerId || session?.user?.userName || ''}
                      onChange={(e) => setNewGrant({ ...newGrant, ownerId: e.target.value })}
                      placeholder="Enter user ID (e.g., username@gatewayId)"
                    />
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Credential <span className="text-destructive">*</span></Label>
                <Select
                  value={newGrant.credentialToken || ''}
                  onValueChange={(v) => setNewGrant({ ...newGrant, credentialToken: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a credential (required)" />
                  </SelectTrigger>
                  <SelectContent>
                    {credentials.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No credentials available. Please create a credential first.
                      </div>
                    ) : (
                      credentials.map((cred: { token: string; username?: string | null; description?: string; name?: string }) => (
                        <SelectItem key={cred.token} value={cred.token}>
                          <div className="flex items-center gap-2">
                            <Key className="h-3 w-3" />
                            {cred.name || cred.description || cred.username || cred.token.substring(0, 8)}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {credentials.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    You need to create at least one credential before adding an access grant.
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={newGrant.enabled ?? true}
                  onCheckedChange={(checked) => setNewGrant({ ...newGrant, enabled: checked })}
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateGrant} 
                disabled={createGrantMutation.isPending || credentials.length === 0 || !newGrant.resourceType || !newGrant.resourceId}
              >
                {createGrantMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Create Grant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Compute Resources Access Grants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Compute Resources Access Grants
          </CardTitle>
          <CardDescription>
            Access grants for compute resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {computeGrantsQuery.isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Credential</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computeGrantsQuery.data && computeGrantsQuery.data.length > 0 ? (
                  computeGrantsQuery.data.map((grant: ResourceAccess) => (
                    <TableRow key={grant.id}>
                      <TableCell className="font-medium">
                        {getResourceName(grant.resourceId, PreferenceResourceType.COMPUTE)}
                      </TableCell>
                      <TableCell>{getLevelBadge(grant.ownerType)}</TableCell>
                      <TableCell className="font-mono text-sm">{grant.ownerId}</TableCell>
                      <TableCell>
                        <Select
                          value={grant.credentialToken || ''}
                          onValueChange={(v) =>
                            updateCredentialMutation.mutate({
                              id: grant.id!,
                              credentialToken: v,
                            })
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="No credential" />
                          </SelectTrigger>
                          <SelectContent>
                            {credentials.map((cred: { token: string; username?: string | null; name?: string; description?: string }) => (
                              <SelectItem key={cred.token} value={cred.token}>
                                {cred.name || cred.description || cred.username || cred.token.substring(0, 8)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={grant.enabled}
                          onCheckedChange={(checked) =>
                            toggleGrantMutation.mutate({ id: grant.id!, enabled: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGrantMutation.mutate(grant.id!)}
                          disabled={deleteGrantMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No access grants configured for compute resources
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Storage Resources Access Grants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Resources Access Grants
          </CardTitle>
          <CardDescription>
            Access grants for storage resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {storageGrantsQuery.isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Credential</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storageGrantsQuery.data && storageGrantsQuery.data.length > 0 ? (
                  storageGrantsQuery.data.map((grant: ResourceAccess) => (
                    <TableRow key={grant.id}>
                      <TableCell className="font-medium">
                        {getResourceName(grant.resourceId, PreferenceResourceType.STORAGE)}
                      </TableCell>
                      <TableCell>{getLevelBadge(grant.ownerType)}</TableCell>
                      <TableCell className="font-mono text-sm">{grant.ownerId}</TableCell>
                      <TableCell>
                        <Select
                          value={grant.credentialToken || ''}
                          onValueChange={(v) =>
                            updateCredentialMutation.mutate({
                              id: grant.id!,
                              credentialToken: v,
                            })
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="No credential" />
                          </SelectTrigger>
                          <SelectContent>
                            {credentials.map((cred: { token: string; username?: string | null; name?: string; description?: string }) => (
                              <SelectItem key={cred.token} value={cred.token}>
                                {cred.name || cred.description || cred.username || cred.token.substring(0, 8)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={grant.enabled}
                          onCheckedChange={(checked) =>
                            toggleGrantMutation.mutate({ id: grant.id!, enabled: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGrantMutation.mutate(grant.id!)}
                          disabled={deleteGrantMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No access grants configured for storage resources
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
