import type {
  Job,
  JobFilters,
  ReferralNudgeResponse,
  ReferralSubmission,
  RelationType,
} from "@/types";
import { mockJobs, mockNudges, mockReferrals } from "@/mock/data";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function shouldFail(): boolean {
  // 5% chance of simulated failure for dev testing
  return Math.random() < 0.05;
}

export async function fetchJobs(filters?: JobFilters): Promise<Job[]> {
  // await delay(600 + Math.random() * 400);
  // if (shouldFail()) throw new Error("network");

  // let jobs = [...mockJobs];

  // if (filters?.domain) {
  //   jobs = jobs.filter((j) => j.domain === filters.domain);
  // }
  // if (filters?.experienceLevel) {
  //   jobs = jobs.filter((j) => j.experienceLevel === filters.experienceLevel);
  // }
  // if (filters?.location) {
  //   jobs = jobs.filter((j) => j.location === filters.location);
  // }
  // if (filters?.closingSoon) {
  //   const soon = new Date();
  //   soon.setDate(soon.getDate() + 7);
  //   jobs = jobs.filter(
  //     (j) => j.closingDate && new Date(j.closingDate) <= soon
  //   );
  // }
  // if (filters?.search) {
  //   const q = filters.search.toLowerCase();
  //   jobs = jobs.filter(
  //     (j) => {
  //       const companyName = typeof j.company === "string" ? j.company : j.company.name;
  //       return (
  //         j.title.toLowerCase().includes(q) ||
  //         companyName.toLowerCase().includes(q) ||
  //         j.skills?.some((s) => s.includes(q))
  //       );
  //     }
  //   );
  // }

  // return jobs;

  try {
    const params = new URLSearchParams();
    if (filters?.domain) params.append("domain", filters.domain);
    if (filters?.experienceLevel) params.append("experienceLevel", filters.experienceLevel); // Fixed casing
    if (filters?.location) params.append("location", filters.location);
    if (filters?.closingSoon) params.append("closingSoon", "true");
    if (filters?.search) params.append("search", filters.search);

    const response = await fetch(`/api/jobs?${params.toString()}`);
    if (!response.ok) {
      console.warn("API fetch failed, falling back to mock jobs");
      return mockJobs;
    }
    const data = await response.json();
    return data.jobs && data.jobs.length > 0 ? data.jobs : mockJobs;
  } catch (error) {
    console.warn("Error fetching jobs, falling back to mock data:", error);
    return mockJobs;
  }
}

export async function fetchJob(jobId: string): Promise<Job | null> {
  // Try to find in mock data first if it looks like a mock ID (optional optimization)
  // but for now let's try API first then fallback

  try {
    const response = await fetch(`/api/jobs/${jobId}`);
    if (!response.ok) {
      if (response.status === 404) {
        // If not found in API, check mock data
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

export async function fetchNudges(jobId: string): Promise<ReferralNudgeResponse> {
  // await delay(800 + Math.random() * 600);
  // if (shouldFail()) throw new Error("network");
  // return mockNudges[jobId] || { nudges: [] };
  try {
    const response = await fetch(`/api/jobs/${jobId}/referral-nudges`);
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

export async function fetchReferrals(): Promise<ReferralSubmission[]> {
  // await delay(500 + Math.random() * 300);
  // if (shouldFail()) throw new Error("network");
  // return [...mockReferrals];
  try {
    const response = await fetch("/api/referrals");
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
  jobTitle: string;
  companyName: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateProfileUrl?: string;
  relation: RelationType;
  note?: string;
}): Promise<ReferralSubmission> {
  // await delay(800 + Math.random() * 400);
  // if (shouldFail()) throw new Error("network");

  // // Check for duplicates
  // const duplicate = mockReferrals.find(
  //   (r) =>
  //     r.jobId === data.jobId &&
  //     r.candidateName?.toLowerCase() === data.candidateName?.toLowerCase()
  // );
  // if (duplicate) {
  //   throw new Error("duplicate");
  // }

  // const referral: ReferralSubmission = {
  //   id: `r-${Date.now()}`,
  //   jobId: data.jobId,
  //   jobTitle: data.jobTitle,
  //   companyName: data.companyName,
  //   candidateName: data.candidateName,
  //   candidateProfileUrl: data.candidateProfileUrl,
  //   relation: data.relation,
  //   note: data.note,
  //   status: "pending",
  //   createdAt: new Date().toISOString(),
  //   createdBy: "u-1",
  //   activity: [
  //     { timestamp: new Date().toISOString(), action: "Referral submitted" },
  //   ],
  // };

  // return referral;

  const response = await fetch("/api/referrals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: "u-1", // Hardcoded for now, should come from auth context
      jobId: data.jobId,
      relation: data.relation,
      candidateName: data.candidateName,
      candidateEmail: data.candidateEmail,
      candidatePhone: null,
      referralNote: data.note,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 409) {
      throw new Error("duplicate");
    }
    throw new Error(errorData.error || "Failed to submit referral");
  }

  const result = await response.json();
  return result.referral;
}
