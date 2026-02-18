"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

// Types
export interface ParsedResume {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  summary?: string;
  skills: string[];
  primarySkills: string[];
  technicalSkills: string[];
  experience: Array<{
    company: string;
    title: string;
    duration?: string;
    isCurrent: boolean;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    graduationYear?: string;
  }>;
  totalYearsOfExperience: number;
  currentTitle?: string;
  currentCompany?: string;
  experienceLevel: string;
  source: "ai" | "static";
  confidence: number;
}

export interface ResumeMatchScore {
  overall: number;
  breakdown: {
    skillMatch: number;
    experienceMatch: number;
    industryMatch: number;
    domainMatch: number;
    seniorityMatch: number;
    educationMatch: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  concerns: string[];
  recommendation: "STRONG_FIT" | "GOOD_FIT" | "POTENTIAL_FIT" | "NOT_RECOMMENDED";
}

interface UseResumeReturn {
  uploadAndParseResume: (referralId: string, resumeText: string) => Promise<{ parsedResume: ParsedResume; matchScore: ResumeMatchScore } | null>;
  getResumeData: (referralId: string) => Promise<{ parsedResume: ParsedResume; matchScore: ResumeMatchScore } | null>;
  uploading: boolean;
  loading: boolean;
}

export function useResume(): UseResumeReturn {
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const uploadAndParseResume = useCallback(async (
    referralId: string, 
    resumeText: string
  ): Promise<{ parsedResume: ParsedResume; matchScore: ResumeMatchScore } | null> => {
    if (!referralId || !resumeText) {
      toast.error("Missing referral ID or resume text");
      return null;
    }

    setUploading(true);
    try {
      const response = await fetch(`/api/referrals/${referralId}/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resumeText }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process resume");
      }

      const data = await response.json();
      toast.success("Resume parsed successfully!");
      return data;
    } catch (error) {
      console.error("Resume upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process resume");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const getResumeData = useCallback(async (
    referralId: string
  ): Promise<{ parsedResume: ParsedResume; matchScore: ResumeMatchScore } | null> => {
    if (!referralId) {
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/referrals/${referralId}/resume`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No resume data yet
        }
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch resume data");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Resume fetch error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    uploadAndParseResume,
    getResumeData,
    uploading,
    loading,
  };
}

export default useResume;
