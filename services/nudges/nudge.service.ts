import { prisma } from "@/lib/prisma";
import { generateNudges, NudgeResult } from "./nudge.engine";

/**
 * Get referral nudges for a specific user and job.
 * Returns nudge suggestions with source information.
 */
export async function getReferralNudges(userId: string, jobId: string): Promise<NudgeResult> {
  // Fetch the job and member profile in parallel
  const [job, profile, user] = await Promise.all([
    prisma.job.findUnique({
      where: { id: jobId },
      include: { jobTag: true }, // Include job tags for additional context
    }),
    prisma.memberProfile.findUnique({
      where: { userId },
    }),
    prisma.user.findUnique({
      where: { id: userId },
    }),
  ]);

  // Handle edge cases: job not found
  if (!job) {
    throw new Error(`Job with ID ${jobId} not found`);
  }

  // If user is a recruiter, they don't have member profiles
  if (user && user.role === "RECRUITER") {
    return {
      nudges: ["You are a recruiter. This feature is for members only."],
      source: "dummy",
      explain: "Recruiters don't use the referral nudge system.",
    };
  }

  // If profile doesn't exist, auto-create a default one
  let memberProfile = profile;
  if (!memberProfile && user) {
    memberProfile = await prisma.memberProfile.create({
      data: {
        userId,
        skills: [],
        pastCompanies: [],
        domains: [],
        experienceLevel: "MID",
        yearsOfExperience: 0,
        preferredDomains: [],
        preferredRoles: [],
        isOpenToRefer: true,
        profileCompleteness: 0,
      },
    });
  }

  // If still no profile, return suggestion to complete profile
  if (!memberProfile) {
    return {
      nudges: ["Please complete your profile to get personalized nudges."],
      source: "dummy",
      explain: "Your profile is incomplete. Update your skills and experience to get better nudge recommendations.",
    };
  }

  // Generate nudges using the nudge engine
  const result = await generateNudges(job, memberProfile);

  // Track the event for analytics (optional)
  try {
    await prisma.event.create({
      data: {
        type: "NUDGE_SHOWN",
        userId,
        jobId,
        metadata: {
          nudgeCount: result.nudges.length,
          source: result.source,
        },
      },
    });
  } catch (err) {
    // Log error but don't fail the nudge request
    console.error("Failed to create nudge event:", err);
  }

  return result;
}