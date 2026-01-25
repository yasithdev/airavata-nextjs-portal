"use client";

import Link from "next/link";
import { Eye, CheckCircle, XCircle, Mail, MailCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GatewayBadge } from "@/components/gateway/GatewayBadge";
import { formatDate } from "@/lib/utils";
import type { User } from "@/lib/api/users";

interface Props {
  users?: User[];
  isLoading: boolean;
}

export function UserList({ users, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          No users found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <Link key={user.airavataInternalUserId} href={`/admin/users/${user.userId}`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      {/* Show gateway badge */}
                      {user.gatewayId && <GatewayBadge gatewayId={user.gatewayId} />}
                      {user.enabled ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Disabled
                        </Badge>
                      )}
                      {user.emailVerified ? (
                        <MailCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{user.userId}</span>
                      <span>{user.email}</span>
                      {user.createdTime && (
                        <span>Joined {formatDate(user.createdTime)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
