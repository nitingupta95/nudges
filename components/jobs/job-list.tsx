"use client";
import { useState, useMemo, useEffect } from "react";
import { fetchJobs } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import { domains, experienceLevels, locations } from "@/mock/data";
import type { JobFilters, MemberProfile } from "@/types";
import { Search, X, SlidersHorizontal, Briefcase, ArrowUpDown } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { JobCardSkeleton } from "./job-card-skelton";
import { JobCard } from "./job-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 6;

type SortOption = "newest" | "closingSoon" | "bestFit";

interface JobListProps {
  memberProfile?: MemberProfile | null;
}

export function JobList({ memberProfile }: JobListProps) {
  const [filters, setFilters] = useState<JobFilters>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const activeFilters = useMemo(
    () => ({ ...filters, search: search || undefined }),
    [filters, search]
  );

  const { data: jobs, loading, error, refetch } = useApi(
    () => fetchJobs(activeFilters),
    [JSON.stringify(activeFilters)]
  );

  // Sort jobs based on selected option
  const sortedJobs = useMemo(() => {
    if (!jobs) return [];

    const jobsCopy = [...jobs];

    switch (sortBy) {
      case "closingSoon":
        return jobsCopy.sort((a, b) => {
          if (!a.closingDate) return 1;
          if (!b.closingDate) return -1;
          return new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime();
        });

      case "bestFit":
        // This would require fit scores - for now just return as is
        // In a real implementation, calculate fit scores and sort
        return jobsCopy;

      case "newest":
      default:
        return jobsCopy.sort((a, b) =>
          new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        );
    }
  }, [jobs, sortBy]);

  const paginatedJobs = useMemo(() => {
    return sortedJobs.slice(0, page * ITEMS_PER_PAGE);
  }, [sortedJobs, page]);

  const hasMore = sortedJobs.length > paginatedJobs.length;

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = () => {
    setFilters({});
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Search, filter & sort bar */}
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

        {/* Sort dropdown */}
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="closingSoon">Closing soon</SelectItem>
            {memberProfile && <SelectItem value="bestFit">Best fit</SelectItem>}
          </SelectContent>
        </Select>

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

      {/* Quick filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setFilters({});
            setPage(1);
          }}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${Object.keys(filters).length === 0
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:border-primary/50"
            }`}
        >
          All Jobs
        </button>
        <button
          onClick={() => {
            setFilters({ closingSoon: true });
            setPage(1);
          }}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${filters.closingSoon
            ? "border-destructive bg-destructive/10 text-destructive"
            : "border-border text-muted-foreground hover:border-destructive/50"
            }`}
        >
          Closing Soon
        </button>
        {memberProfile && (
          <button
            onClick={() => {
              setFilters({ goodFit: true });
              setPage(1);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${filters.goodFit
              ? "border-green-500 bg-green-500/10 text-green-700"
              : "border-border text-muted-foreground hover:border-green-500/50"
              }`}
          >
            Good Fit for Me
          </button>
        )}
      </div>

      {/* Advanced filter panel */}
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
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filters.domain === d
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
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${filters.experienceLevel === lvl
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
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filters.location === loc
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

      {/* Empty state */}
      {!loading && jobs && jobs.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed bg-card p-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-foreground">
              {activeFilterCount > 0 ? "No matching roles found" : "No roles available"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeFilterCount > 0
                ? "Try adjusting your filters to see more opportunities"
                : "New roles appear regularly — check back soon or adjust your preferences"}
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
              <JobCard key={job.id} job={job} memberProfile={memberProfile} />
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
