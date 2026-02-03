"use client";

import Link from "next/link";
import { Plus, FolderPlus, Upload, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCreateExperimentModal } from "@/contexts/CreateExperimentModalContext";

interface QuickActionsProps {
  gatewayName: string;
  onCreateProject?: () => void;
}

export function QuickActions({ gatewayName, onCreateProject }: QuickActionsProps) {
  const prefix = `/${gatewayName}`;
  const { openModal } = useCreateExperimentModal();

  const handleCreateExperiment = (e: React.MouseEvent) => {
    e.preventDefault();
    openModal();
  };

  const handleCreateProject = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onCreateProject) {
      onCreateProject();
    } else {
      // Fallback to navigation if no callback provided
      window.location.href = `${prefix}/dashboard?action=new`;
    }
  };

  const actions = [
    {
      title: "Create Experiment",
      description: "Create experiment from app",
      icon: Plus,
      href: `${prefix}/catalog`,
      onClick: handleCreateExperiment,
    },
    {
      title: "New Project",
      description: "Organize experiments",
      icon: FolderPlus,
      href: `${prefix}/dashboard?action=new`,
      onClick: handleCreateProject,
    },
    {
      title: "Upload Files",
      description: "Upload input files",
      icon: Upload,
      href: `${prefix}/storage`,
    },
    {
      title: "Account",
      description: "Manage your account",
      icon: Settings,
      href: "/account",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks you can perform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 grid-cols-1">
          {actions.map((action) => (
            <Link 
              key={action.title} 
              href={action.href}
              onClick={action.onClick}
            >
              <Card
                className={cn(
                  "transition-colors hover:bg-muted/50 cursor-pointer",
                  "border border-border bg-card"
                )}
              >
                <CardContent className="flex items-center gap-3 py-2 px-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <action.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-medium text-sm">{action.title}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
