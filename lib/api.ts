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
  await delay(600 + Math.random() * 400);
  if (shouldFail()) throw new Error("network");

  let jobs = [...mockJobs];

  if (filters?.domain) {
    jobs = jobs.filter((j) => j.domain === filters.domain);
  }
  if (filters?.experienceLevel) {
    jobs = jobs.filter((j) => j.experienceLevel === filters.experienceLevel);
  }
  if (filters?.location) {
    jobs = jobs.filter((j) => j.location === filters.location);
  }
  if (filters?.closingSoon) {
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    jobs = jobs.filter(
      (j) => j.closingDate && new Date(j.closingDate) <= soon
    );
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    jobs = jobs.filter(
      (j) => {
        const companyName = typeof j.company === "string" ? j.company : j.company.name;
        return (
          j.title.toLowerCase().includes(q) ||
          companyName.toLowerCase().includes(q) ||
          j.skills?.some((s) => s.includes(q))
        );
      }
    );
  }

  return jobs;
}

export async function fetchJob(jobId: string): Promise<Job | null> {
  await delay(400 + Math.random() * 300);
  if (shouldFail()) throw new Error("network");
  return mockJobs.find((j) => j.id === jobId) || null;
}

export async function fetchNudges(jobId: string): Promise<ReferralNudgeResponse> {
  await delay(800 + Math.random() * 600);
  if (shouldFail()) throw new Error("network");
  return mockNudges[jobId] || { nudges: [] };
}

export async function fetchReferrals(): Promise<ReferralSubmission[]> {
  await delay(500 + Math.random() * 300);
  if (shouldFail()) throw new Error("network");
  return [...mockReferrals];
}

export async function submitReferral(data: {
  jobId: string;
  jobTitle: string;
  companyName: string;
  candidateName?: string;
  candidateProfileUrl?: string;
  relation: RelationType;
  note?: string;
}): Promise<ReferralSubmission> {
  await delay(800 + Math.random() * 400);
  if (shouldFail()) throw new Error("network");

  // Check for duplicates
  const duplicate = mockReferrals.find(
    (r) =>
      r.jobId === data.jobId &&
      r.candidateName?.toLowerCase() === data.candidateName?.toLowerCase()
  );
  if (duplicate) {
    throw new Error("duplicate");
  }

  const referral: ReferralSubmission = {
    id: `r-${Date.now()}`,
    jobId: data.jobId,
    jobTitle: data.jobTitle,
    companyName: data.companyName,
    candidateName: data.candidateName,
    candidateProfileUrl: data.candidateProfileUrl,
    relation: data.relation,
    note: data.note,
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy: "u-1",
    activity: [
      { timestamp: new Date().toISOString(), action: "Referral submitted" },
    ],
  };

  return referral;
}
