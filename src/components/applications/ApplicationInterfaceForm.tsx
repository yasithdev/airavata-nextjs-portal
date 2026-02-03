"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowDownToLine, ArrowUpFromLine, Pencil, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ApplicationInterfaceDescription, InputDataObjectType, OutputDataObjectType } from "@/types";
import { DataType, DEFAULT_SYSTEM_INPUT, DEFAULT_SYSTEM_OUTPUTS, isSystemInputName, isSystemOutputName } from "@/types";

interface Props {
  appInterface?: ApplicationInterfaceDescription;
  appModuleId: string;
  onSubmit: (appInterface: Partial<ApplicationInterfaceDescription>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  gatewayId: string;
}

function defaultInputs(existing: InputDataObjectType[] | undefined): InputDataObjectType[] {
  if (Array.isArray(existing) && existing.length > 0) return [...existing];
  return [{ ...DEFAULT_SYSTEM_INPUT }];
}

function defaultOutputs(existing: OutputDataObjectType[] | undefined): OutputDataObjectType[] {
  if (Array.isArray(existing) && existing.length > 0) return existing.map((o) => ({ ...o }));
  return DEFAULT_SYSTEM_OUTPUTS.map((o) => ({ ...o }));
}

export function ApplicationInterfaceForm({ appInterface, appModuleId, onSubmit, onCancel, isLoading, gatewayId }: Props) {
  const [formData, setFormData] = useState({
    applicationName: appInterface?.applicationName || "",
    applicationDescription: appInterface?.applicationDescription || "",
    applicationInputs: defaultInputs(appInterface?.applicationInputs),
    applicationOutputs: defaultOutputs(appInterface?.applicationOutputs),
  });

  // Sync form when appInterface loads (e.g. edit dialog opened and data arrived). Only key off id so we don't reset when user adds inputs/outputs.
  useEffect(() => {
    if (!appInterface) return;
    setFormData({
      applicationName: appInterface.applicationName ?? "",
      applicationDescription: appInterface.applicationDescription ?? "",
      applicationInputs: defaultInputs(appInterface.applicationInputs),
      applicationOutputs: defaultOutputs(appInterface.applicationOutputs),
    });
    setEditingInputIndex(null);
    setEditingInputDraft(null);
    setNewInputIndex(null);
    setEditingOutputIndex(null);
    setEditingOutputDraft(null);
    setNewOutputIndex(null);
  }, [appInterface?.applicationInterfaceId]);

  // Row edit state: which index is being edited and current draft; new*Index = newly added row (Cancel = remove)
  const [editingInputIndex, setEditingInputIndex] = useState<number | null>(null);
  const [editingInputDraft, setEditingInputDraft] = useState<Partial<InputDataObjectType> | null>(null);
  const [newInputIndex, setNewInputIndex] = useState<number | null>(null);
  const [editingOutputIndex, setEditingOutputIndex] = useState<number | null>(null);
  const [editingOutputDraft, setEditingOutputDraft] = useState<Partial<OutputDataObjectType> | null>(null);
  const [newOutputIndex, setNewOutputIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicationName) {
      alert("Application name is required");
      return;
    }

    // Persist only name, type, applicationArgument (CLI args), isRequired for application inputs/outputs.
    const inputs = (formData.applicationInputs ?? []).map((i) => ({
      name: i.name ?? "",
      type: i.type ?? DataType.STRING,
      applicationArgument: i.applicationArgument ?? "",
      isRequired: i.isRequired ?? false,
    }));
    const outputs = (formData.applicationOutputs ?? []).map((o) => ({
      name: o.name ?? "",
      type: o.type ?? DataType.STRING,
      applicationArgument: o.applicationArgument ?? "",
      isRequired: o.isRequired ?? false,
    }));
    await onSubmit({
      applicationName: formData.applicationName,
      applicationDescription: formData.applicationDescription,
      applicationModules: [appModuleId],
      applicationInputs: inputs,
      applicationOutputs: outputs,
    });
  };

