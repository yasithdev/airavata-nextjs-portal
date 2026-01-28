"use client";

import Link from "next/link";
import { Database, GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CatalogResource } from "@/types/catalog";
import { ResourceType } from "@/types/catalog";

interface Props {
  resource: CatalogResource;
}

export function ResourceCard({ resource }: Props) {
  const getIcon = () => {
    switch (resource.type) {
      case ResourceType.DATASET:
        return <Database className="h-5 w-5" />;
      case ResourceType.REPOSITORY:
        return <GitBranch className="h-5 w-5" />;
      default:
        return <GitBranch className="h-5 w-5" />;
    }
  };

  return (
    <Link href={getCatalogResourcePermalink(resource.id, resource.type)}>
      <Card className="h-full transition-colors hover:bg-accent cursor-pointer">
        {resource.headerImage && (
          <div className="h-48 overflow-hidden rounded-t-lg">
            <img
              src={resource.headerImage}
              alt={resource.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getIcon()}
              <h3 className="font-semibold line-clamp-1">{resource.name}</h3>
            </div>
            <Badge variant="secondary">{resource.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
          {resource.authors && resource.authors.length > 0 && (
            <div className="text-xs text-muted-foreground">
              By {resource.authors.join(", ")}
            </div>
          )}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resource.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {resource.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{resource.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
