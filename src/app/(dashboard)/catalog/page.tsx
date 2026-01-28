"use client";

import { useState, useMemo } from "react";
import { Plus, Search, BookOpen, Database, Brain, GitBranch, AppWindow } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceCard } from "@/components/catalog/ResourceCard";
import { ApplicationCard } from "@/components/application/ApplicationCard";
import { useCatalogResources, useCatalogTags, useApplicationInterfaces } from "@/hooks";
import { ResourceType, type ResourceFilters as Filters } from "@/types/catalog";
import { cn } from "@/lib/utils";
import type { ApplicationInterfaceDescription } from "@/types";

// Resource type configuration with icons and labels (order: applications, repositories, datasets)
const RESOURCE_TYPES = [
  { type: null, label: "All", icon: BookOpen },
  { type: "APPLICATION", label: "Applications", icon: AppWindow },
  { type: ResourceType.REPOSITORY, label: "Repositories", icon: GitBranch },
  { type: ResourceType.DATASET, label: "Datasets", icon: Database },
] as const;

export default function CatalogPage() {
  const [filters, setFilters] = useState<Filters>({
    pageSize: 20,
    pageNumber: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | ResourceType | null>(null);

  const { data: resources, isLoading: resourcesLoading } = useCatalogResources(filters);
  const { data: allTags } = useCatalogTags();
  const { data: applications, isLoading: applicationsLoading } = useApplicationInterfaces();

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Debounce the actual filter update
    const timer = setTimeout(() => {
      setFilters({ ...filters, nameSearch: value || undefined });
    }, 400);
    return () => clearTimeout(timer);
  };

  const selectResourceType = (type: string | ResourceType | null) => {
    setSelectedType(type);
    if (type === "APPLICATION") {
      // Don't set catalog filters for applications
      return;
    }
    setFilters({ ...filters, type: type === null ? undefined : type as ResourceType });
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

  // Filter applications by search
  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    if (selectedType !== null && selectedType !== "APPLICATION") return [];
    if (!searchTerm) return applications;
    const searchLower = searchTerm.toLowerCase();
    return applications.filter((app) =>
      app.applicationName.toLowerCase().includes(searchLower) ||
      app.applicationDescription?.toLowerCase().includes(searchLower)
    );
  }, [applications, searchTerm, selectedType]);

  // Filter resources by search (already filtered by type via filters)
  const filteredResources = useMemo(() => {
    if (!resources) return [];
    if (selectedType === "APPLICATION") return [];
    return resources;
  }, [resources, selectedType]);

  // Combine all items; order: applications, repositories, datasets
  const allItems = useMemo(() => {
    const items: Array<{ type: "APPLICATION" | ResourceType; data: ApplicationInterfaceDescription | any }> = [];

    if (selectedType === null) {
      filteredApplications.forEach((app) => {
        items.push({ type: "APPLICATION", data: app });
      });
      const repos = filteredResources.filter((r) => r.type === ResourceType.REPOSITORY);
      const datasets = filteredResources.filter((r) => r.type === ResourceType.DATASET);
      repos.forEach((r) => items.push({ type: ResourceType.REPOSITORY, data: r }));
      datasets.forEach((r) => items.push({ type: ResourceType.DATASET, data: r }));
    } else if (selectedType === "APPLICATION") {
      filteredApplications.forEach((app) => {
        items.push({ type: "APPLICATION", data: app });
      });
    } else {
      filteredResources.forEach((resource) => {
        items.push({ type: resource.type, data: resource });
      });
    }

    return items;
  }, [filteredApplications, filteredResources, selectedType]);

  const isLoading = resourcesLoading || applicationsLoading;
  const hasResults = allItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catalog</h1>
          <p className="text-muted-foreground">
            Discover applications and research resources
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
                (type === null ? selectedType === null : selectedType === type)
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

      {/* Tags - only show for catalog resources, not applications */}
      {selectedType !== "APPLICATION" && allTags && allTags.length > 0 && (
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

      {/* Results - Unified Card Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : !hasResults ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No results found</h3>
              <p className="text-muted-foreground mt-2">
                Try adjusting your filters or search terms
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allItems.map((item) => {
            if (item.type === "APPLICATION") {
              const app = item.data as ApplicationInterfaceDescription;
              return (
                <ApplicationCard key={`app-${app.applicationInterfaceId}`} application={app} />
              );
            } else {
              const resource = item.data;
              return (
                <ResourceCard key={`resource-${resource.id}`} resource={resource} />
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
