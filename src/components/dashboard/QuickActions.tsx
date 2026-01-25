"use client";

import Link from "next/link";
import { Plus, FolderPlus, Upload, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const actions = [
    {
      title: "New Experiment",
      description: "Create experiment from app",
      icon: Plus,
      href: "/applications",
      variant: "outline" as const,
    },
    {
      title: "New Project",
      description: "Organize experiments",
      icon: FolderPlus,
      href: "/projects?action=new",
      variant: "outline" as const,
    },
    {
      title: "Upload Files",
      description: "Upload input files",
      icon: Upload,
      href: "/storage",
      variant: "outline" as const,
    },
    {
      title: "Account",
      description: "Manage your account",
      icon: Settings,
      href: "/account",
      variant: "outline" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks you can perform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant={action.variant}
              className="h-auto flex-col items-start gap-1 p-4"
              asChild
            >
              <Link href={action.href}>
                <div className="flex w-full items-center gap-2">
                  <action.icon className="h-4 w-4" />
                  <span className="font-medium">{action.title}</span>
                </div>
                <span className="hidden lg:block text-xs text-muted-foreground font-normal text-left">
                  {action.description}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
