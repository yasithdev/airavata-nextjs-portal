"use client";

import { useState } from "react";
import { Plus, Search, BookOpen, Database, Brain, GitBranch } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ResourceGrid } from "@/components/catalog/ResourceGrid";
import { useCatalogResources, useCatalogTags } from "@/hooks";
import { ResourceType, type ResourceFilters as Filters } from "@/types/catalog";
import { cn } from "@/lib/utils";

// Resource type configuration with icons and labels
const RESOURCE_TYPES = [
  { type: null, label: "All", icon: BookOpen },
  { type: ResourceType.NOTEBOOK, label: "Notebooks", icon: BookOpen },
  { type: ResourceType.DATASET, label: "Datasets", icon: Database },
  { type: ResourceType.MODEL, label: "Models", icon: Brain },
  { type: ResourceType.REPOSITORY, label: "Repos", icon: GitBranch },
] as const;

export default function CatalogPage() {
  const [filters, setFilters] = useState<Filters>({
    pageSize: 20,
    pageNumber: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: resources, isLoading } = useCatalogResources(filters);
  const { data: allTags } = useCatalogTags();

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Debounce the actual filter update
    const timer = setTimeout(() => {
      setFilters({ ...filters, nameSearch: value || undefined });
    }, 400);
    return () => clearTimeout(timer);
  };

  const selectResourceType = (type: ResourceType | null) => {
    setFilters({ ...filters, type: type || undefined });
  };

  const toggleTag = (tagId: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    setFilters({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catalog</h1>
          <p className="text-muted-foreground">
            Discover and share research resources
          </p>
        </div>
        <Button asChild>
          <Link href="/catalog/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Link>
        </Button>
      </div>

      {/* Spotlight-style Search Bar with Inline Type Selectors */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search catalog..."
            className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        
        {/* Divider */}
        <div className="h-6 w-px bg-border" />
        
        {/* Resource Type Selectors */}
        <div className="flex items-center gap-0.5 px-1">
          {RESOURCE_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => selectResourceType(type)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                filters.type === type
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      {allTags && allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {allTags.map((tag) => (
            <Badge
              key={tag.id}
              variant={filters.tags?.includes(tag.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Results */}
      <ResourceGrid resources={resources} isLoading={isLoading} />
    </div>
  );
}
