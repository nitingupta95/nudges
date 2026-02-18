"use client";

import { useState, useCallback } from "react";

interface GeneratedMessage {
  message: string;
  subject?: string;
  shareLinks: {
    whatsapp: string;
    email: string;
    linkedin: string;
  };
  source: "ai" | "static";
}

interface MessageTemplate {
  id: string;
  name: string;
  type: "REFERRAL" | "INTRO" | "FOLLOW_UP";
  tone: "FRIENDLY" | "PROFESSIONAL" | "CASUAL";
  preview: string;
}

interface GenerateMessageParams {
  jobId: string;
  memberId?: string;
  template?: string;
  tone?: "FRIENDLY" | "PROFESSIONAL" | "CASUAL";
  customContext?: string;
  includeJobLink?: boolean;
}

interface UseMessagesReturn {
  loading: boolean;
  error: string | null;
  generateMessage: (params: GenerateMessageParams) => Promise<GeneratedMessage>;
  fetchTemplates: (type?: string) => Promise<MessageTemplate[]>;
}

export function useMessages(): UseMessagesReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMessage = useCallback(async (params: GenerateMessageParams): Promise<GeneratedMessage> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/messages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate message");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error generating message";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async (type?: string): Promise<MessageTemplate[]> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (type) params.set("type", type);

      const response = await fetch(`/api/messages/templates?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      return data.templates || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching templates";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generateMessage,
    fetchTemplates,
  };
}