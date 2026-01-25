"use client";

import { useState } from "react";
import { HardDrive } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBrowser } from "@/components/storage";

export default function StoragePage() {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  
  // In a real implementation, this would fetch from the API
  const files: any[] = [];
  const isLoading = false;

  const handleUpload = () => {
    // Open file upload dialog
    console.log("Upload clicked");
  };

  const handleCreateFolder = () => {
    // Open create folder dialog
    console.log("Create folder clicked");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Storage</h1>
        <p className="text-muted-foreground">
          Manage your files and experiment data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0 GB</p>
            <p className="text-xs text-muted-foreground">of unlimited</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Files</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">total files</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Folders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">total folders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shared</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">shared items</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            My Files
          </CardTitle>
          <CardDescription>Browse and manage your storage</CardDescription>
        </CardHeader>
        <CardContent>
          <FileBrowser
            files={files}
            isLoading={isLoading}
            currentPath={currentPath}
            onNavigate={setCurrentPath}
            onUpload={handleUpload}
            onCreateFolder={handleCreateFolder}
          />
        </CardContent>
      </Card>
    </div>
  );
}
