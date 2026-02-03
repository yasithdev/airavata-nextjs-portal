"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CredentialPicker } from "@/components/resources/CredentialPicker";
import { ConnectivityTest, type TestResult } from "@/components/resources/ConnectivityTest";
import { CheckCircle2, XCircle } from "lucide-react";
import type { StorageResourceDescription, DataMovementProtocol } from "@/types";

export type StorageResourceFormPayload = Partial<StorageResourceDescription> & { port?: number; credentialToken?: string };

const DATA_MOVEMENT_PROTOCOLS: DataMovementProtocol[] = [
  "SCP",
  "SFTP",
  "GridFTP",
  "LOCAL",
  "UNICORE_STORAGE_SERVICE",
];

const DEFAULT_PORT = 22;

/** Parse resource hostName (and optional port from existing data) for edit mode. */
function getInitialHostnameAndPort(resource?: StorageResourceDescription): { hostname: string; port: number } {
  if (!resource?.hostName?.trim()) return { hostname: "", port: DEFAULT_PORT };
  const s = resource.hostName.trim();
  const colonIdx = s.lastIndexOf(":");
  if (colonIdx > 0) {
    const maybeHost = s.slice(0, colonIdx);
    const maybePort = s.slice(colonIdx + 1);
    const portNum = parseInt(maybePort, 10);
    if (/^\d+$/.test(maybePort) && Number.isFinite(portNum)) return { hostname: maybeHost, port: portNum };
  }
  return { hostname: s, port: DEFAULT_PORT };
}

interface Props {
  resource?: StorageResourceDescription;
  onSubmit: (resource: StorageResourceFormPayload) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function StorageResourceForm({ resource, onSubmit, onCancel, isLoading }: Props) {
  const { hostname: initialHost, port: initialPort } = getInitialHostnameAndPort(resource);

  const [formData, setFormData] = useState<StorageResourceFormPayload>({
    hostName: initialHost,
    storageResourceDescription: resource?.storageResourceDescription || "",
    dataMovementProtocol: resource?.dataMovementProtocol || "SFTP",
    port: initialPort,
    credentialToken: "",
  });

  const [connectionTestResult, setConnectionTestResult] = useState<TestResult | null>(null);

  const hostname = (formData.hostName ?? "").trim();
  const port = formData.port ?? DEFAULT_PORT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostname) {
      alert("Hostname is required");
      return;
    }
    const payload: StorageResourceFormPayload = {
      ...formData,
      hostName: hostname,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dataMovementProtocol">Protocol</Label>
            <Select
              value={formData.dataMovementProtocol ?? "SFTP"}
              onValueChange={(value) =>
                setFormData({ ...formData, dataMovementProtocol: value as DataMovementProtocol })
              }
            >
              <SelectTrigger id="dataMovementProtocol">
                <SelectValue placeholder="Select protocol" />
              </SelectTrigger>
              <SelectContent>
                {DATA_MOVEMENT_PROTOCOLS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostname">Hostname *</Label>
            <Input
              id="hostname"
              value={formData.hostName ?? ""}
              onChange={(e) => {
                setFormData({ ...formData, hostName: e.target.value });
                setConnectionTestResult(null);
              }}
              placeholder="e.g. localhost or sftp.storage.edu"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              min={1}
              max={65535}
              value={formData.port ?? DEFAULT_PORT}
              onChange={(e) => {
                const v = e.target.value ? parseInt(e.target.value, 10) : undefined;
                setFormData({ ...formData, port: Number.isFinite(v) ? v : DEFAULT_PORT });
                setConnectionTestResult(null);
              }}
              placeholder="22"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.storageResourceDescription ?? ""}
              onChange={(e) => setFormData({ ...formData, storageResourceDescription: e.target.value })}
              placeholder="Describe this storage resource"
              rows={3}
            />
          </div>

          <CredentialPicker
            label="Default Credential"
            value={formData.credentialToken ?? ""}
            onChange={(token) => {
              setFormData({ ...formData, credentialToken: token });
              setConnectionTestResult(null);
            }}
            filter="SSH"
            placeholder="Select credential"
            inlineAction={
              hostname ? (
                <ConnectivityTest
                  host={hostname}
                  port={port}
                  type="sftp"
                  inline
                  onResultChange={setConnectionTestResult}
                />
              ) : undefined
            }
            helperText={
              hostname ? (
                <span className="flex items-center gap-2">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    {hostname}:{port}
                  </code>
                  {connectionTestResult && (
                    <span className={`flex items-center gap-1 ${connectionTestResult.success ? "text-green-600" : "text-destructive"}`}>
                      {connectionTestResult.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      <span className="text-xs">{connectionTestResult.success ? "Connected" : connectionTestResult.message}</span>
                    </span>
                  )}
                </span>
              ) : undefined
            }
          />
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
