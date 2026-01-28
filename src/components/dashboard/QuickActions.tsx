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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Common tasks you can perform</p>
      </div>
      <div className="grid gap-3 grid-cols-1">
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
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <action.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
