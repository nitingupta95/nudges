"use client";

import { useState, useCallback } from "react";

interface Nudge {
  id: string;
  headline: string;
  body: string;
  cta: string;
  matchScore: number;
  matchTier: "HIGH" | "MEDIUM" | "LOW";
  inferences: string[];
}

interface NudgeInteraction {
  memberId?: string;
  jobId: string;
  nudgeId?: string;
  action: "VIEWED" | "HOVERED" | "CLICKED" | "SHARE_WHATSAPP" | "SHARE_LINKEDIN" | "SHARE_EMAIL" | "COPY_MESSAGE" | "DISMISSED" | "REFERRED";
  metadata?: Record<string, unknown>;
}

interface NudgeStats {
  totalShown: number;
  clicked: number;
  dismissed: number;
  referred: number;
  clickRate: number;
  referralRate: number;
}

interface UseNudgesReturn {
  loading: boolean;
  error: string | null;
  fetchNudgesForJob: (jobId: string) => Promise<{
    nudges: string[];
    explain: string;
    matchScore: number;
    matchTier: string;
    reasons: Array<{ type: string; explanation: string }>;
  }>;
  fetchPersonalizedNudge: (jobId: string, memberId?: string) => Promise<Nudge | null>;
  logInteraction: (interaction: NudgeInteraction) => Promise<void>;
  fetchStats: (jobId?: string, memberId?: string) => Promise<NudgeStats>;
}

export function useNudges(): UseNudgesReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNudgesForJob = useCallback(async (jobId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/referral-nudges`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch nudges");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching nudges";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPersonalizedNudge = useCallback(async (jobId: string, memberId?: string): Promise<Nudge | null> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ jobId });
      if (memberId) params.set("memberId", memberId);

      const response = await fetch(`/api/nudges/personalized?${params.toString()}`, {
        credentials: "include",
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch personalized nudge");
      }

      const data = await response.json();
      return data.nudge;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching personalized nudge";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logInteraction = useCallback(async (interaction: NudgeInteraction): Promise<void> => {
    try {
      const response = await fetch("/api/nudges/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(interaction),
      });

      if (!response.ok) {
        console.error("Failed to log nudge interaction");
      }
    } catch (err) {
      console.error("Error logging interaction:", err);
    }
  }, []);

  const fetchStats = useCallback(async (jobId?: string, memberId?: string): Promise<NudgeStats> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (jobId) params.set("jobId", jobId);
      if (memberId) params.set("memberId", memberId);

      const response = await fetch(`/api/nudges/stats?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch nudge stats");
      }

      const data = await response.json();
      return data.stats;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching stats";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchNudgesForJob,
    fetchPersonalizedNudge,
    logInteraction,
    fetchStats,
  };
}