"use client";

import { useState } from "react";
import { SearchBar } from "@/components/ui/search-bar";
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
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground">
          Browse available applications and create new experiments
        </p>
      </div>

      <SearchBar
        placeholder="Search applications..."
        value={search}
        onChange={setSearch}
        wrapperClassName="max-w-xl"
      />

      <ApplicationList applications={filteredApplications} isLoading={isLoading} />
    </div>
  );
}
