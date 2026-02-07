import { useState, useCallback } from "react";

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary?: string;
  experienceLevel?: string;
  createdAt: string;
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/jobs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });

      if (!response.ok) throw new Error("Failed to fetch jobs");

      const data = await response.json();
      setJobs(data.jobs);
      return data.jobs;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching jobs";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobById = useCallback(async (jobId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });

      if (!response.ok) throw new Error("Failed to fetch job");

      const data = await response.json();
      return data.job;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching job";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { jobs, fetchJobs, fetchJobById, loading, error };
}