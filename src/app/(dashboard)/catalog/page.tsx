"use client";

import { useState, useMemo } from "react";
import { Plus, Search, BookOpen, Database, Brain, GitBranch, AppWindow, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResourceCard } from "@/components/catalog/ResourceCard";
import { ApplicationCard } from "@/components/application/ApplicationCard";
import { useCatalogResources, useCatalogTags, useApplicationInterfaces } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { dataProductsApi } from "@/lib/api";
import { ResourceType, type ResourceFilters as Filters } from "@/types/catalog";
import type { CatalogResource } from "@/types/catalog";
import { cn } from "@/lib/utils";
import type { ApplicationInterfaceDescription } from "@/types";
import { useGateway } from "@/contexts/GatewayContext";
import { usePortalConfig } from "@/contexts/PortalConfigContext";
import { CreateApplicationWizard } from "@/components/applications/CreateApplicationWizard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddDatasetModal } from "@/components/catalog/AddDatasetModal";
import { AddRepositoryModal } from "@/components/catalog/AddRepositoryModal";
import { applicationsApi, apiClient } from "@/lib/api";
import { toast } from "@/hooks/useToast";

// Resource type configuration with icons and labels (order: applications, repositories, datasets)
const RESOURCE_TYPES = [
  { type: null, label: "All", icon: BookOpen },
  { type: "APPLICATION", label: "Applications", icon: AppWindow },
  { type: ResourceType.REPOSITORY, label: "Repositories", icon: GitBranch },
  { type: ResourceType.DATASET, label: "Datasets", icon: Database },
] as const;

