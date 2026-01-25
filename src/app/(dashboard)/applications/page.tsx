"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ApplicationList } from "@/components/application";
import { useApplicationInterfaces } from "@/hooks";

export default function ApplicationsPage() {
  const [search, setSearch] = useState("");
  const { data: applications, isLoading } = useApplicationInterfaces();

  const filteredApplications = applications?.filter((app) =>
    app.applicationName.toLowerCase().includes(search.toLowerCase()) ||
    app.applicationDescription?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground">
          Browse available applications and create new experiments
        </p>
      </div>

      {/* Spotlight-style Search Bar */}
      <div className="flex items-center p-1 bg-muted/50 rounded-lg border max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ApplicationList applications={filteredApplications} isLoading={isLoading} />
    </div>
  );
}
