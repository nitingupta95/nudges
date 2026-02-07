"use client";
import { useState, useMemo } from "react"; 
import { fetchJobs } from "@/lib/api"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import { domains, experienceLevels, locations } from "@/mock/data";
import type { JobFilters } from "@/types";
import { Search, X, SlidersHorizontal, Briefcase } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { JobCardSkeleton } from "./job-card-skelton";
import { JobCard } from "./job-card";

const ITEMS_PER_PAGE = 6;

export function JobList() {
  const [filters, setFilters] = useState<JobFilters>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilters = useMemo(
    () => ({ ...filters, search: search || undefined }),
    [filters, search]
  );

  const { data: jobs, loading, error, refetch } = useApi(
    () => fetchJobs(activeFilters),
    [JSON.stringify(activeFilters)]
  );

  const paginatedJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.slice(0, page * ITEMS_PER_PAGE);
  }, [jobs, page]);

  const hasMore = jobs ? paginatedJobs.length < jobs.length : false;

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = () => {
    setFilters({});
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Search & filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search roles, companies, or skills…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
            aria-label="Search jobs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter chips */}
      {filtersOpen && (
        <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t("dashboard.filters.domain")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {domains.map((d) => (
                <button
                  key={d}
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      domain: f.domain === d ? undefined : d,
                    }))
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    filters.domain === d
                      ? "border-accent bg-accent/10 text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t("dashboard.filters.experience")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {experienceLevels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      experienceLevel:
                        f.experienceLevel === lvl ? undefined : lvl,
                    }))
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    filters.experienceLevel === lvl
                      ? "border-accent bg-accent/10 text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t("dashboard.filters.location")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      location: f.location === loc ? undefined : loc,
                    }))
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    filters.location === loc
                      ? "border-accent bg-accent/10 text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              {t("dashboard.filters.clear")}
            </Button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <span className="text-destructive">{error}</span>
          <Button variant="outline" size="sm" onClick={refetch}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && !jobs && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && jobs && jobs.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed bg-card p-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-foreground">No roles found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.empty")}
            </p>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              {t("dashboard.filters.clear")}
            </Button>
          )}
        </div>
      )}

      {/* Job grid */}
      {jobs && jobs.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
              >
                Load more roles
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
