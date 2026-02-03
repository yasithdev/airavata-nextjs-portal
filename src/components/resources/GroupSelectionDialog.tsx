"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { preferencesApi } from "@/lib/api";
import type {
  GroupPreferenceOption,
  PreferenceResourceType,
  ResolvedPreferencesResult,
} from "@/types";
import { useGateway } from "@/contexts/GatewayContext";
import { toast } from "@/hooks/useToast";

interface GroupSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  /** Result from resolvePreferencesWithConflicts when conflicts exist */
  resolutionResult: ResolvedPreferencesResult | null;
  resourceType: PreferenceResourceType;
  resourceId: string;
  /** Callback after selection is saved (e.g. refetch preferences) */
  onSelectionMade?: () => void;
}

export function GroupSelectionDialog({
  open,
  onClose,
  resolutionResult,
  resourceType,
  resourceId,
  onSelectionMade,
}: GroupSelectionDialogProps) {
  const { effectiveGatewayId } = useGateway();
  const gatewayId = effectiveGatewayId ?? "";
  const queryClient = useQueryClient();

  const conflictKeys = resolutionResult?.conflictKeys ?? [];
  const conflictOptions = resolutionResult?.conflictOptions ?? {};

  const [selections, setSelections] = useState<Record<string, string>>({});

  const setSelectionMutation = useMutation({
    mutationFn: async () => {
      for (const key of conflictKeys) {
        const groupId = selections[key];
        if (groupId) {
          await preferencesApi.setGroupSelection(gatewayId, {
            resourceType,
            resourceId,
            selectionKey: key,
            selectedGroupId: groupId,
          });
        }
      }
    },
    onSuccess: () => {
      toast({ title: "Selection saved", description: "Your preference choices have been saved." });
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      onSelectionMade?.();
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Failed to save selection", description: err.message, variant: "destructive" });
    },
  });

  const handleSelect = (key: string, groupId: string) => {
    setSelections((prev) => ({ ...prev, [key]: groupId }));
  };

  const handleSave = () => {
    const missing = conflictKeys.filter((k) => !selections[k]);
    if (missing.length > 0) {
      toast({
        title: "Select an option for each conflict",
        description: `Please choose a group for: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    setSelectionMutation.mutate();
  };

  if (conflictKeys.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve preference conflicts</DialogTitle>
          <DialogDescription>
            Multiple groups have different values for this resource. Choose which group’s value to use for each setting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {conflictKeys.map((key) => {
            const options: GroupPreferenceOption[] = conflictOptions[key] ?? [];
            return (
              <div key={key} className="space-y-2">
                <Label className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </Label>
                <Select
                  value={selections[key] ?? ""}
                  onValueChange={(value) => handleSelect(key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt) => (
                      <SelectItem key={opt.groupId} value={opt.groupId}>
                        <span className="font-mono text-muted-foreground">{opt.groupId}</span>
                        {" — "}
                        {opt.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={setSelectionMutation.isPending || conflictKeys.some((k) => !selections[k])}
          >
            {setSelectionMutation.isPending ? "Saving..." : "Save selection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
