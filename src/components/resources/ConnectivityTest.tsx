"use client";

import { useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2, TestTube } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "@/hooks/useToast";

interface Props {
  host: string;
  port?: number;
  type: "ssh" | "sftp" | "slurm";
  credentialToken?: string;
  onTestComplete?: (success: boolean) => void;
}

export function ConnectivityTest({ host, port, type, credentialToken, onTestComplete }: Props) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ 
    success: boolean; 
    message: string; 
    details?: string;
    sshAccessible?: boolean;
    slurmAccessible?: boolean;
  } | null>(null);
  
  // Use test infrastructure ports for localhost
  const getTestPort = () => {
    if (host === "localhost" || host === "127.0.0.1") {
      if (type === "slurm") return 6817;
      if (type === "sftp") return 10023;
      return 10022; // SSH for compute
    }
    return port || (type === "slurm" ? 6817 : 22);
  };
  
  const [testPort, setTestPort] = useState(getTestPort().toString());
  
  // Update port when host changes
  React.useEffect(() => {
    setTestPort(getTestPort().toString());
  }, [host, type]);

  const handleTest = async () => {
    if (!host) {
      toast({
        title: "Missing Host",
        description: "Please enter a host name first",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      let result;
      const actualPort = host === "localhost" || host === "127.0.0.1" 
        ? (type === "sftp" ? 10023 : type === "slurm" ? 6817 : 10022)
        : parseInt(testPort) || (type === "sftp" ? 22 : type === "slurm" ? 6817 : 22);
      
      // Try backend first, fallback to Next.js API route
      try {
        if (type === "slurm") {
          const sshPort = host === "localhost" || host === "127.0.0.1" ? 10022 : 22;
          result = await apiClient.post<{ success: boolean; message: string; sshAccessible?: boolean; slurmAccessible?: boolean }>("/api/v1/connectivity-test/slurm", {
            host,
            sshPort,
            slurmPort: actualPort,
          });
        } else {
          result = await apiClient.post<{ success: boolean; message: string; details?: string }>(`/api/v1/connectivity-test/${type}`, {
            host,
            port: actualPort,
            credentialToken,
          });
        }
      } catch (backendError) {
        // Fallback to Next.js API route
        const nextResponse = await fetch(`/api/v1/connectivity-test/${type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            type === "slurm"
              ? { host, sshPort: host === "localhost" ? 10022 : 22, slurmPort: actualPort }
              : { host, port: actualPort, credentialToken }
          ),
        });
        if (!nextResponse.ok) throw new Error("Connectivity test failed");
        result = await nextResponse.json();
      }

      setTestResult(result);
      onTestComplete?.(result.success);

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorResult = {
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed",
      };
      setTestResult(errorResult);
      onTestComplete?.(false);
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          Test Connection
        </Label>
        {type === "slurm" && (
          <div className="flex items-center gap-2">
            <Label className="text-xs">SLURM Port:</Label>
            <Input
              value={testPort}
              onChange={(e) => setTestPort(e.target.value)}
              type="number"
              className="w-20 h-8 text-xs"
              placeholder="6817"
            />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={host}
          readOnly
          className="flex-1 font-mono text-sm"
          placeholder="Host name"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={isTesting || !host}
        >
          {isTesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Test"
          )}
        </Button>
      </div>

      {testResult && (
        <div className={`flex items-start gap-2 p-3 rounded text-sm ${
          testResult.success
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {testResult.success ? (
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-medium">{testResult.message}</p>
            {testResult.details && (
              <p className="text-xs mt-1 opacity-80">{testResult.details}</p>
            )}
            {type === "slurm" && "sshAccessible" in testResult && (
              <div className="mt-2 space-y-1 text-xs">
                <p>SSH Port (22): {testResult.sshAccessible ? "✓ Accessible" : "✗ Not accessible"}</p>
                <p>SLURM Port ({testPort}): {testResult.slurmAccessible ? "✓ Accessible" : "✗ Not accessible"}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
