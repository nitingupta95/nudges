import { useState, useCallback } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/users/me", {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch user");

      const data = await response.json();
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching user";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, fetchUser, loading, error };
}