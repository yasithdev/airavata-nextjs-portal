"use client";

import { useState } from "react";
import { HardDrive, Database, Plus, Globe, Users, ChevronRight, Home, Upload, FolderPlus, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBrowser } from "@/components/storage";
import { useQuery } from "@tanstack/react-query";
import { storageResourcesApi } from "@/lib/api";
import { useGateway } from "@/contexts/GatewayContext";
import { usePortalConfig } from "@/contexts/PortalConfigContext";
import { StorageResourceModal } from "@/components/storage";
import { toast } from "@/hooks/useToast";


// Storage Resources List Component
function StorageResourcesList({ gatewayId, searchTerm }: { gatewayId: string; searchTerm: string }) {
  const { data: storageResources, isLoading } = useQuery({
    queryKey: ["storageResources", gatewayId],
    queryFn: () => storageResourcesApi.list(),
  });

  // Handle both map and array formats
  const resourcesArray = Array.isArray(storageResources)
    ? storageResources
    : storageResources && typeof storageResources === "object"
    ? Object.entries(storageResources as Record<string, string>).map(([id, name]) => ({
        storageResourceId: id,
        hostName: name || id,
      }))
    : [];

  const filteredResources = resourcesArray.filter((resource) => {
    const id = resource.storageResourceId || "";
    const name = resource.hostName || "";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Protocol</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))}
            </>
          ) : filteredResources.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <Database className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? "No storage resources found" : "No storage resources configured"}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredResources.map((resource) => {
              const id = resource.storageResourceId || "";
              const name = resource.hostName || id;
              return (
                <StorageResourceTableRow
                  key={id}
                  resourceId={id}
                  name={name}
                  gatewayId={gatewayId}
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Storage Resource Table Row with hierarchy checking
function StorageResourceTableRow({ resourceId, name, gatewayId }: { resourceId: string; name: string; gatewayId: string }) {
  const { data: hierarchy, isLoading: hierarchyLoading } = useQuery({
    queryKey: ["storageResourceHierarchy", resourceId, gatewayId],
    queryFn: () => storageResourcesApi.getHierarchy(resourceId, gatewayId),
    enabled: !!gatewayId && !!resourceId,
  });

  const copyResourceId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(resourceId);
    toast({ title: "Copied", description: "Resource ID copied to clipboard." });
  };

  return (
    <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => window.location.href = `/${gatewayId}/storage/${resourceId}`}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-70 hover:opacity-100"
            onClick={copyResourceId}
            title={`Copy ${resourceId}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">SFTP</Badge>
      </TableCell>
      <TableCell>
        {hierarchyLoading ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          <Badge variant="outline" className="text-xs">
            {hierarchy?.level === "GATEWAY" ? (
              <Globe className="h-3 w-3 mr-1 inline" />
            ) : hierarchy?.level === "GROUP" ? (
              <Users className="h-3 w-3 mr-1 inline" />
            ) : null}
            {hierarchy?.level === "GATEWAY" ? "GATEWAY" : hierarchy?.level === "GROUP" ? "DELEGATED" : "USER"}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="secondary">Active</Badge>
      </TableCell>
    </TableRow>
  );
}

export default function StoragePage() {
  const { effectiveGatewayId } = useGateway();
  const { defaultGatewayId } = usePortalConfig();
  const gatewayId = effectiveGatewayId || defaultGatewayId;

  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"files" | "resources">("resources");
  const [storageResourceSearch, setStorageResourceSearch] = useState("");
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // In a real implementation, this would fetch from the API
  const files: any[] = [];
  const isLoading = false;

  const handleUpload = () => {
    console.log("Upload clicked");
  };

  const handleCreateFolder = () => {
    console.log("Create folder clicked");
  };

  const searchPlaceholder = activeTab === "resources" ? "Search storage resources..." : "Search files...";
  const searchValue = activeTab === "resources" ? storageResourceSearch : fileSearchQuery;
  const setSearchValue = activeTab === "resources" ? setStorageResourceSearch : setFileSearchQuery;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage</h1>
          <p className="text-muted-foreground">
            Manage your files and storage resources
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      <StorageResourceModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <SearchBar
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={setSearchValue}
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "files" | "resources")} className="space-y-4">
        <TabsList>
          <TabsTrigger value="resources" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
            <Database className="h-4 w-4" />
            Storage Resources
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
            <HardDrive className="h-4 w-4" />
            My Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">

          {/* File Explorer Card */}
          <Card className="overflow-hidden">
            {/* Toolbar row: Home, breadcrumbs, and action buttons */}
            <div className="flex items-center justify-between h-12 px-4 border-b bg-muted/30">
              <div className="flex items-center gap-1 text-sm min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={() => setCurrentPath([])}
                  title="Home"
                >
                  <Home className="h-4 w-4" />
                </Button>
                {currentPath.length > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                  {currentPath.map((segment, idx) => (
                    <div key={idx} className="flex items-center min-w-0">
                      {idx > 0 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 font-medium truncate"
                        onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))}
                      >
                        {segment}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button size="sm" onClick={handleUpload}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
                <Button variant="outline" size="sm" onClick={handleCreateFolder}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Folder
                </Button>
              </div>
            </div>

            {/* File list content */}
            <CardContent className="p-0">
              <FileBrowser
                files={files}
                isLoading={isLoading}
                currentPath={currentPath}
                onNavigate={setCurrentPath}
                hideToolbar={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <StorageResourcesList gatewayId={gatewayId} searchTerm={storageResourceSearch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
