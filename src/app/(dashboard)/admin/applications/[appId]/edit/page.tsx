"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "@/hooks/useToast";
import type { ApplicationModule } from "@/types";

export default function EditApplicationModulePage() {
  const params = useParams();
  const appId = params.appId as string;
  const queryClient = useQueryClient();

  const { data: module, isLoading } = useQuery({
    queryKey: ["application-module", appId],
    queryFn: () => apiClient.get<ApplicationModule>(`/api/v1/application-modules/${appId}`),
  });

  const updateModule = useMutation({
    mutationFn: (data: Partial<ApplicationModule>) =>
      apiClient.put(`/api/v1/application-modules/${appId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-module", appId] });
      toast({
        title: "Module updated",
        description: "Application module has been updated successfully.",
      });
    },
  });

  const [formData, setFormData] = useState({
    appModuleName: module?.appModuleName || "",
    appModuleVersion: module?.appModuleVersion || "",
    appModuleDescription: module?.appModuleDescription || "",
  });

  const handleSave = () => {
    updateModule.mutate(formData);
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/catalog/APPLICATION/${appId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Application Module</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Module Details</CardTitle>
            <Button onClick={handleSave} disabled={updateModule.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateModule.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Module Name *</Label>
            <Input
              value={formData.appModuleName}
              onChange={(e) => setFormData((prev) => ({ ...prev, appModuleName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Version *</Label>
            <Input
              value={formData.appModuleVersion}
              onChange={(e) => setFormData((prev) => ({ ...prev, appModuleVersion: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.appModuleDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, appModuleDescription: e.target.value }))}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
