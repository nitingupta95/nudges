"use client";

import { useState, useCallback } from "react";

interface MatchScore {
  overall: number;
  tier: "HIGH" | "MEDIUM" | "LOW";
  breakdown: {
    skillOverlap: number;
    companyOverlap: number;
    industryOverlap: number;
    seniorityMatch: number;
    locationProximity: number;
    domainSimilarity: number;
  };
  reasons: Array<{
    type: string;
    weight: number;
    score: number;
    explanation: string;
  }>;
}

interface TopMember {
  memberId: string;
  memberName: string;
  score: number;
  tier: "HIGH" | "MEDIUM" | "LOW";
  topReasons: string[];
}

interface UseMatchingReturn {
  loading: boolean;
  error: string | null;
  getMatchScore: (memberId: string, jobId: string) => Promise<MatchScore>;
  getTopMembers: (jobId: string, limit?: number) => Promise<TopMember[]>;
  batchScore: (memberIds: string[], jobId: string) => Promise<Array<{ memberId: string; score: MatchScore }>>;
}

export function useMatching(): UseMatchingReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMatchScore = useCallback(async (memberId: string, jobId: string): Promise<MatchScore> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ memberId, jobId });
      const response = await fetch(`/api/matching/score?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to get match score");
      }

      const data = await response.json();
      return data.matchScore;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error getting match score";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTopMembers = useCallback(async (jobId: string, limit: number = 20): Promise<TopMember[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/matching/top-members/${jobId}?limit=${limit}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to get top members");
      }

      const data = await response.json();
      return data.members || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error getting top members";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchScore = useCallback(
    async (memberIds: string[], jobId: string): Promise<Array<{ memberId: string; score: MatchScore }>> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/matching/batch-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ memberIds, jobId }),
        });

        if (!response.ok) {
          throw new Error("Failed to batch score");
        }

        const data = await response.json();
        return data.scores || [];
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error batch scoring";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    getMatchScore,
    getTopMembers,
    batchScore,
  };
}