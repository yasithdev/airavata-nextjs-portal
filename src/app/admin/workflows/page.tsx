"use client";

import { FileCode, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function WorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Manage workflow definitions and templates
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Workflow
        </Button>
      </div>

      <SearchBar
        placeholder="Search workflows..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <Card>
        <CardContent className="py-12 text-center">
          <FileCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Workflow management coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
