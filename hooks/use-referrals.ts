import { useState, useCallback } from "react";

export interface Referral {
  id: string;
  userId: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  status: string;
  createdAt: string;
}

export function useReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReferrals = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/referrals?userId=${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });

      if (!response.ok) throw new Error("Failed to fetch referrals");

      const data = await response.json();
      setReferrals(data.referrals);
      return data.referrals;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching referrals";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createReferral = useCallback(async (referralData: Partial<Referral>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(referralData),
      });

      if (!response.ok) throw new Error("Failed to create referral");

      const data = await response.json();
      setReferrals((prev) => [...prev, data.referral]);
      return data.referral;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error creating referral";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { referrals, fetchReferrals, createReferral, loading, error };
}