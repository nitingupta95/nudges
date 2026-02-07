import { RelationType, ReferralStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Create or update a referral for a specific user and job.
 * Ensures no duplicate referrals for the same user and job.
 */
export async function createReferral(
  userId: string,
  jobId: string,
  relation: RelationType,
  candidateName: string,
  candidateEmail: string,
  candidatePhone?: string,
  referralNote?: string
) {
  // Validate inputs
  if (!candidateName || !candidateEmail) {
    throw new Error("Candidate name and email are required");
  }

  // Ensure no duplicate referrals for the same candidate and job
  const existingReferral = await prisma.referral.findUnique({
    where: {
      jobId_candidateEmail: {
        jobId,
        candidateEmail: candidateEmail.toLowerCase(),
      },
    },
  });

  if (existingReferral) {
    throw new Error("A referral for this candidate already exists for this job");
  }

  // Create the referral
  return prisma.referral.create({
    data: {
      userId,
      jobId,
      relation,
      candidateName,
      candidateEmail: candidateEmail.toLowerCase(),
      candidatePhone,
      referralNote,
      status: ReferralStatus.VIEWED,
      statusHistory: [
        {
          status: ReferralStatus.VIEWED,
          timestamp: new Date().toISOString(),
          note: "Referral created",
        },
      ],
    },
  });
}

/**
 * List all referrals for a specific user.
 * Supports optional filtering by referral status.
 */
export async function listReferrals(
  userId: string,
  options?: { status?: ReferralStatus; limit?: number; offset?: number }
) {
  const where = {
    userId,
    status: options?.status ?? undefined,
  };

  return prisma.referral.findMany({
    where,
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
    },
  });
}

/**
 * Update the status of a referral.
 * Tracks the status change in the referral's history.
 */
export async function updateReferralStatus(
  referralId: string,
  newStatus: ReferralStatus,
  updatedBy: string,
  note?: string
) {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
  });

  if (!referral) {
    throw new Error("Referral not found");
  }

  const currentHistory =
    (referral.statusHistory as Array<{ status: string; timestamp: string; note?: string }>) || [];

  const updatedHistory = [
    ...currentHistory,
    {
      status: newStatus,
      timestamp: new Date().toISOString(),
      note,
    },
  ];

  return prisma.referral.update({
    where: { id: referralId },
    data: {
      status: newStatus,
      statusHistory: updatedHistory,
    },
  });
}

/**
 * Get a specific referral by its ID.
 * Includes job and user details for context.
 */
export async function getReferralById(referralId: string) {
  return prisma.referral.findUnique({
    where: { id: referralId },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Delete a referral by its ID.
 * Ensures the referral exists before attempting deletion.
 */
export async function deleteReferral(referralId: string) {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
  });

  if (!referral) {
    throw new Error("Referral not found");
  }

  await prisma.referral.delete({
    where: { id: referralId },
  });
}

/**
 * Get analytics for referrals by a specific user.
 * Returns counts for each referral status.
 */
export async function getReferralAnalytics(userId: string) {
  const statuses = Object.values(ReferralStatus);

  const counts = await Promise.all(
    statuses.map((status) =>
      prisma.referral.count({
        where: { userId, status },
      })
    )
  );

  return statuses.reduce((acc, status, index) => {
    acc[status] = counts[index];
    return acc;
  }, {} as Record<ReferralStatus, number>);
}