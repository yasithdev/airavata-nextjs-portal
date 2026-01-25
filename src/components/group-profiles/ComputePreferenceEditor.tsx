"use client";

import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { GroupComputeResourcePreference } from "@/types";

interface Props {
  preference: GroupComputeResourcePreference;
  onChange: (preference: GroupComputeResourcePreference) => void;
  onRemove: () => void;
}

export function ComputePreferenceEditor({ preference, onChange, onRemove }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{preference.computeResourceId || "New Preference"}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Login Username</Label>
              <Input
                value={preference.loginUserName || ""}
                onChange={(e) => onChange({ ...preference, loginUserName: e.target.value })}
                placeholder="Override username"
              />
            </div>
            <div className="space-y-2">
              <Label>Allocation Project Number</Label>
              <Input
                value={preference.allocationProjectNumber || ""}
                onChange={(e) => onChange({ ...preference, allocationProjectNumber: e.target.value })}
                placeholder="Project allocation"
              />
            </div>
            <div className="space-y-2">
              <Label>Scratch Location</Label>
              <Input
                value={preference.scratchLocation || ""}
                onChange={(e) => onChange({ ...preference, scratchLocation: e.target.value })}
                placeholder="Scratch directory path"
              />
            </div>
            <div className="space-y-2">
              <Label>Quality of Service</Label>
              <Input
                value={preference.qualityOfService || ""}
                onChange={(e) => onChange({ ...preference, qualityOfService: e.target.value })}
                placeholder="QoS setting"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SSH Account Provisioned</Label>
              <p className="text-sm text-muted-foreground">
                Whether SSH access is configured
              </p>
            </div>
            <Switch
              checked={!!preference.sshAccountProvisioner}
              onCheckedChange={(checked) => onChange({ ...preference, sshAccountProvisioner: checked ? "enabled" : undefined })}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
