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

  // Create the referral with SUBMITTED status
  return prisma.referral.create({
    data: {
      referrerId: userId,
      jobId,
      relationType: relation,
      candidateName,
      candidateEmail: candidateEmail.toLowerCase(),
      candidatePhone,
      referralNote,
      status: ReferralStatus.SUBMITTED,
      submittedAt: new Date(),
      statusHistory: [
        {
          status: ReferralStatus.SUBMITTED,
          timestamp: new Date().toISOString(),
          note: "Referral submitted",
        },
      ],
    },
  });
}

/**
 * List all referrals for a specific user.
 * For members: returns referrals they've made
 * For recruiters: returns referrals for jobs they created
 * Supports optional filtering by referral status and jobId.
 */
export async function listReferrals(
  userId: string,
  options?: { status?: ReferralStatus; jobId?: string; limit?: number; offset?: number; role?: string }
) {
  // Check if user is a recruiter - if so, show referrals for their jobs
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const isRecruiter = user?.role === 'RECRUITER' || user?.role === 'ADMIN' || options?.role === 'RECRUITER';

  let where: any = {};

  if (isRecruiter) {
    // For recruiters: get referrals for jobs they created
    where = {
      job: {
        createdById: userId,
      },
      // Exclude drafts for recruiters - they should only see submitted referrals
      status: options?.status ?? { not: 'DRAFT' },
    };
    
    // Filter by specific job if provided
    if (options?.jobId) {
      where.jobId = options.jobId;
    }
  } else {
    // For members: get referrals they've made
    where = {
      referrerId: userId,
      status: options?.status ?? undefined,
    };
    
    // Filter by specific job if provided
    if (options?.jobId) {
      where.jobId = options.jobId;
    }
  }

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
      referrer: {
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
      referrer: {
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
        where: { referrerId: userId, status },
      })
    )
  );

  return statuses.reduce((acc, status, index) => {
    acc[status] = counts[index];
    return acc;
  }, {} as Record<ReferralStatus, number>);
}