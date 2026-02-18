import { useState, useCallback } from "react";

export interface Event {
  id: string;
  type: string;
  userId: string;
  jobId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (filters?: { userId?: string; jobId?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters as Record<string, string>);
      const response = await fetch(`/api/events?${params}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data.events);
      return data.events;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching events";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { events, fetchEvents, loading, error };
}