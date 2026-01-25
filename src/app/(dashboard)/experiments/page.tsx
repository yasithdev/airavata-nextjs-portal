"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, CircleDot, Play, CheckCircle, XCircle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExperimentList } from "@/components/experiment";
import { useExperiments, useDeleteExperiment } from "@/hooks";
import type { ExperimentModel } from "@/types";
import { ExperimentState } from "@/types";
import { cn } from "@/lib/utils";

const statusFilters = [
  { value: "all", label: "All", icon: CircleDot },
  { value: ExperimentState.CREATED, label: "Created", icon: CircleDot },
  { value: ExperimentState.EXECUTING, label: "Running", icon: Play },
  { value: ExperimentState.COMPLETED, label: "Completed", icon: CheckCircle },
  { value: ExperimentState.FAILED, label: "Failed", icon: XCircle },
  { value: ExperimentState.CANCELED, label: "Canceled", icon: Ban },
];

export default function ExperimentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [experimentToDelete, setExperimentToDelete] = useState<ExperimentModel | null>(null);
  
  const { data: experiments, isLoading } = useExperiments({ limit: 100 });
  const deleteExperiment = useDeleteExperiment();

  // Filter experiments
  const filteredExperiments = experiments?.filter((exp) => {
    const matchesSearch = exp.experimentName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || exp.experimentStatus?.[0]?.state === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (experimentToDelete) {
      await deleteExperiment.mutateAsync(experimentToDelete.experimentId);
      setExperimentToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiments</h1>
          <p className="text-muted-foreground">
            View and manage your computational experiments
          </p>
        </div>
        <Button asChild>
          <Link href="/applications">
            <Plus className="mr-2 h-4 w-4" />
            New Experiment
          </Link>
        </Button>
      </div>

      {/* Spotlight-style Search Bar with Inline Status Filters */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search experiments..."
            className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {/* Divider */}
        <div className="h-6 w-px bg-border" />
        
        {/* Status Filters */}
        <div className="flex items-center gap-0.5 px-1">
          {statusFilters.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                statusFilter === value
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

      <ExperimentList
        experiments={filteredExperiments}
        isLoading={isLoading}
        onDelete={setExperimentToDelete}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!experimentToDelete} onOpenChange={() => setExperimentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Experiment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{experimentToDelete?.experimentName}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setExperimentToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteExperiment.isPending}
            >
              {deleteExperiment.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
