import { Job, MemberProfile } from "@/lib/generated/prisma/client";

/**
 * Generate referral nudges based on job description and member profile.
 * Nudges are human-readable suggestions for potential referrals.
 */
export function generateNudges(job: Job, profile: MemberProfile): string[] {
  const nudges: string[] = [];

  // Match skills from the member profile with the job description
  const matchingSkills = profile.skills.filter((skill) =>
    job.description.toLowerCase().includes(skill.toLowerCase())
  );

  if (matchingSkills.length) {
    nudges.push(
      `People you’ve worked with on ${matchingSkills.join(", ")}`
    );
  }

  // Check if the job's domain matches the member's preferred domains
  // Note: Add domain field to Job model in Prisma schema if needed

  // Suggest referrals based on experience level
  // Note: Add experienceLevel field to Job model in Prisma schema if needed

  // Suggest referrals based on past companies
  const matchingCompanies = profile.pastCompanies.filter((company) =>
    job.description.toLowerCase().includes(company.toLowerCase())
  );

  if (matchingCompanies.length) {
    nudges.push(
      `Ex-colleagues from ${matchingCompanies.join(", ")}`
    );
  }

  // General nudge for friends or relatives
  nudges.push(
    "Friends or relatives who may be interested in this opportunity"
  );

  // Deduplicate nudges to avoid redundancy
  return Array.from(new Set(nudges));
}