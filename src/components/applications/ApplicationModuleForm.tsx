"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationModule } from "@/types";

interface Props {
  module?: ApplicationModule;
  onSubmit: (module: Partial<ApplicationModule>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  gatewayId: string;
}

export function ApplicationModuleForm({ module, onSubmit, onCancel, isLoading, gatewayId }: Props) {
  const [formData, setFormData] = useState({
    appModuleName: module?.appModuleName || "",
    appModuleVersion: module?.appModuleVersion || "",
    appModuleDescription: module?.appModuleDescription || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.appModuleName || !formData.appModuleVersion) {
      alert("Module name and version are required");
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="module-name">Module Name *</Label>
        <Input
          id="module-name"
          value={formData.appModuleName}
          onChange={(e) => setFormData({ ...formData, appModuleName: e.target.value })}
          placeholder="e.g., Gaussian"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="version">Version *</Label>
        <Input
          id="version"
          value={formData.appModuleVersion}
          onChange={(e) => setFormData({ ...formData, appModuleVersion: e.target.value })}
          placeholder="e.g., 16.C.01"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.appModuleDescription}
          onChange={(e) => setFormData({ ...formData, appModuleDescription: e.target.value })}
          placeholder="Describe the application module"
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : module ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
