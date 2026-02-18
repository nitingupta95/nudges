"use client";

import { useState, useCallback, useMemo } from "react";
import type { Job, JobFilters } from "@/types";

interface JobsState {
  jobs: Job[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface UseJobsReturn extends JobsState {
  fetchJobs: (filters?: JobFilters) => Promise<Job[]>;
  fetchJobById: (jobId: string) => Promise<Job | null>;
  createJob: (jobData: Partial<Job>) => Promise<Job>;
  updateJob: (jobId: string, data: Partial<Job>) => Promise<Job>;
  deleteJob: (jobId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useJobs(initialFilters?: JobFilters): UseJobsReturn {
  const [state, setState] = useState<JobsState>({
    jobs: [],
    total: 0,
    loading: false,
    error: null,
  });
  const [currentFilters, setCurrentFilters] = useState<JobFilters | undefined>(initialFilters);

  const fetchJobs = useCallback(async (filters?: JobFilters): Promise<Job[]> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    setCurrentFilters(filters);

    try {
      const params = new URLSearchParams();
      
      if (filters?.domain) params.set("domain", filters.domain);
      if (filters?.experienceLevel) params.set("experienceLevel", filters.experienceLevel);
      if (filters?.skills?.length) params.set("skills", filters.skills.join(","));
      if (filters?.location) params.set("location", filters.location);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.closingSoon) params.set("closingSoon", "true");
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.offset) params.set("offset", String(filters.offset));

      const response = await fetch(`/api/jobs?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      const jobs = data.jobs || [];
      const total = data.total || jobs.length;

      setState({ jobs, total, loading: false, error: null });
      return jobs;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching jobs";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  const fetchJobById = useCallback(async (jobId: string): Promise<Job | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        credentials: "include",
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch job");
      }

      const data = await response.json();
      return data.job;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching job";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const createJob = useCallback(async (jobData: Partial<Job>): Promise<Job> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create job");
      }

      const data = await response.json();
      
      // Add to local state
      setState((prev) => ({
        ...prev,
        jobs: [data.job, ...prev.jobs],
        total: prev.total + 1,
        loading: false,
      }));

      return data.job;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error creating job";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  const updateJob = useCallback(async (jobId: string, data: Partial<Job>): Promise<Job> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update job");
      }

      const responseData = await response.json();
      
      // Update local state
      setState((prev) => ({
        ...prev,
        jobs: prev.jobs.map((j) => (j.id === jobId ? responseData.job : j)),
        loading: false,
      }));

      return responseData.job;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error updating job";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  const deleteJob = useCallback(async (jobId: string): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      // Remove from local state
      setState((prev) => ({
        ...prev,
        jobs: prev.jobs.filter((j) => j.id !== jobId),
        total: prev.total - 1,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error deleting job";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchJobs(currentFilters);
  }, [fetchJobs, currentFilters]);

  return {
    ...state,
    fetchJobs,
    fetchJobById,
    createJob,
    updateJob,
    deleteJob,
    refetch,
  };
}