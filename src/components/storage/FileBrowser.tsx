"use client";

import { useState } from "react";
import {
  Folder,
  File,
  Upload,
  FolderPlus,
  Trash2,
  Download,
  MoreVertical,
  ChevronRight,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { DataProductModel } from "@/types";
import { DataProductType } from "@/types";
import { formatBytes, formatDate } from "@/lib/utils";

interface FileBrowserProps {
  files?: DataProductModel[];
  isLoading?: boolean;
  currentPath?: string[];
  onNavigate?: (path: string[]) => void;
  onUpload?: () => void;
  onCreateFolder?: () => void;
  onDelete?: (file: DataProductModel) => void;
  onDownload?: (file: DataProductModel) => void;
  hideToolbar?: boolean;
}

export function FileBrowser({
  files = [],
  isLoading,
  currentPath = [],
  onNavigate,
  onUpload,
  onCreateFolder,
  onDelete,
  onDownload,
  hideToolbar = false,
}: FileBrowserProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const toggleSelect = (uri: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(uri)) {
        next.delete(uri);
      } else {
        next.add(uri);
      }
      return next;
    });
  };

  const handleFileClick = (file: DataProductModel) => {
    if (file.dataProductType === DataProductType.COLLECTION) {
      onNavigate?.([...currentPath, file.productName]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hideToolbar && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <Button variant="outline" size="sm" onClick={onCreateFolder}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </div>
            {selectedFiles.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.size} selected
                </span>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => onNavigate?.([])}
            >
              <Home className="h-4 w-4" />
            </Button>
            {currentPath.map((segment, idx) => (
              <div key={idx} className="flex items-center">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => onNavigate?.(currentPath.slice(0, idx + 1))}
                >
                  {segment}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* File List */}
      <div className={hideToolbar ? "divide-y" : "border rounded-lg divide-y"}>
        {files.length === 0 ? (
          <div className="py-16 px-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <Folder className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground">This folder is empty</p>
                <p className="text-sm text-muted-foreground/70">
                  Upload files or create a new folder to get started
                </p>
              </div>
            </div>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.productUri}
              className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
              onClick={() => handleFileClick(file)}
            >
              <input
                type="checkbox"
                checked={selectedFiles.has(file.productUri)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleSelect(file.productUri);
                }}
                className="rounded border-gray-300"
              />
              {file.dataProductType === DataProductType.COLLECTION ? (
                <Folder className="h-8 w-8 text-yellow-500" />
              ) : (
                <File className="h-8 w-8 text-blue-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.productName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(file.lastModifiedTime)}
                </p>
              </div>
              {file.dataProductType === DataProductType.FILE && (
                <span className="text-sm text-muted-foreground">
                  {formatBytes(file.productSize)}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {file.dataProductType === DataProductType.FILE && (
                    <DropdownMenuItem onClick={() => onDownload?.(file)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onDelete?.(file)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
