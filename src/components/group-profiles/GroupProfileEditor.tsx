"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComputePreferenceEditor } from "./ComputePreferenceEditor";
import type { GroupResourceProfile } from "@/types";

interface Props {
  profile: GroupResourceProfile;
  onSave: (profile: any) => Promise<void>;
  isSaving: boolean;
}

export function GroupProfileEditor({ profile, onSave, isSaving }: Props) {
  const [editedProfile, setEditedProfile] = useState(profile);

  const handleSave = () => {
    onSave(editedProfile);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Configuration</CardTitle>
              <CardDescription>Basic profile settings and default credentials</CardDescription>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Profile Name</Label>
            <Input
              value={editedProfile.groupResourceProfileName}
              onChange={(e) =>
                setEditedProfile((prev) => ({ ...prev, groupResourceProfileName: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Default Credential Token</Label>
            <Input
              value={editedProfile.defaultCredentialStoreToken || ""}
              onChange={(e) =>
                setEditedProfile((prev) => ({ ...prev, defaultCredentialStoreToken: e.target.value }))
              }
              placeholder="Enter credential token (optional)"
            />
            <p className="text-sm text-muted-foreground">
              Default credential to use for all compute resources in this profile
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="compute">
        <TabsList>
          <TabsTrigger value="compute">Compute Preferences</TabsTrigger>
          <TabsTrigger value="storage">Storage Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="compute" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Compute Resource Preferences</h3>
              <p className="text-sm text-muted-foreground">
                Configure preferences for each compute resource
              </p>
            </div>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Preference
            </Button>
          </div>

          {editedProfile.computePreferences && editedProfile.computePreferences.length > 0 ? (
            <div className="space-y-4">
              {editedProfile.computePreferences.map((pref, index) => (
                <ComputePreferenceEditor
                  key={pref.computeResourceId || index}
                  preference={pref}
                  onChange={(updated) => {
                    const newPrefs = [...editedProfile.computePreferences!];
                    newPrefs[index] = updated;
                    setEditedProfile((prev) => ({ ...prev, computePreferences: newPrefs }));
                  }}
                  onRemove={() => {
                    const newPrefs = editedProfile.computePreferences!.filter((_, i) => i !== index);
                    setEditedProfile((prev) => ({ ...prev, computePreferences: newPrefs }));
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No compute preferences configured. Add a preference to get started.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="storage" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Storage preferences configuration coming soon
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
