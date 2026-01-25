"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useCatalogTags } from "@/hooks";
import type { CatalogResource } from "@/types/catalog";
import { ResourceType, Privacy } from "@/types/catalog";

interface Props {
  resource?: CatalogResource;
  onSubmit: (resource: Partial<CatalogResource>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function CatalogResourceForm({ resource, onSubmit, onCancel, isLoading }: Props) {
  const [formData, setFormData] = useState<Partial<CatalogResource>>({
    name: resource?.name || "",
    description: resource?.description || "",
    type: resource?.type || ResourceType.NOTEBOOK,
    privacy: resource?.privacy || Privacy.PUBLIC,
    authors: resource?.authors || [],
    tags: resource?.tags || [],
    notebookPath: resource?.type === ResourceType.NOTEBOOK ? (resource as any).notebookPath : "",
    jupyterServerUrl: resource?.type === ResourceType.NOTEBOOK ? (resource as any).jupyterServerUrl : "",
    datasetUrl: resource?.type === ResourceType.DATASET ? (resource as any).datasetUrl : "",
    size: resource?.type === ResourceType.DATASET ? (resource as any).size : undefined,
    format: resource?.type === ResourceType.DATASET ? (resource as any).format : "",
    repositoryUrl: resource?.type === ResourceType.REPOSITORY ? (resource as any).repositoryUrl : "",
    branch: resource?.type === ResourceType.REPOSITORY ? (resource as any).branch : "",
    commit: resource?.type === ResourceType.REPOSITORY ? (resource as any).commit : "",
    applicationInterfaceId: resource?.type === ResourceType.MODEL ? (resource as any).applicationInterfaceId : "",
    modelUrl: resource?.type === ResourceType.MODEL ? (resource as any).modelUrl : "",
    framework: resource?.type === ResourceType.MODEL ? (resource as any).framework : "",
  });

  const [newAuthor, setNewAuthor] = useState("");
  const [newTag, setNewTag] = useState("");
  const { data: availableTags } = useCatalogTags();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      alert("Name and description are required");
      return;
    }

    // Build resource based on type
    const resourceData: Partial<CatalogResource> = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      privacy: formData.privacy,
      authors: formData.authors,
      tags: formData.tags,
    };

    // Add type-specific fields
    if (formData.type === ResourceType.NOTEBOOK) {
      (resourceData as any).notebookPath = formData.notebookPath || "";
      if (formData.jupyterServerUrl) {
        (resourceData as any).jupyterServerUrl = formData.jupyterServerUrl;
      }
    } else if (formData.type === ResourceType.DATASET) {
      (resourceData as any).datasetUrl = formData.datasetUrl || "";
      if (formData.size) (resourceData as any).size = formData.size;
      if (formData.format) (resourceData as any).format = formData.format;
    } else if (formData.type === ResourceType.REPOSITORY) {
      (resourceData as any).repositoryUrl = formData.repositoryUrl || "";
      if (formData.branch) (resourceData as any).branch = formData.branch;
      if (formData.commit) (resourceData as any).commit = formData.commit;
    } else if (formData.type === ResourceType.MODEL) {
      if (formData.applicationInterfaceId) {
        (resourceData as any).applicationInterfaceId = formData.applicationInterfaceId;
      }
      if (formData.modelUrl) (resourceData as any).modelUrl = formData.modelUrl;
      if (formData.framework) (resourceData as any).framework = formData.framework;
    }

