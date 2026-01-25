"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectivityTest } from "@/components/resources/ConnectivityTest";
import type { StorageResourceDescription } from "@/types";

interface Props {
  resource?: StorageResourceDescription;
  onSubmit: (resource: Partial<StorageResourceDescription>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function StorageResourceForm({ resource, onSubmit, onCancel, isLoading }: Props) {
  const [formData, setFormData] = useState<Partial<StorageResourceDescription>>({
    hostName: resource?.hostName || "",
    storageResourceDescription: resource?.storageResourceDescription || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hostName) {
      alert("Host name is required");
      return;
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hostname">Host Name *</Label>
            <Input
              id="hostname"
              value={formData.hostName}
              onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
              placeholder="e.g., localhost (test) or data.storage.edu"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.storageResourceDescription}
              onChange={(e) => setFormData({ ...formData, storageResourceDescription: e.target.value })}
              placeholder="Describe this storage resource"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Movement Interfaces</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Data movement protocols (SCP, SFTP, GridFTP) can be configured after creation
          </p>
          {formData.hostName && (
            <ConnectivityTest
              host={formData.hostName}
              port={22}
              type="sftp"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : resource ? "Update Resource" : "Create Resource"}
        </Button>
      </div>
    </form>
  );
}
