"use client";

import Link from "next/link";
import { Pencil, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GatewayBadge } from "@/components/gateway/GatewayBadge";
import type { GroupResourceProfile } from "@/types";

interface Props {
  profiles?: GroupResourceProfile[];
  isLoading: boolean;
  onDelete: (profileId: string) => void;
}

export function GroupProfileList({ profiles, isLoading, onDelete }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <Link 
          key={profile.groupResourceProfileId} 
          href={`/admin/resource-profiles/group/${profile.groupResourceProfileId}`}
        >
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
            <CardHeader>
              <CardTitle className="text-base">{profile.groupResourceProfileName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.gatewayId && <GatewayBadge gatewayId={profile.gatewayId} />}
                {profile.defaultCredentialStoreToken && (
                  <p className="text-sm text-muted-foreground">
                    Default credential configured
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  {profile.computePreferences?.length || 0} compute preference(s)
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(profile.groupResourceProfileId);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