    await onSubmit(resourceData);
  };

  const addAuthor = () => {
    if (newAuthor.trim() && !formData.authors?.includes(newAuthor.trim())) {
      setFormData({
        ...formData,
        authors: [...(formData.authors || []), newAuthor.trim()],
      });
      setNewAuthor("");
    }
  };

  const removeAuthor = (author: string) => {
    setFormData({
      ...formData,
      authors: formData.authors?.filter((a) => a !== author) || [],
    });
  };

  const addTag = () => {
    if (newTag.trim()) {
      const tagName = newTag.trim();
      const existingTag = formData.tags?.find((t) => t.name === tagName);
      if (!existingTag) {
        setFormData({
          ...formData,
          tags: [...(formData.tags || []), { id: tagName, name: tagName }],
        });
      }
      setNewTag("");
    }
  };

  const removeTag = (tagId: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t.id !== tagId) || [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter resource name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your resource"
              rows={4}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Resource Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as ResourceType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ResourceType.NOTEBOOK}>Notebook</SelectItem>
                  <SelectItem value={ResourceType.DATASET}>Dataset</SelectItem>
                  <SelectItem value={ResourceType.REPOSITORY}>Repository</SelectItem>
                  <SelectItem value={ResourceType.MODEL}>Model</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy *</Label>
              <Select
                value={formData.privacy}
                onValueChange={(value) => setFormData({ ...formData, privacy: value as Privacy })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Privacy.PUBLIC}>Public</SelectItem>
                  <SelectItem value={Privacy.PRIVATE}>Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type-specific fields */}
      {formData.type === ResourceType.NOTEBOOK && (
        <Card>
          <CardHeader>
            <CardTitle>Notebook Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notebookPath">Notebook Path *</Label>
              <Input
                id="notebookPath"
                value={formData.notebookPath}
                onChange={(e) => setFormData({ ...formData, notebookPath: e.target.value })}
                placeholder="/path/to/notebook.ipynb"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jupyterServerUrl">Jupyter Server URL (optional)</Label>
              <Input
                id="jupyterServerUrl"
                value={formData.jupyterServerUrl}
                onChange={(e) => setFormData({ ...formData, jupyterServerUrl: e.target.value })}
                placeholder="https://jupyter.example.com"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {formData.type === ResourceType.DATASET && (
        <Card>
          <CardHeader>
            <CardTitle>Dataset Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="datasetUrl">Dataset URL *</Label>
              <Input
                id="datasetUrl"
                value={formData.datasetUrl}
                onChange={(e) => setFormData({ ...formData, datasetUrl: e.target.value })}
                placeholder="https://example.com/dataset"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="size">Size (bytes, optional)</Label>
                <Input
                  id="size"
                  type="number"
                  value={formData.size || ""}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="1024000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Format (optional)</Label>
                <Input
                  id="format"
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  placeholder="CSV, JSON, etc."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {formData.type === ResourceType.REPOSITORY && (
        <Card>
          <CardHeader>
            <CardTitle>Repository Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repositoryUrl">Repository URL *</Label>
              <Input
                id="repositoryUrl"
                value={formData.repositoryUrl}
                onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                placeholder="https://github.com/user/repo"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch (optional)</Label>
                <Input
                  id="branch"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="main"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commit">Commit (optional)</Label>
                <Input
                  id="commit"
                  value={formData.commit}
                  onChange={(e) => setFormData({ ...formData, commit: e.target.value })}
                  placeholder="abc123..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {formData.type === ResourceType.MODEL && (
        <Card>
          <CardHeader>
            <CardTitle>Model Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="applicationInterfaceId">Application Interface ID (optional)</Label>
              <Input
                id="applicationInterfaceId"
                value={formData.applicationInterfaceId}
                onChange={(e) => setFormData({ ...formData, applicationInterfaceId: e.target.value })}
                placeholder="Application interface ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelUrl">Model URL (optional)</Label>
              <Input
                id="modelUrl"
                value={formData.modelUrl}
                onChange={(e) => setFormData({ ...formData, modelUrl: e.target.value })}
                placeholder="https://example.com/model"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="framework">Framework (optional)</Label>
              <Input
                id="framework"
                value={formData.framework}
                onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                placeholder="TensorFlow, PyTorch, etc."
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Authors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAuthor();
                }
              }}
              placeholder="Enter author name or email"
            />
            <Button type="button" onClick={addAuthor} variant="outline">
              Add
            </Button>
          </div>
          {formData.authors && formData.authors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.authors.map((author) => (
                <Badge key={author} variant="secondary" className="gap-1">
                  {author}
                  <button
                    type="button"
                    onClick={() => removeAuthor(author)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Enter tag name"
              list="available-tags"
            />
            <datalist id="available-tags">
              {availableTags?.map((tag) => (
                <option key={tag.id} value={tag.name} />
              ))}
            </datalist>
            <Button type="button" onClick={addTag} variant="outline">
              Add
            </Button>
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="gap-1" style={{ backgroundColor: tag.color }}>
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => removeTag(tag.id)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
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
          {isLoading ? "Creating..." : resource ? "Update Resource" : "Create Resource"}
        </Button>
      </div>
    </form>
  );
}
