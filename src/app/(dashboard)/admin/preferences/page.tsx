'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Loader2, Plus, Trash2, Save, Settings2, Server, Database, Lock, Unlock, Info } from 'lucide-react';
import { useGateway } from '@/contexts/GatewayContext';
import { preferencesApi } from '@/lib/api/preferences';
import { computeResourcesApi } from '@/lib/api/compute-resources';
import { storageResourcesApi } from '@/lib/api/storage-resources';
import {
  PreferenceLevel,
  PreferenceResourceType,
  ComputePreferenceKeys,
  StoragePreferenceKeys,
} from '@/types';
import { useToast } from '@/hooks/useToast';

export default function PreferencesPage() {
  const { selectedGatewayId, effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId || '';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedLevel, setSelectedLevel] = useState<PreferenceLevel>(PreferenceLevel.GATEWAY);
  const [selectedResourceType, setSelectedResourceType] = useState<PreferenceResourceType>(
    PreferenceResourceType.COMPUTE
  );
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newEnforced, setNewEnforced] = useState(false);

  // Fetch compute resources (returns map of id -> name)
  const { data: computeResourcesMap = {}, isLoading: loadingCompute } = useQuery({
    queryKey: ['computeResources'],
    queryFn: () => computeResourcesApi.list(),
  });

  // Fetch storage resources (backend returns Map<String, String> = id -> name)
  const { data: storageResourcesMap = {}, isLoading: loadingStorage } = useQuery({
    queryKey: ['storageResources'],
    queryFn: () => storageResourcesApi.list(),
  });
  
  // Convert compute map to array
  const computeResources = Object.entries(computeResourcesMap).map(([id, name]) => ({
    computeResourceId: id,
    hostName: name,
  }));
  
  // Convert storage resources map to array format (same as compute resources)
  const storageResources = Array.isArray(storageResourcesMap)
    ? storageResourcesMap
    : storageResourcesMap && typeof storageResourcesMap === 'object' && storageResourcesMap !== null
    ? Object.entries(storageResourcesMap as Record<string, string>).map(([id, name]) => ({
        storageResourceId: id,
        hostName: name || id,
      }))
    : [];

  // Get current owner ID based on level
  const getOwnerId = () => {
    switch (selectedLevel) {
      case PreferenceLevel.GATEWAY:
        return gatewayId;
      case PreferenceLevel.GROUP:
        return gatewayId; // Would need group selector
      case PreferenceLevel.USER:
        return gatewayId; // Would need user selector
      default:
        return gatewayId;
    }
  };

  // Fetch preferences for selected resource (detailed to include enforced status)
  const { data: preferences = [], isLoading: loadingPrefs, refetch: refetchPrefs } = useQuery({
    queryKey: ['preferences', selectedLevel, selectedResourceType, selectedResourceId, getOwnerId()],
    queryFn: () =>
      preferencesApi.getPreferencesAtLevelDetailed(
        selectedResourceType,
        selectedResourceId,
        getOwnerId(),
        selectedLevel
      ),
    enabled: !!selectedResourceId && !!gatewayId,
  });

  // Set preference mutation
  const setPreferenceMutation = useMutation({
    mutationFn: (params: { key: string; value: string; enforced?: boolean }) =>
      preferencesApi.setPreference({
        resourceType: selectedResourceType,
        resourceId: selectedResourceId,
        ownerId: getOwnerId(),
        level: selectedLevel,
        key: params.key,
        value: params.value,
        enforced: params.enforced,
      }),
    onSuccess: () => {
      toast({ title: 'Preference saved', description: 'The preference has been updated.' });
      refetchPrefs();
      setNewKey('');
      setNewValue('');
      setNewEnforced(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save preference',
        variant: 'destructive',
      });
    },
  });

  // Toggle enforced status mutation
  const toggleEnforcedMutation = useMutation({
    mutationFn: (params: { key: string; value: string; enforced: boolean }) =>
      preferencesApi.setPreference({
        resourceType: selectedResourceType,
        resourceId: selectedResourceId,
        ownerId: getOwnerId(),
        level: selectedLevel,
        key: params.key,
        value: params.value,
        enforced: params.enforced,
      }),
    onSuccess: () => {
      toast({ title: 'Enforcement updated' });
      refetchPrefs();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update enforcement',
        variant: 'destructive',
      });
    },
  });

  // Delete preference mutation
  const deletePreferenceMutation = useMutation({
    mutationFn: (key: string) =>
      preferencesApi.deletePreference(
        selectedResourceType,
        selectedResourceId,
        getOwnerId(),
        selectedLevel,
        key
      ),
    onSuccess: () => {
      toast({ title: 'Preference deleted' });
      refetchPrefs();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete preference',
        variant: 'destructive',
      });
    },
  });

  const resources =
    selectedResourceType === PreferenceResourceType.COMPUTE ? computeResources : storageResources;
  const isLoadingResources =
    selectedResourceType === PreferenceResourceType.COMPUTE ? loadingCompute : loadingStorage;

  const preferenceKeyOptions =
    selectedResourceType === PreferenceResourceType.COMPUTE
      ? Object.values(ComputePreferenceKeys)
      : Object.values(StoragePreferenceKeys);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Manage multi-level preferences for compute and storage resources.
          By default, preferences cascade USER → GROUP → GATEWAY (most specific wins).
          Use the <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-amber-600" /> Enforce</span> option to lock a preference at a higher level, 
          preventing lower levels from overriding it (top-down enforcement).
        </p>
      </div>

      {/* Level and Resource Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configuration Scope
          </CardTitle>
          <CardDescription>
            Select the preference level and resource type to manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preference Level</Label>
              <Select
                value={selectedLevel}
                onValueChange={(v) => setSelectedLevel(v as PreferenceLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PreferenceLevel.GATEWAY}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Gateway</Badge>
                      <span className="text-muted-foreground text-xs">Base level</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={PreferenceLevel.GROUP}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Group</Badge>
                      <span className="text-muted-foreground text-xs">Overrides gateway</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={PreferenceLevel.USER}>
                    <div className="flex items-center gap-2">
                      <Badge>User</Badge>
                      <span className="text-muted-foreground text-xs">Highest priority</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resource Type</Label>
              <Tabs
                value={selectedResourceType}
                onValueChange={(v) => {
                  setSelectedResourceType(v as PreferenceResourceType);
                  setSelectedResourceId('');
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value={PreferenceResourceType.COMPUTE} className="gap-2">
                    <Server className="h-4 w-4" />
                    Compute
                  </TabsTrigger>
                  <TabsTrigger value={PreferenceResourceType.STORAGE} className="gap-2">
                    <Database className="h-4 w-4" />
                    Storage
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Resource</Label>
              <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a resource" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingResources ? (
                    <div className="p-2 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    resources.map((resource: any) => (
                      <SelectItem
                        key={
                          selectedResourceType === PreferenceResourceType.COMPUTE
                            ? resource.computeResourceId
                            : resource.storageResourceId
                        }
                        value={
                          selectedResourceType === PreferenceResourceType.COMPUTE
                            ? resource.computeResourceId
                            : resource.storageResourceId
                        }
                      >
                        {resource.hostName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Table */}
      {selectedResourceId && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedLevel} Preferences for{' '}
              {resources.find(
                (r: any) =>
                  (selectedResourceType === PreferenceResourceType.COMPUTE
                    ? r.computeResourceId
                    : r.storageResourceId) === selectedResourceId
              )?.hostName || selectedResourceId}
            </CardTitle>
            <CardDescription>
              Current preferences at the {selectedLevel.toLowerCase()} level
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPrefs ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="w-[120px]">
                        <div className="flex items-center gap-1">
                          Enforced
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>When enforced, this preference cannot be overridden by lower-level preferences (GROUP → USER).</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preferences.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No preferences set at this level
                        </TableCell>
                      </TableRow>
                    ) : (
                      preferences.map((pref) => (
                        <TableRow key={pref.key}>
                          <TableCell className="font-mono text-sm">{pref.key}</TableCell>
                          <TableCell>{pref.value}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={pref.enforced}
                                onCheckedChange={(checked) =>
                                  toggleEnforcedMutation.mutate({
                                    key: pref.key,
                                    value: pref.value,
                                    enforced: checked,
                                  })
                                }
                                disabled={toggleEnforcedMutation.isPending}
                              />
                              {pref.enforced ? (
                                <Lock className="h-4 w-4 text-amber-600" />
                              ) : (
                                <Unlock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePreferenceMutation.mutate(pref.key)}
                              disabled={deletePreferenceMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </TooltipProvider>

                {/* Add New Preference */}
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-medium mb-4">Add New Preference</h4>
                  <div className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px] space-y-2">
                      <Label>Key</Label>
                      <Select value={newKey} onValueChange={setNewKey}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select or type a key" />
                        </SelectTrigger>
                        <SelectContent>
                          {preferenceKeyOptions.map((key) => (
                            <SelectItem key={key} value={key}>
                              {key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[200px] space-y-2">
                      <Label>Value</Label>
                      <Input
                        placeholder="Enter value"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                      />
                    </div>
                    <TooltipProvider>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Enforce
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>When enforced, lower-level preferences (GROUP, USER) cannot override this value.</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <div className="flex items-center gap-2 h-10">
                        <Switch
                          checked={newEnforced}
                          onCheckedChange={setNewEnforced}
                        />
                        {newEnforced ? (
                          <Lock className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Unlock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    </TooltipProvider>
                    <Button
                      onClick={() => setPreferenceMutation.mutate({ key: newKey, value: newValue, enforced: newEnforced })}
                      disabled={!newKey || !newValue || setPreferenceMutation.isPending}
                    >
                      {setPreferenceMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Add
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
