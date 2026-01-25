"use client";

import { useState } from "react";
import { TestTube, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { connectivityApi } from "@/lib/api";
import { toast } from "@/hooks/useToast";
import type { ConnectivityTestResult, SSHTestRequest, SLURMTestRequest } from "@/lib/api/connectivity";

export default function ConnectivityTestPage() {
  const [sshRequest, setSshRequest] = useState<SSHTestRequest>({
    host: "",
    port: 22,
    username: "",
    privateKey: "",
    password: "",
  });

  const [slurmRequest, setSlurmRequest] = useState<SLURMTestRequest>({
    host: "",
    sshPort: 22,
    slurmPort: 6817,
  });

  const sshMutation = useMutation({
    mutationFn: (request: SSHTestRequest) => connectivityApi.testSSH(request),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "SSH Test Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "SSH Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to test SSH connection",
        variant: "destructive",
      });
    },
  });

  const sftpMutation = useMutation({
    mutationFn: (request: SSHTestRequest) => connectivityApi.testSFTP(request),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "SFTP Test Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "SFTP Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to test SFTP connection",
        variant: "destructive",
      });
    },
  });

  const slurmMutation = useMutation({
    mutationFn: (request: SLURMTestRequest) => connectivityApi.testSLURM(request),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "SLURM Test Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "SLURM Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to test SLURM connection",
        variant: "destructive",
      });
    },
  });

  const handleSSHTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sshRequest.host || !sshRequest.username) {
      toast({
        title: "Validation error",
        description: "Host and username are required",
        variant: "destructive",
      });
      return;
    }
    if (!sshRequest.privateKey && !sshRequest.password) {
      toast({
        title: "Validation error",
        description: "Either private key or password is required",
        variant: "destructive",
      });
      return;
    }
    sshMutation.mutate(sshRequest);
  };

  const handleSFTPTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sshRequest.host || !sshRequest.username) {
      toast({
        title: "Validation error",
        description: "Host and username are required",
        variant: "destructive",
      });
      return;
    }
    if (!sshRequest.privateKey && !sshRequest.password) {
      toast({
        title: "Validation error",
        description: "Either private key or password is required",
        variant: "destructive",
      });
      return;
    }
    sftpMutation.mutate(sshRequest);
  };

  const handleSLURMTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slurmRequest.host) {
      toast({
        title: "Validation error",
        description: "Host is required",
        variant: "destructive",
      });
      return;
    }
    slurmMutation.mutate(slurmRequest);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connectivity Testing</h1>
        <p className="text-muted-foreground">
          Test SSH, SFTP, and SLURM connections to compute resources
        </p>
      </div>

      <Tabs defaultValue="ssh" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ssh">SSH</TabsTrigger>
          <TabsTrigger value="sftp">SFTP</TabsTrigger>
          <TabsTrigger value="slurm">SLURM</TabsTrigger>
        </TabsList>

        <TabsContent value="ssh">
          <Card>
            <CardHeader>
              <CardTitle>SSH Connection Test</CardTitle>
              <CardDescription>
                Test SSH connectivity to a remote host
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSSHTest} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Host *</Label>
                    <Input
                      value={sshRequest.host}
                      onChange={(e) => setSshRequest({ ...sshRequest, host: e.target.value })}
                      placeholder="example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input
                      type="number"
                      value={sshRequest.port || 22}
                      onChange={(e) => setSshRequest({ ...sshRequest, port: parseInt(e.target.value) || 22 })}
                      placeholder="22"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Username *</Label>
                  <Input
                    value={sshRequest.username}
                    onChange={(e) => setSshRequest({ ...sshRequest, username: e.target.value })}
                    placeholder="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Private Key (SSH Key)</Label>
                  <Textarea
                    value={sshRequest.privateKey || ""}
                    onChange={(e) => setSshRequest({ ...sshRequest, privateKey: e.target.value })}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={sshRequest.password || ""}
                    onChange={(e) => setSshRequest({ ...sshRequest, password: e.target.value })}
                    placeholder="password"
                  />
                </div>
                <Button type="submit" disabled={sshMutation.isPending}>
                  {sshMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test SSH Connection
                    </>
                  )}
                </Button>
                {sshMutation.data && (
                  <div className="mt-4 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      {sshMutation.data.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">{sshMutation.data.message}</span>
                    </div>
                    {sshMutation.data.details && (
                      <p className="text-sm text-muted-foreground">{sshMutation.data.details}</p>
                    )}
                    {sshMutation.data.authentication && (
                      <Badge variant="secondary" className="mt-2">
                        {sshMutation.data.authentication}
                      </Badge>
                    )}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sftp">
          <Card>
            <CardHeader>
              <CardTitle>SFTP Connection Test</CardTitle>
              <CardDescription>
                Test SFTP connectivity to a remote host
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSFTPTest} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Host *</Label>
                    <Input
                      value={sshRequest.host}
                      onChange={(e) => setSshRequest({ ...sshRequest, host: e.target.value })}
                      placeholder="example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input
                      type="number"
                      value={sshRequest.port || 22}
                      onChange={(e) => setSshRequest({ ...sshRequest, port: parseInt(e.target.value) || 22 })}
                      placeholder="22"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Username *</Label>
                  <Input
                    value={sshRequest.username}
                    onChange={(e) => setSshRequest({ ...sshRequest, username: e.target.value })}
                    placeholder="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Private Key (SSH Key)</Label>
                  <Textarea
                    value={sshRequest.privateKey || ""}
                    onChange={(e) => setSshRequest({ ...sshRequest, privateKey: e.target.value })}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={sshRequest.password || ""}
                    onChange={(e) => setSshRequest({ ...sshRequest, password: e.target.value })}
                    placeholder="password"
                  />
                </div>
                <Button type="submit" disabled={sftpMutation.isPending}>
                  {sftpMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test SFTP Connection
                    </>
                  )}
                </Button>
                {sftpMutation.data && (
                  <div className="mt-4 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      {sftpMutation.data.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">{sftpMutation.data.message}</span>
                    </div>
                    {sftpMutation.data.details && (
                      <p className="text-sm text-muted-foreground">{sftpMutation.data.details}</p>
                    )}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slurm">
          <Card>
            <CardHeader>
              <CardTitle>SLURM Connection Test</CardTitle>
              <CardDescription>
                Test SLURM cluster connectivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSLURMTest} className="space-y-4">
                <div className="space-y-2">
                  <Label>Host *</Label>
                  <Input
                    value={slurmRequest.host}
                    onChange={(e) => setSlurmRequest({ ...slurmRequest, host: e.target.value })}
                    placeholder="slurm-cluster.example.com"
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>SSH Port</Label>
                    <Input
                      type="number"
                      value={slurmRequest.sshPort || 22}
                      onChange={(e) => setSlurmRequest({ ...slurmRequest, sshPort: parseInt(e.target.value) || 22 })}
                      placeholder="22"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SLURM Port</Label>
                    <Input
                      type="number"
                      value={slurmRequest.slurmPort || 6817}
                      onChange={(e) => setSlurmRequest({ ...slurmRequest, slurmPort: parseInt(e.target.value) || 6817 })}
                      placeholder="6817"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={slurmMutation.isPending}>
                  {slurmMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test SLURM Connection
                    </>
                  )}
                </Button>
                {slurmMutation.data && (
                  <div className="mt-4 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      {slurmMutation.data.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">{slurmMutation.data.message}</span>
                    </div>
                    <div className="grid gap-2 mt-2">
                      {slurmMutation.data.sshPort !== undefined && (
                        <div className="flex items-center gap-2">
                          <Badge variant={slurmMutation.data.sshAccessible ? "default" : "destructive"}>
                            SSH Port {slurmMutation.data.sshPort}
                          </Badge>
                          {slurmMutation.data.sshAccessible ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                      {slurmMutation.data.slurmPort !== undefined && (
                        <div className="flex items-center gap-2">
                          <Badge variant={slurmMutation.data.slurmAccessible ? "default" : "destructive"}>
                            SLURM Port {slurmMutation.data.slurmPort}
                          </Badge>
                          {slurmMutation.data.slurmAccessible ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