  // Add new input row at end of inputs; keep in edit mode until OK. Only name, type, applicationArgument, isRequired.
  const addInput = () => {
    const newIdx = formData.applicationInputs.length;
    const newInputRow: InputDataObjectType = { name: "", type: DataType.STRING, applicationArgument: "", isRequired: false };
    setFormData({
      ...formData,
      applicationInputs: [...formData.applicationInputs, newInputRow],
    });
    setEditingInputIndex(newIdx);
    setEditingInputDraft({ ...newInputRow });
    setNewInputIndex(newIdx);
  };

  // Add new output row at end of outputs; keep in edit mode until OK. Only name, type, applicationArgument, isRequired.
  const addOutput = () => {
    const newIdx = formData.applicationOutputs.length;
    const newOutputRow: OutputDataObjectType = { name: "", type: DataType.STRING, applicationArgument: "", isRequired: false };
    setFormData({
      ...formData,
      applicationOutputs: [...formData.applicationOutputs, newOutputRow],
    });
    setEditingOutputIndex(newIdx);
    setEditingOutputDraft({ ...newOutputRow });
    setNewOutputIndex(newIdx);
  };

  const confirmInputRow = () => {
    if (editingInputIndex === null || !editingInputDraft) return;
    if (!editingInputDraft.name?.trim()) {
      alert("Input name is required");
      return;
    }
    const name = (editingInputDraft.name ?? "").trim();
    if (newInputIndex !== null && isSystemInputName(name.toUpperCase())) {
      alert("STDIN is a reserved system input and cannot be added manually.");
      return;
    }
    const next = [...formData.applicationInputs];
    next[editingInputIndex] = {
      name: editingInputDraft.name ?? "",
      type: editingInputDraft.type ?? DataType.STRING,
      applicationArgument: editingInputDraft.applicationArgument ?? "",
      isRequired: editingInputDraft.isRequired ?? false,
    } as InputDataObjectType;
    setFormData({ ...formData, applicationInputs: next });
    setEditingInputIndex(null);
    setEditingInputDraft(null);
    setNewInputIndex(null);
  };

  const cancelInputRow = () => {
    if (newInputIndex !== null) {
      setFormData({
        ...formData,
        applicationInputs: formData.applicationInputs.filter((_, i) => i !== newInputIndex),
      });
    }
    setEditingInputIndex(null);
    setEditingInputDraft(null);
    setNewInputIndex(null);
  };

  const editInputRow = (idx: number) => {
    setEditingInputIndex(idx);
    setEditingInputDraft({ ...formData.applicationInputs[idx] });
    setNewInputIndex(null);
  };

  const confirmOutputRow = () => {
    if (editingOutputIndex === null || !editingOutputDraft) return;
    if (!editingOutputDraft.name?.trim()) {
      alert("Output name is required");
      return;
    }
    const name = (editingOutputDraft.name ?? "").trim();
    if (newOutputIndex !== null && isSystemOutputName(name.toUpperCase())) {
      alert("STDOUT and STDERR are reserved system outputs and cannot be added manually.");
      return;
    }
    const next = [...formData.applicationOutputs];
    next[editingOutputIndex] = {
      name: editingOutputDraft.name ?? "",
      type: editingOutputDraft.type ?? DataType.STRING,
      applicationArgument: editingOutputDraft.applicationArgument ?? "",
      isRequired: editingOutputDraft.isRequired ?? false,
    } as OutputDataObjectType;
    setFormData({ ...formData, applicationOutputs: next });
    setEditingOutputIndex(null);
    setEditingOutputDraft(null);
    setNewOutputIndex(null);
  };

  const cancelOutputRow = () => {
    if (newOutputIndex !== null) {
      setFormData({
        ...formData,
        applicationOutputs: formData.applicationOutputs.filter((_, i) => i !== newOutputIndex),
      });
    }
    setEditingOutputIndex(null);
    setEditingOutputDraft(null);
    setNewOutputIndex(null);
  };

