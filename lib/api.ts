import type {
  Job,
  JobFilters,
  ReferralNudgeResponse,
  ReferralSubmission,
  RelationType,
} from "@/types";
import { mockJobs, mockNudges, mockReferrals } from "@/mock/data";

// ============================================
// CONFIGURATION
// ============================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface FetchOptions extends RequestInit {
  timeout?: number;
}

async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      credentials: "include",
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// ============================================
// JOBS API
// ============================================

export async function fetchJobs(filters?: JobFilters): Promise<Job[]> {
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

    const response = await fetchWithTimeout(`${API_BASE}/api/jobs?${params.toString()}`);
    
    if (!response.ok) {
      console.warn("API fetch failed, falling back to mock jobs");
      return filterMockJobs(mockJobs, filters);
    }
    
    const data = await response.json();
    return data.jobs && data.jobs.length > 0 ? data.jobs : filterMockJobs(mockJobs, filters);
  } catch (error) {
    console.warn("Error fetching jobs, falling back to mock data:", error);
    return filterMockJobs(mockJobs, filters);
  }
}

function filterMockJobs(jobs: Job[], filters?: JobFilters): Job[] {
  if (!filters) return jobs;

  let filtered = [...jobs];

  if (filters.domain) {
    filtered = filtered.filter((j) => j.domain === filters.domain);
  }
  if (filters.experienceLevel) {
    filtered = filtered.filter((j) => j.experienceLevel === filters.experienceLevel);
  }
  if (filters.location) {
    filtered = filtered.filter((j) => j.location?.toLowerCase().includes(filters.location!.toLowerCase()));
  }
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(searchLower) ||
        j.company.name?.toLowerCase().includes(searchLower) ||
        j.description?.toLowerCase().includes(searchLower)
    );
  }
  if (filters.closingSoon) {
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    filtered = filtered.filter(
      (j) => j.closingDate && new Date(j.closingDate) <= soon
    );
  }

  return filtered;
}

export async function fetchJob(jobId: string): Promise<Job | null> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/jobs/${jobId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        const mockJob = mockJobs.find((j) => j.id === jobId);
        return mockJob || null;
      }
      throw new Error("Failed to fetch job");
    }
    
    const data = await response.json();
    return data.job;
  } catch (error) {
    console.warn("Error fetching job, falling back to mock data:", error);
    const mockJob = mockJobs.find((j) => j.id === jobId);
    return mockJob || null;
  }
}

export async function fetchJobSummary(jobId: string): Promise<{ bullets: string[]; source: string }> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/jobs/${jobId}/summary`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch job summary");
    }
    
    return await response.json();
  } catch (error) {
    console.warn("Error fetching job summary:", error);
    return { bullets: [], source: "error" };
  }
}

// ============================================
// NUDGES API
// ============================================

export async function fetchNudges(jobId: string): Promise<ReferralNudgeResponse> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/jobs/${jobId}/referral-nudges`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch nudges for ${jobId}, falling back to mock data`);
      return mockNudges[jobId as keyof typeof mockNudges] || { nudges: [] };
    }
    
    return response.json();
  } catch (error) {
    console.warn("Error fetching nudges, falling back to mock data:", error);
    return mockNudges[jobId as keyof typeof mockNudges] || { nudges: [] };
  }
}

export async function fetchPersonalizedNudge(
  jobId: string,
  memberId?: string
): Promise<{
  nudge: {
    id: string;
    headline: string;
    body: string;
    cta: string;
    matchScore: number;
    matchTier: string;
    inferences: string[];
  } | null;
}> {
  try {
    const params = new URLSearchParams({ jobId });
    if (memberId) params.set("memberId", memberId);

    const response = await fetchWithTimeout(
      `${API_BASE}/api/nudges/personalized?${params.toString()}`
    );
    
    if (!response.ok) {
      return { nudge: null };
    }
    
    return response.json();
  } catch (error) {
    console.warn("Error fetching personalized nudge:", error);
    return { nudge: null };
  }
}

// ============================================
// REFERRALS API
// ============================================

export async function fetchReferrals(): Promise<ReferralSubmission[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/referrals`);
    
    if (!response.ok) {
      console.warn("Failed to fetch referrals, falling back to mock data");
      return [...mockReferrals];
    }
    
    const data = await response.json();
    return data.referrals && data.referrals.length > 0 ? data.referrals : [...mockReferrals];
  } catch (error) {
    console.warn("Error fetching referrals, falling back to mock data:", error);
    return [...mockReferrals];
  }
}

export async function submitReferral(data: {
  jobId: string;
  jobTitle?: string;
  companyName?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateProfileUrl?: string;
  relation: RelationType;
  note?: string;
  metadata?: Record<string, unknown>;
}): Promise<ReferralSubmission> {
  const response = await fetchWithTimeout(`${API_BASE}/api/referrals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to submit referral");
  }

  const responseData = await response.json();
  return responseData.referral;
}

// ============================================
// MESSAGES API
// ============================================

export async function generateMessage(params: {
  jobId: string;
  memberId?: string;
  template?: string;
  tone?: string;
  customContext?: string;
}): Promise<{
  message: string;
  subject?: string;
  shareLinks: { whatsapp: string; email: string; linkedin: string };
  source: string;
}> {
  const response = await fetchWithTimeout(`${API_BASE}/api/messages/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate message");
  }

  return response.json();
}

// ============================================
// CONTACT INSIGHTS API
// ============================================

export async function fetchContactInsights(
  jobTitle: string,
  jobDescription: string,
  company?: string
): Promise<{
  roles: string[];
  departments: string[];
  description: string;
  source: string;
}> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/jobs/contact-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobTitle, jobDescription, company }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch contact insights");
    }

    const data = await response.json();
    return data.insights;
  } catch (error) {
    console.warn("Error fetching contact insights:", error);
    return {
      roles: ["Hiring Manager", "Team Lead", "HR Recruiter"],
      departments: ["Engineering", "HR"],
      description: "Reach out to the hiring team.",
      source: "fallback",
    };
  }
}

// ============================================
// MATCHING API
// ============================================

export async function fetchMatchScore(
  memberId: string,
  jobId: string
): Promise<{
  overall: number;
  tier: "HIGH" | "MEDIUM" | "LOW";
  breakdown: Record<string, number>;
  reasons: Array<{ type: string; explanation: string }>;
}> {
  const params = new URLSearchParams({ memberId, jobId });
  const response = await fetchWithTimeout(`${API_BASE}/api/matching/score?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch match score");
  }

  const data = await response.json();
  return data.matchScore;
}

// ============================================
// EVENTS API
// ============================================

export async function trackEvent(event: {
  type: string;
  userId?: string;
  jobId?: string;
  referralId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetchWithTimeout(`${API_BASE}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error("Error tracking event:", error);
  }
}

// ============================================
// STATS API
// ============================================

export async function fetchDashboardStats(userId?: string): Promise<{
  totalJobs: number;
  closingSoon: number;
  goodFit: number;
}> {
  try {
    const params = userId ? `?userId=${userId}` : "";
    const response = await fetchWithTimeout(`${API_BASE}/api/jobs/stats${params}`);

    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }

    return response.json();
  } catch (error) {
    console.warn("Error fetching stats:", error);
    return { totalJobs: 0, closingSoon: 0, goodFit: 0 };
  }
}