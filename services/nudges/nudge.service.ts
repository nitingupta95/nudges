import { prisma } from "@/lib/prisma";
import { generateNudges } from "./nudge.engine";

/**
 * Get referral nudges for a specific user and job.
 * Returns an array of human-readable nudge suggestions.
 */
export async function getReferralNudges(userId: string, jobId: string) {
  // Fetch the job and member profile in parallel
  const [job, profile] = await Promise.all([
    prisma.job.findUnique({
      where: { id: jobId },
      include: { jobTag: true }, // Include job tags for additional context
    }),
    prisma.memberProfile.findUnique({
      where: { userId },
    }),
  ]);

  // Handle edge cases: job or profile not found
  if (!job) {
    throw new Error(`Job with ID ${jobId} not found`);
  }

  if (!profile) {
    throw new Error(`Member profile for user ID ${userId} not found`);
  }

  // Generate nudges using the nudge engine
  const nudges = generateNudges(job, profile);

  // Track the event for analytics (optional)
  await prisma.event.create({
    data: {
      type: "NUDGES_SHOWN",
      userId,
      jobId,
      metadata: { nudgeCount: nudges.length },
    },
  });

  return nudges;
}