export default function CatalogPage() {
  const router = useRouter();
  const { selectedGatewayId } = useGateway();
  const { defaultGatewayId } = usePortalConfig();
  const gatewayId = selectedGatewayId || defaultGatewayId;
  
  const [filters, setFilters] = useState<Filters>({
    pageSize: 20,
    pageNumber: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | ResourceType | null>(null);
  const [isCreateAppOpen, setIsCreateAppOpen] = useState(false);
  const [isCreateDatasetOpen, setIsCreateDatasetOpen] = useState(false);
  const [isCreateRepositoryOpen, setIsCreateRepositoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Build catalog filters - only fetch repositories from catalog API
  // Datasets come from data products API
  const catalogFilters: Filters | undefined = useMemo(() => {
    // Only fetch repositories when showing all or repositories
    if (selectedType === null || selectedType === ResourceType.REPOSITORY) {
      return {
        ...filters,
        type: ResourceType.REPOSITORY,
      };
    }
    // Return undefined to disable the query when showing only datasets or applications
    return undefined;
  }, [filters, selectedType]);
  
  // Only fetch catalog resources (repositories) when needed
  const shouldFetchRepositories = selectedType === null || selectedType === ResourceType.REPOSITORY;
  const { data: resources = [], isLoading: resourcesLoading, error: resourcesError } = useCatalogResources(
    shouldFetchRepositories ? catalogFilters : undefined
  );
  
  // Only fetch data products (datasets) when needed
  const shouldFetchDatasets = selectedType === null || selectedType === ResourceType.DATASET;
  const { data: dataProducts = [], isLoading: dataProductsLoading, error: dataProductsError } = useQuery({
    queryKey: ["data-products", "public", shouldFetchDatasets ? (filters.nameSearch ?? "") : null, filters.pageNumber ?? 0, filters.pageSize ?? 20],
    queryFn: async () => {
      if (!shouldFetchDatasets) return [];
      try {
        return await dataProductsApi.getPublic(filters.nameSearch ?? "", filters.pageNumber ?? 0, filters.pageSize ?? 20);
      } catch (error: any) {
        // If it's a 404, treat it as no datasets available (endpoint might not exist)
        if (error?.response?.status === 404) {
          console.warn("Data products public endpoint not found (404), treating as empty");
          return [];
        }
        console.error("Error fetching public data products:", error);
        throw error;
      }
    },
    enabled: shouldFetchDatasets,
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const { data: allTags } = useCatalogTags();
  const { data: applications, isLoading: applicationsLoading, refetch: refetchApplications } = useApplicationInterfaces();

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

  const filteredResources = useMemo(() => {
    if (!resources) return [];
    if (selectedType === "APPLICATION") return [];
    return resources;
  }, [resources, selectedType]);

  const datasetItems = useMemo((): CatalogResource[] => {
    if (!shouldFetchDatasets || !dataProducts || dataProducts.length === 0) return [];
    return dataProducts.map((dp) =>
      ({
        id: dp.productUri,
        type: ResourceType.DATASET,
        name: dp.productName ?? "",
        description: dp.productDescription ?? "",
        authors: dp.authors ?? [],
        tags: (dp.tags ?? []).map((t) => ({ id: t.id ?? t.name ?? "", name: t.name ?? t.id ?? "" })),
        headerImage: dp.headerImage,
      }) as CatalogResource
    );
  }, [shouldFetchDatasets, dataProducts]);

  const allItems = useMemo(() => {
    const items: Array<{ type: "APPLICATION" | ResourceType; data: ApplicationInterfaceDescription | CatalogResource }> = [];

    if (selectedType === null) {
      filteredApplications.forEach((app) => {
        items.push({ type: "APPLICATION", data: app });
      });
      const repos = filteredResources.filter((r) => r.type === ResourceType.REPOSITORY);
      repos.forEach((r) => items.push({ type: ResourceType.REPOSITORY, data: r }));
      datasetItems.forEach((r) => items.push({ type: ResourceType.DATASET, data: r }));
    } else if (selectedType === "APPLICATION") {
      filteredApplications.forEach((app) => {
        items.push({ type: "APPLICATION", data: app });
      });
    } else if (selectedType === ResourceType.DATASET) {
      datasetItems.forEach((r) => items.push({ type: ResourceType.DATASET, data: r }));
    } else {
      filteredResources.forEach((resource) => {
        items.push({ type: resource.type, data: resource });
      });
    }

    return items;
  }, [filteredApplications, filteredResources, datasetItems, selectedType]);

  const handleCreateModule = async (moduleData: any): Promise<{ moduleId: string }> => {
    if (!gatewayId) {
      throw new Error("Please select a gateway");
    }
    
    const result = await apiClient.post<{ moduleId: string }>(`/api/v1/application-modules?gatewayId=${gatewayId}`, moduleData);
    toast({
      title: "Module created",
      description: "Application module created successfully.",
    });
    return result;
  };

  const handleCreateInterface = async (interfaceData: any) => {
    if (!gatewayId) {
      toast({
        title: "Error",
        description: "Please select a gateway",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const result = await apiClient.post<{ applicationInterfaceId: string }>(`/api/v1/application-interfaces?gatewayId=${gatewayId}`, interfaceData);
      toast({
        title: "Application created",
        description: "Application interface created successfully.",
      });
      setIsCreateAppOpen(false);
      refetchApplications();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : "Failed to create interface";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Create application interface error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = resourcesLoading || applicationsLoading || (shouldFetchDatasets && dataProductsLoading);
  const hasResults = allItems.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catalog</h1>
          <p className="text-muted-foreground">
            Discover applications and research resources
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsCreateAppOpen(true)}>
              <AppWindow className="mr-2 h-4 w-4" />
              Application
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsCreateRepositoryOpen(true)}>
              <GitBranch className="mr-2 h-4 w-4" />
              Repository
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsCreateDatasetOpen(true)}>
              <Database className="mr-2 h-4 w-4" />
              Dataset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search Bar with Inline Type Selectors */}
      <SearchBar
        placeholder="Search catalog..."
        value={searchTerm}
        onChange={(value) => handleSearchChange(value)}
      >
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-0.5 px-1">
          {RESOURCE_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={label}
              type="button"
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
      </SearchBar>

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

      {/* Error Display - only show non-404 errors */}
      {((resourcesError && (resourcesError as any)?.response?.status !== 404) || 
        (dataProductsError && (dataProductsError as any)?.response?.status !== 404)) && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Error loading resources</h3>
              <p className="text-muted-foreground mt-2">
                {resourcesError instanceof Error ? resourcesError.message : dataProductsError instanceof Error ? dataProductsError.message : "Failed to load catalog resources"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results - Unified Card Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : (resourcesError || dataProductsError) ? null : !hasResults ? (
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
              const resource = item.data as CatalogResource;
              return (
                <ResourceCard key={`resource-${resource.id}`} resource={resource} />
              );
            }
          })}
        </div>
      )}

      {/* Create Application Wizard Dialog */}
      <Dialog open={isCreateAppOpen} onOpenChange={setIsCreateAppOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Application</DialogTitle>
            <DialogDescription>
              Follow the steps below to create and configure your application
            </DialogDescription>
          </DialogHeader>
          
          <CreateApplicationWizard
            gatewayId={gatewayId}
            onCreateModule={handleCreateModule}
            onCreateInterface={handleCreateInterface}
            onCancel={() => setIsCreateAppOpen(false)}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>

      {/* Add Dataset Modal */}
      <AddDatasetModal open={isCreateDatasetOpen} onOpenChange={setIsCreateDatasetOpen} />

      {/* Add Repository Modal */}
      <AddRepositoryModal open={isCreateRepositoryOpen} onOpenChange={setIsCreateRepositoryOpen} />
    </div>
  );
}