  const editOutputRow = (idx: number) => {
    setEditingOutputIndex(idx);
    setEditingOutputDraft({ ...formData.applicationOutputs[idx] });
    setNewOutputIndex(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 min-w-0">
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
            <CardTitle>Fields</CardTitle>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addInput}>
                <Plus className="mr-2 h-4 w-4" />
                Add Input
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addOutput}>
                <Plus className="mr-2 h-4 w-4" />
                Add Output
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto max-h-[min(50vh,360px)] p-4 pt-0">
          <Table className="w-full table-fixed [&_th]:h-9 [&_th]:py-1.5 [&_th]:px-2 [&_td]:py-1.5 [&_td]:px-2" style={{ minWidth: 480 }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: "auto" }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 72 }} />
              <col style={{ width: 44 }} />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 36 }} className="px-2" title="Input / Output" />
                <TableHead className="px-2">Name</TableHead>
                <TableHead style={{ width: 100 }} className="px-2 whitespace-nowrap">Type</TableHead>
                <TableHead style={{ width: 140 }} className="px-2 whitespace-nowrap">CLI Args</TableHead>
                <TableHead style={{ width: 72 }} className="px-2 whitespace-nowrap">Required</TableHead>
                <TableHead style={{ width: 44 }} className="px-2 w-11" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Inputs first: each row is either view (read-only + Edit/Delete) or edit (inline fields + OK/Cancel) */}
              {formData.applicationInputs.map((input, idx) => {
                const isEditing = editingInputIndex === idx;
                const draft = isEditing ? editingInputDraft : null;
                const isSystemInput = isSystemInputName(input.name);
                return (
                  <TableRow key={`input-${idx}`}>
                    <TableCell style={{ width: 40 }} className="py-1.5 px-2 align-middle" title="Input">
                      <ArrowDownToLine className="h-4 w-4 text-muted-foreground shrink-0" />
                    </TableCell>
                    {isEditing && draft ? (
                      <>
                        <TableCell className="py-1.5 px-2 align-middle">
                          <Input
                            value={draft.name ?? ""}
                            onChange={(e) => setEditingInputDraft({ ...draft, name: e.target.value })}
                            placeholder="Input name"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell style={{ width: 100 }} className="py-1.5 px-2 align-middle">
                          <Select
                            value={draft.type ?? DataType.STRING}
                            onValueChange={(value) => setEditingInputDraft({ ...draft, type: value as DataType })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={DataType.STRING}>String</SelectItem>
                              <SelectItem value={DataType.INTEGER}>Integer</SelectItem>
                              <SelectItem value={DataType.FLOAT}>Float</SelectItem>
                              <SelectItem value={DataType.URI}>File/URI</SelectItem>
                              <SelectItem value={DataType.STDIN}>Stdin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell style={{ width: 140 }} className="py-1.5 px-2 align-middle">
                          <Input
                            value={draft.applicationArgument ?? ""}
                            onChange={(e) => setEditingInputDraft({ ...draft, applicationArgument: e.target.value })}
                            placeholder="e.g. --input"
                            className="h-9 font-mono text-sm"
                          />
                        </TableCell>
                        <TableCell style={{ width: 72 }} className="py-1.5 px-2 align-middle">
                          <Button
                            type="button"
                            variant={draft.isRequired ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "h-8 w-full min-w-0 text-xs",
                              draft.isRequired ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background border border-input hover:bg-muted/50"
                            )}
                            onClick={() => setEditingInputDraft({ ...draft, isRequired: !draft.isRequired })}
                          >
                            {draft.isRequired ? "Required" : "Optional"}
                          </Button>
                        </TableCell>
                        <TableCell style={{ width: 44 }} className="py-1.5 px-2 align-middle">
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={confirmInputRow} title="OK">
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={cancelInputRow} title="Cancel">
                              <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="py-1.5 px-2 align-middle font-medium">
                          <div className="flex items-center gap-2">
                            {input.name}
                            {isSystemInput && <Badge variant="secondary" className="text-xs">System</Badge>}
                          </div>
                        </TableCell>
                        <TableCell style={{ width: 100 }} className="py-1.5 px-2 align-middle text-muted-foreground">{input.type}</TableCell>
                        <TableCell style={{ width: 140 }} className="py-1.5 px-2 align-middle text-muted-foreground font-mono text-sm truncate" title={input.applicationArgument}>
                          {input.applicationArgument ?? "—"}
                        </TableCell>
                        <TableCell style={{ width: 72 }} className="py-1.5 px-2 align-middle">
                          <Button
                            type="button"
                            variant={input.isRequired ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "h-8 w-full min-w-0 text-xs pointer-events-none",
                              input.isRequired ? "bg-primary text-primary-foreground" : "bg-background border border-input"
                            )}
                            disabled
                          >
                            {input.isRequired ? "Required" : "Optional"}
                          </Button>
                        </TableCell>
                        <TableCell style={{ width: 44 }} className="py-1.5 px-2 align-middle">
                          {!isSystemInput && (
                            <div className="flex items-center gap-1">
                              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editInputRow(idx)} title="Edit">
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    applicationInputs: formData.applicationInputs.filter((_, i) => i !== idx),
                                  });
                                }}
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
              {/* Outputs: each row is either view or edit */}
              {formData.applicationOutputs.map((output, idx) => {
                const isSystemOutput = isSystemOutputName(output.name);
                const isEditing = editingOutputIndex === idx;
                const draft = isEditing ? editingOutputDraft : null;
                return (
                  <TableRow key={`output-${idx}`}>
                    <TableCell style={{ width: 40 }} className="py-1.5 px-2 align-middle" title="Output">
                      <ArrowUpFromLine className="h-4 w-4 text-muted-foreground shrink-0" />
                    </TableCell>
                    {isEditing && draft ? (
                      <>
                        <TableCell className="py-1.5 px-2 align-middle">
                          <Input
                            value={draft.name ?? ""}
                            onChange={(e) => setEditingOutputDraft({ ...draft, name: e.target.value })}
                            placeholder="Output name"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell style={{ width: 100 }} className="py-1.5 px-2 align-middle">
                          <Select
                            value={draft.type ?? DataType.STRING}
                            onValueChange={(value) => setEditingOutputDraft({ ...draft, type: value as DataType })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={DataType.STRING}>String</SelectItem>
                              <SelectItem value={DataType.URI}>File/URI</SelectItem>
                              <SelectItem value={DataType.STDOUT}>Stdout</SelectItem>
                              <SelectItem value={DataType.STDERR}>Stderr</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell style={{ width: 140 }} className="py-1.5 px-2 align-middle">
                          <Input
                            value={draft.applicationArgument ?? ""}
                            onChange={(e) => setEditingOutputDraft({ ...draft, applicationArgument: e.target.value })}
                            placeholder="e.g. --output"
                            className="h-9 font-mono text-sm"
                          />
                        </TableCell>
                        <TableCell style={{ width: 72 }} className="py-1.5 px-2 align-middle">
                          <Button
                            type="button"
                            variant={draft.isRequired ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "h-8 w-full min-w-0 text-xs",
                              draft.isRequired ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background border border-input hover:bg-muted/50"
                            )}
                            onClick={() => setEditingOutputDraft({ ...draft, isRequired: !draft.isRequired })}
                          >
                            {draft.isRequired ? "Required" : "Optional"}
                          </Button>
                        </TableCell>
                        <TableCell style={{ width: 44 }} className="py-1.5 px-2 align-middle">
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={confirmOutputRow} title="OK">
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={cancelOutputRow} title="Cancel">
                              <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="py-1.5 px-2 align-middle">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{output.name}</span>
                            {isSystemOutput && (
                              <Badge variant="secondary" className="text-xs">System</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell style={{ width: 100 }} className="p-2 align-middle text-muted-foreground">{output.type}</TableCell>
                        <TableCell style={{ width: 140 }} className="p-2 align-middle text-muted-foreground font-mono text-sm truncate" title={output.applicationArgument}>
                          {output.applicationArgument ?? "—"}
                        </TableCell>
                        <TableCell style={{ width: 72 }} className="py-1.5 px-2 align-middle">
                          <Button
                            type="button"
                            variant={output.isRequired ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "h-8 w-full min-w-0 text-xs pointer-events-none",
                              output.isRequired ? "bg-primary text-primary-foreground" : "bg-background border border-input"
                            )}
                            disabled
                          >
                            {output.isRequired ? "Required" : "Optional"}
                          </Button>
                        </TableCell>
                        <TableCell style={{ width: 44 }} className="py-1.5 px-2 align-middle">
                          {!isSystemOutput && (
                            <div className="flex items-center gap-1">
                              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editOutputRow(idx)} title="Edit">
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    applicationOutputs: formData.applicationOutputs.filter((_, i) => i !== idx),
                                  });
                                }}
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
