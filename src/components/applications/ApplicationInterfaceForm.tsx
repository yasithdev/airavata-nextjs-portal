"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { ApplicationInterfaceDescription, InputDataObjectType, OutputDataObjectType } from "@/types";
import { DataType } from "@/types";

interface Props {
  appInterface?: ApplicationInterfaceDescription;
  appModuleId: string;
  onSubmit: (appInterface: Partial<ApplicationInterfaceDescription>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  gatewayId: string;
}

export function ApplicationInterfaceForm({ appInterface, appModuleId, onSubmit, onCancel, isLoading, gatewayId }: Props) {
  const [formData, setFormData] = useState({
    applicationName: appInterface?.applicationName || "",
    applicationDescription: appInterface?.applicationDescription || "",
    applicationInputs: appInterface?.applicationInputs || [],
    applicationOutputs: appInterface?.applicationOutputs || [],
  });

  const [newInput, setNewInput] = useState<Partial<InputDataObjectType>>({
    name: "",
    type: DataType.STRING,
    isRequired: false,
  });

  const [newOutput, setNewOutput] = useState<Partial<OutputDataObjectType>>({
    name: "",
    type: DataType.STRING,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicationName) {
      alert("Application name is required");
      return;
    }

    await onSubmit({
      ...formData,
      applicationModules: [appModuleId],
    });
  };

  const addInput = () => {
    if (!newInput.name) {
      alert("Input name is required");
      return;
    }
    setFormData({
      ...formData,
      applicationInputs: [...formData.applicationInputs, newInput as InputDataObjectType],
    });
    setNewInput({ name: "", type: DataType.STRING, isRequired: false });
  };

  const addOutput = () => {
    if (!newOutput.name) {
      alert("Output name is required");
      return;
    }
    setFormData({
      ...formData,
      applicationOutputs: [...formData.applicationOutputs, newOutput as OutputDataObjectType],
    });
    setNewOutput({ name: "", type: DataType.STRING });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Application Name *</Label>
            <Input
              value={formData.applicationName}
              onChange={(e) => setFormData({ ...formData, applicationName: e.target.value })}
              placeholder="e.g., Gaussian Quantum Chemistry"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.applicationDescription}
              onChange={(e) => setFormData({ ...formData, applicationDescription: e.target.value })}
              placeholder="Describe the application"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Input Fields</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addInput}>
              <Plus className="mr-2 h-4 w-4" />
              Add Input
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newInput.name}
                onChange={(e) => setNewInput({ ...newInput, name: e.target.value })}
                placeholder="Input name"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newInput.type}
                onValueChange={(value) => setNewInput({ ...newInput, type: value as DataType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DataType.STRING}>String</SelectItem>
                  <SelectItem value={DataType.INTEGER}>Integer</SelectItem>
                  <SelectItem value={DataType.FLOAT}>Float</SelectItem>
                  <SelectItem value={DataType.URI}>File/URI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newInput.userFriendlyDescription || ""}
                onChange={(e) => setNewInput({ ...newInput, userFriendlyDescription: e.target.value })}
                placeholder="Description"
              />
            </div>
            <div className="space-y-2">
              <Label>Required</Label>
              <div className="flex items-center h-10">
                <Checkbox
                  checked={newInput.isRequired}
                  onCheckedChange={(checked) => setNewInput({ ...newInput, isRequired: checked as boolean })}
                />
              </div>
            </div>
          </div>

          {formData.applicationInputs.length > 0 && (
            <div className="space-y-2">
              {formData.applicationInputs.map((input, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                    <span className="font-medium">{input.name}</span>
                    <span className="text-muted-foreground">{input.type}</span>
                    <span className="text-muted-foreground">{input.userFriendlyDescription}</span>
                    <span className="text-muted-foreground">{input.isRequired ? "Required" : "Optional"}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        applicationInputs: formData.applicationInputs.filter((_, i) => i !== idx),
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Output Fields</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addOutput}>
              <Plus className="mr-2 h-4 w-4" />
              Add Output
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newOutput.name}
                onChange={(e) => setNewOutput({ ...newOutput, name: e.target.value })}
                placeholder="Output name"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newOutput.type}
                onValueChange={(value) => setNewOutput({ ...newOutput, type: value as DataType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DataType.STRING}>String</SelectItem>
                  <SelectItem value={DataType.URI}>File/URI</SelectItem>
                  <SelectItem value={DataType.STDOUT}>Stdout</SelectItem>
                  <SelectItem value={DataType.STDERR}>Stderr</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newOutput.metaData || ""}
                onChange={(e) => setNewOutput({ ...newOutput, metaData: e.target.value })}
                placeholder="Description"
              />
            </div>
          </div>

          {formData.applicationOutputs.length > 0 && (
            <div className="space-y-2">
              {formData.applicationOutputs.map((output, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                    <span className="font-medium">{output.name}</span>
                    <span className="text-muted-foreground">{output.type}</span>
                    <span className="text-muted-foreground">{output.metaData}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        applicationOutputs: formData.applicationOutputs.filter((_, i) => i !== idx),
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : appInterface ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
