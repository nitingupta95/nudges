"use client";

import { useState, useCallback } from "react";
import type { ReferralSubmission, RelationType } from "@/types";

interface ReferralFilters {
  status?: string;
  jobId?: string;
  limit?: number;
  offset?: number;
}

interface CreateReferralData {
  jobId: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateProfileUrl?: string;
  relation: RelationType;
  note?: string;
  metadata?: Record<string, unknown>;
}

interface ReferralsState {
  referrals: ReferralSubmission[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface UseReferralsReturn extends ReferralsState {
  fetchReferrals: (filters?: ReferralFilters) => Promise<ReferralSubmission[]>;
  fetchReferralById: (referralId: string) => Promise<ReferralSubmission | null>;
  createReferral: (data: CreateReferralData) => Promise<ReferralSubmission>;
  updateReferralStatus: (referralId: string, status: string, note?: string) => Promise<ReferralSubmission>;
  deleteReferral: (referralId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useReferrals(): UseReferralsReturn {
  const [state, setState] = useState<ReferralsState>({
    referrals: [],
    total: 0,
    loading: false,
    error: null,
  });
  const [currentFilters, setCurrentFilters] = useState<ReferralFilters | undefined>();

  const fetchReferrals = useCallback(async (filters?: ReferralFilters): Promise<ReferralSubmission[]> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    setCurrentFilters(filters);

    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.jobId) params.set("jobId", filters.jobId);
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.offset) params.set("offset", String(filters.offset));

      const response = await fetch(`/api/referrals?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch referrals");
      }

      const data = await response.json();
      const referrals = data.referrals || [];
      const total = data.total || referrals.length;

      setState({ referrals, total, loading: false, error: null });
      return referrals;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching referrals";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  const fetchReferralById = useCallback(async (referralId: string): Promise<ReferralSubmission | null> => {
    try {
      const response = await fetch(`/api/referrals/${referralId}`, {
        credentials: "include",
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch referral");
      }

      const data = await response.json();
      return data.referral;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching referral";
      setState((prev) => ({ ...prev, error: message }));
      throw err;
    }
  }, []);

  const createReferral = useCallback(async (data: CreateReferralData): Promise<ReferralSubmission> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create referral");
      }

      const responseData = await response.json();
      
      // Add to local state
      setState((prev) => ({
        ...prev,
        referrals: [responseData.referral, ...prev.referrals],
        total: prev.total + 1,
        loading: false,
      }));

      return responseData.referral;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error creating referral";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  const updateReferralStatus = useCallback(
    async (referralId: string, status: string, note?: string): Promise<ReferralSubmission> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch("/api/referrals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ referralId, status, note }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update referral");
        }

        const responseData = await response.json();
        
        // Update local state
        setState((prev) => ({
          ...prev,
          referrals: prev.referrals.map((r) =>
            r.id === referralId ? responseData.referral : r
          ),
          loading: false,
        }));

        return responseData.referral;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error updating referral";
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  const deleteReferral = useCallback(async (referralId: string): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/referrals?referralId=${referralId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete referral");
      }

      // Remove from local state
      setState((prev) => ({
        ...prev,
        referrals: prev.referrals.filter((r) => r.id !== referralId),
        total: prev.total - 1,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error deleting referral";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchReferrals(currentFilters);
  }, [fetchReferrals, currentFilters]);

  return {
    ...state,
    fetchReferrals,
    fetchReferralById,
    createReferral,
    updateReferralStatus,
    deleteReferral,
    refetch,
  };
}