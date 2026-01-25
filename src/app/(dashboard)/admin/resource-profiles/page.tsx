"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, User, Users, Trash2, MoreVertical, Server, HardDrive, Settings, Pencil, Key, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userProfilesApi } from "@/lib/api";
import { useGroupProfiles, useCreateGroupProfile, useUpdateGroupProfile, useDeleteGroupProfile } from "@/hooks/useGroupProfiles";
import { useCredentials } from "@/hooks/useCredentials";
import { toast } from "@/hooks/useToast";
import type { UserResourceProfile, GroupResourceProfile } from "@/types";

export default function ResourceProfilesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
  
  // User Profile States
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [editingUserProfile, setEditingUserProfile] = useState<UserResourceProfile | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [deletingUserProfile, setDeletingUserProfile] = useState<UserResourceProfile | null>(null);

  // Group Profile States
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupProfile, setEditingGroupProfile] = useState<GroupResourceProfile | null>(null);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [editGroupFormData, setEditGroupFormData] = useState({ name: "", credentialToken: "" });
  const [deletingGroupProfile, setDeletingGroupProfile] = useState<GroupResourceProfile | null>(null);

  // Queries
  const { data: userProfiles, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["user-resource-profiles"],
    queryFn: () => userProfilesApi.list(),
    retry: 1,
  });

  const { data: groupProfiles, isLoading: groupLoading, error: groupError } = useGroupProfiles();
  const { data: credentials } = useCredentials();

  // User Profile Mutations
  const createUserMutation = useMutation({
    mutationFn: (profile: Partial<UserResourceProfile>) => userProfilesApi.create(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-resource-profiles"] });
      toast({ title: "Profile created", description: "User resource profile has been created successfully." });
      setIsCreateUserOpen(false);
      setNewUserId("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create profile", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (profile: UserResourceProfile) => userProfilesApi.delete(profile.userId, profile.gatewayID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-resource-profiles"] });
      toast({ title: "Profile deleted", description: "User resource profile has been deleted successfully." });
      setDeletingUserProfile(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete profile", variant: "destructive" });
    },
  });

  // Group Profile Mutations
  const createGroupProfile = useCreateGroupProfile();
  const updateGroupProfile = useUpdateGroupProfile();
  const deleteGroupProfile = useDeleteGroupProfile();

  // User Profile Handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) {
      toast({ title: "Error", description: "User ID is required", variant: "destructive" });
      return;
    }
    createUserMutation.mutate({
      userId: newUserId,
      gatewayID: gatewayId,
      userComputeResourcePreferences: [],
      userStoragePreferences: [],
    });
  };

  const handleOpenEditUser = (profile: UserResourceProfile) => {
    setEditingUserProfile(profile);
    setIsEditUserOpen(true);
  };

  const handleDeleteUser = () => {
    if (!deletingUserProfile) return;
    deleteUserMutation.mutate(deletingUserProfile);
  };

  // Group Profile Handlers
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast({ title: "Error", description: "Profile name is required", variant: "destructive" });
      return;
    }
    try {
      await createGroupProfile.mutateAsync({
        gatewayId,
        groupResourceProfileName: newGroupName,
        computePreferences: [],
        computeResourcePolicies: [],
        batchQueueResourcePolicies: [],
      });
      toast({ title: "Profile created", description: "Group resource profile has been created successfully." });
      setIsCreateGroupOpen(false);
      setNewGroupName("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create profile";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleOpenEditGroup = (profile: GroupResourceProfile) => {
    setEditingGroupProfile(profile);
    setEditGroupFormData({
      name: profile.groupResourceProfileName || "",
      credentialToken: profile.defaultCredentialStoreToken || "",
    });
    setIsEditGroupOpen(true);
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroupProfile) return;
    if (!editGroupFormData.name.trim()) {
      toast({ title: "Error", description: "Profile name is required", variant: "destructive" });
      return;
    }
    try {
      await updateGroupProfile.mutateAsync({
        profileId: editingGroupProfile.groupResourceProfileId,
        profile: {
          ...editingGroupProfile,
          groupResourceProfileName: editGroupFormData.name,
          defaultCredentialStoreToken: editGroupFormData.credentialToken || undefined,
        },
      });
      toast({ title: "Profile updated", description: "Group resource profile has been updated successfully." });
      setIsEditGroupOpen(false);
      setEditingGroupProfile(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroupProfile) return;
    try {
      await deleteGroupProfile.mutateAsync(deletingGroupProfile.groupResourceProfileId);
      toast({ title: "Profile deleted", description: "Group resource profile has been deleted." });
      setDeletingGroupProfile(null);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to delete profile", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resource Profiles</h1>
        <p className="text-muted-foreground">
          Manage compute and storage resource preferences for users and groups
        </p>
      </div>

      <Tabs defaultValue="group" className="space-y-4">
        <TabsList>
          <TabsTrigger value="group" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Group Profiles
          </TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            User Profiles
          </TabsTrigger>
        </TabsList>

        {/* Group Profiles Tab */}
        <TabsContent value="group" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsCreateGroupOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Group Profile
            </Button>
          </div>

          {groupLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : groupError ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-destructive/50" />
                  <h3 className="mt-4 text-lg font-semibold text-destructive">Failed to load profiles</h3>
                  <p className="text-muted-foreground mt-2">
                    {groupError instanceof Error ? groupError.message : "An error occurred"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : !groupProfiles || groupProfiles.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No group resource profiles</h3>
                  <p className="text-muted-foreground mt-2">
                    Create a group resource profile to manage compute resources for groups
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupProfiles.map((profile) => (
                <Card 
                  key={profile.groupResourceProfileId}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOpenEditGroup(profile)}
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{profile.groupResourceProfileName}</CardTitle>
                        {profile.defaultCredentialStoreToken && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Key className="h-3 w-3" /> Credential configured
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEditGroup(profile); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                          <Link href={`/admin/resource-profiles/group/${profile.groupResourceProfileId}`}>
                            <Server className="h-4 w-4 mr-2" />
                            Configure Resources
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeletingGroupProfile(profile); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {profile.computePreferences?.length || 0} compute preference(s)
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* User Profiles Tab */}
        <TabsContent value="user" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsCreateUserOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New User Profile
            </Button>
          </div>

          {userLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : userError ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <User className="mx-auto h-12 w-12 text-destructive/50" />
                  <h3 className="mt-4 text-lg font-semibold text-destructive">Failed to load profiles</h3>
                  <p className="text-muted-foreground mt-2">
                    {userError instanceof Error ? userError.message : "An error occurred"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : !userProfiles || userProfiles.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No user resource profiles</h3>
                  <p className="text-muted-foreground mt-2">
                    Create a user resource profile to configure compute and storage preferences
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userProfiles.map((profile) => (
                <Card 
                  key={`${profile.userId}-${profile.gatewayID}`}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOpenEditUser(profile)}
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{profile.userId}</CardTitle>
                        <Badge variant="secondary" className="mt-1">{profile.gatewayID}</Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEditUser(profile); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          View/Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                          <Link href={`/admin/resource-profiles/user/${profile.userId}`}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure Resources
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeletingUserProfile(profile); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Server className="h-4 w-4" />
                        <span>{profile.userComputeResourcePreferences?.length || 0} compute</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-4 w-4" />
                        <span>{profile.userStoragePreferences?.length || 0} storage</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create User Profile Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User Resource Profile</DialogTitle>
            <DialogDescription>
              Create a new profile to configure compute and storage preferences for a user
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-id">User ID *</Label>
              <Input
                id="user-id"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="Enter user ID (e.g., user@example.com)"
              />
            </div>
            <div className="space-y-2">
              <Label>Gateway ID</Label>
              <Input value={gatewayId} disabled />
              <p className="text-xs text-muted-foreground">
                The profile will be created for the current gateway
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateUserOpen(false)} disabled={createUserMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View/Edit User Profile Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={(open) => { setIsEditUserOpen(open); if (!open) setEditingUserProfile(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Resource Profile</DialogTitle>
            <DialogDescription>
              View profile details. Use &quot;Configure Resources&quot; to manage compute and storage preferences.
            </DialogDescription>
          </DialogHeader>
          
          {editingUserProfile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="font-medium">{editingUserProfile.userId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gateway ID</Label>
                  <p className="font-medium">{editingUserProfile.gatewayID}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Compute Preferences</Label>
                {editingUserProfile.userComputeResourcePreferences && editingUserProfile.userComputeResourcePreferences.length > 0 ? (
                  <div className="space-y-2">
                    {editingUserProfile.userComputeResourcePreferences.map((pref, idx) => (
                      <div key={idx} className="p-2 bg-muted rounded text-sm">
                        <p className="font-medium">{pref.computeResourceId}</p>
                        {pref.loginUserName && <p className="text-muted-foreground">Login: {pref.loginUserName}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No compute preferences configured</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Storage Preferences</Label>
                {editingUserProfile.userStoragePreferences && editingUserProfile.userStoragePreferences.length > 0 ? (
                  <div className="space-y-2">
                    {editingUserProfile.userStoragePreferences.map((pref, idx) => (
                      <div key={idx} className="p-2 bg-muted rounded text-sm">
                        <p className="font-medium">{pref.storageResourceId}</p>
                        {pref.loginUserName && <p className="text-muted-foreground">Login: {pref.loginUserName}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No storage preferences configured</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsEditUserOpen(false); setEditingUserProfile(null); }}>
                  Close
                </Button>
                <Button asChild>
                  <Link href={`/admin/resource-profiles/user/${editingUserProfile.userId}`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Resources
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Group Profile Dialog */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group Resource Profile</DialogTitle>
            <DialogDescription>
              Create a new profile to manage compute resources for a group
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Profile Name *</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter profile name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateGroupOpen(false)} disabled={createGroupProfile.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createGroupProfile.isPending}>
                {createGroupProfile.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Group Profile Dialog */}
      <Dialog open={isEditGroupOpen} onOpenChange={(open) => { setIsEditGroupOpen(open); if (!open) setEditingGroupProfile(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group Resource Profile</DialogTitle>
            <DialogDescription>
              Update profile settings. Use &quot;Configure Resources&quot; for compute preferences.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-group-name">Profile Name *</Label>
              <Input
                id="edit-group-name"
                value={editGroupFormData.name}
                onChange={(e) => setEditGroupFormData({ ...editGroupFormData, name: e.target.value })}
                placeholder="Enter profile name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-credential">Default Credential</Label>
              <Select
                value={editGroupFormData.credentialToken || "none"}
                onValueChange={(value) => setEditGroupFormData({ ...editGroupFormData, credentialToken: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a credential (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {credentials?.map((cred) => (
                    <SelectItem key={cred.token} value={cred.token}>
                      {cred.username} ({cred.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Default credential used for compute resources in this profile
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setIsEditGroupOpen(false); setEditingGroupProfile(null); }} disabled={updateGroupProfile.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateGroupProfile.isPending}>
                {updateGroupProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Profile Dialog */}
      <AlertDialog open={!!deletingUserProfile} onOpenChange={(open) => !open && setDeletingUserProfile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Resource Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the resource profile for user &quot;{deletingUserProfile?.userId}&quot;? 
              This will remove all compute and storage preferences. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Profile Dialog */}
      <AlertDialog open={!!deletingGroupProfile} onOpenChange={(open) => !open && setDeletingGroupProfile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group Resource Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingGroupProfile?.groupResourceProfileName}&quot;? 
              This will remove all compute preferences and policies. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteGroupProfile.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGroup} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteGroupProfile.isPending}
            >
              {deleteGroupProfile.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
