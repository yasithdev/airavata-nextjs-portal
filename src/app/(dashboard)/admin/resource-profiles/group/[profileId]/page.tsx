"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupProfileEditor } from "@/components/group-profiles/GroupProfileEditor";
import { useGroupProfile, useUpdateGroupProfile } from "@/hooks/useGroupProfiles";
import { toast } from "@/hooks/useToast";

export default function GroupProfileDetailPage() {
  const params = useParams();
  const profileId = params.profileId as string;

  const { data: profile, isLoading } = useGroupProfile(profileId);
  const updateProfile = useUpdateGroupProfile();

  const handleSave = async (updatedProfile: any) => {
    try {
      await updateProfile.mutateAsync({ profileId, profile: updatedProfile });
      toast({
        title: "Profile updated",
        description: "Group resource profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold">Profile not found</h2>
        <p className="text-muted-foreground mt-2">The requested profile could not be found.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/resource-profiles">Back to Profiles</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/resource-profiles">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{profile.groupResourceProfileName}</h1>
            <p className="text-muted-foreground">Configure compute resources and policies</p>
          </div>
        </div>
      </div>

      <GroupProfileEditor profile={profile} onSave={handleSave} isSaving={updateProfile.isPending} />
    </div>
  );
}
