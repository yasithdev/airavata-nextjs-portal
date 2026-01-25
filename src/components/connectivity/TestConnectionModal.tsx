"use client";

import { useState } from "react";
import { Wifi, WifiOff, CheckCircle, XCircle, Loader2, Key, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCredentials } from "@/hooks/useCredentials";
import { connectivityApi } from "@/lib/api/connectivity";
import { credentialsApi } from "@/lib/api/credentials";
import { useGateway } from "@/contexts/GatewayContext";
import type { ConnectivityTestResult } from "@/lib/api/connectivity";

interface TestConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: "compute" | "storage";
  hostname: string;
  port?: number;
}

type TestStatus = "idle" | "testing" | "success" | "error";

export function TestConnectionModal({
  open,
  onOpenChange,
  resourceType,
  hostname,
  port = 22,
}: TestConnectionModalProps) {
  const { data: credentials, isLoading: credentialsLoading } = useCredentials();
  const { selectedGatewayId } = useGateway();
  const gatewayId = selectedGatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
  
  const [selectedCredentialToken, setSelectedCredentialToken] = useState<string>("");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testResult, setTestResult] = useState<ConnectivityTestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const sshCredentials = credentials?.filter((c) => c.type === "SSH") || [];

  const handleTest = async () => {
    if (!selectedCredentialToken) return;

    setTestStatus("testing");
    setTestResult(null);
    setErrorMessage("");

    try {
      // Get the full SSH credential details (including private key)
      const credential = await credentialsApi.getSSH(selectedCredentialToken, gatewayId);
      
      if (!credential) {
        throw new Error("Failed to retrieve credential details");
      }

      // Test SSH connection
      const result = await connectivityApi.testSSH({
        host: hostname,
        port: port,
        username: credential.username,
        privateKey: credential.privateKey,
      });

      setTestResult(result);
      setTestStatus(result.success ? "success" : "error");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Connection test failed");
      setTestStatus("error");
    }
  };

  const handleClose = () => {
    setSelectedCredentialToken("");
    setTestStatus("idle");
    setTestResult(null);
    setErrorMessage("");
    onOpenChange(false);
  };

  const getStatusIcon = () => {
    switch (testStatus) {
      case "testing":
        return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "error":
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Wifi className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    switch (testStatus) {
      case "testing":
        return "Testing connection...";
      case "success":
        return "Connection successful!";
      case "error":
        return "Connection failed";
      default:
        return "Select a credential and test the connection";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Test Connection
          </DialogTitle>
          <DialogDescription>
            Test SSH connectivity to {resourceType === "compute" ? "compute" : "storage"} resource
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resource Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Hostname:</span>
                  <p className="font-medium">{hostname}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">SSH Port:</span>
                  <p className="font-medium">{port}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credential Selection */}
          <div className="space-y-2">
            <Label htmlFor="credential">SSH Credential</Label>
            {credentialsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading credentials...
              </div>
            ) : sshCredentials.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  No SSH credentials available. Please create one first.
                </span>
              </div>
            ) : (
              <Select
                value={selectedCredentialToken}
                onValueChange={setSelectedCredentialToken}
                disabled={testStatus === "testing"}
              >
                <SelectTrigger id="credential">
                  <SelectValue placeholder="Select an SSH credential" />
                </SelectTrigger>
                <SelectContent>
                  {sshCredentials.map((cred) => (
                    <SelectItem key={cred.token} value={cred.token}>
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span>{cred.username}</span>
                        {cred.description && (
                          <span className="text-muted-foreground">
                            - {cred.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Test Result */}
          <Card className={`${
            testStatus === "success" 
              ? "border-green-200 bg-green-50" 
              : testStatus === "error" 
              ? "border-red-200 bg-red-50" 
              : ""
          }`}>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center text-center py-4">
                {getStatusIcon()}
                <p className={`mt-2 font-medium ${
                  testStatus === "success" 
                    ? "text-green-700" 
                    : testStatus === "error" 
                    ? "text-red-700" 
                    : ""
                }`}>
                  {getStatusMessage()}
                </p>
                
                {testResult && (
                  <div className="mt-3 text-sm text-muted-foreground w-full text-left">
                    {testResult.message && (
                      <p className="mb-2">{testResult.message}</p>
                    )}
                    {testResult.details && (
                      <p className="text-xs font-mono bg-muted p-2 rounded">
                        {testResult.details}
                      </p>
                    )}
                    {testResult.authentication && (
                      <div className="mt-2">
                        <Badge variant="outline">
                          Auth: {testResult.authentication}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {errorMessage && testStatus === "error" && !testResult && (
                  <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            onClick={handleTest}
            disabled={!selectedCredentialToken || testStatus === "testing" || sshCredentials.length === 0}
          >
            {testStatus === "testing" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
