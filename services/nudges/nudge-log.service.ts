/**
 * Nudge Log Service
 * Handles nudge tracking, logging, and interaction recording
 */

import { prisma } from '@/lib/prisma';
import { NudgeType, MatchTier, InteractionAction } from '@/lib/generated/prisma/client';
import { NotFoundError } from '@/lib/middleware/error-handler.middleware';

// ============================================
// Types
// ============================================

export interface NudgeContent {
  headline: string;
  body: string;
  cta: string;
  inferences: string[];
}

export interface CreateNudgeLogInput {
  memberId: string;
  jobId: string;
  nudgeType: NudgeType;
  nudgeContent: NudgeContent;
  templateUsed?: string;
  matchScore: number;
  matchTier: MatchTier;
  reasonsSummary: string[];
  variant?: string;
  experimentId?: string;
}

export interface LogInteractionInput {
  nudgeLogId: string;
  action: InteractionAction;
  metadata?: Record<string, unknown>;
}

export interface NudgeStats {
  totalShown: number;
  clicked: number;
  dismissed: number;
  referred: number;
  clickRate: number;
  conversionRate: number;
}

// ============================================
// Service Functions
// ============================================

/**
 * Create a nudge log entry
 */
export async function createNudgeLog(input: CreateNudgeLogInput): Promise<string> {
  const nudgeLog = await prisma.nudgeLog.create({
    data: {
      memberId: input.memberId,
      jobId: input.jobId,
      nudgeType: input.nudgeType,
      nudgeContent: input.nudgeContent as any,
      templateUsed: input.templateUsed,
      matchScore: input.matchScore,
      matchTier: input.matchTier,
      reasonsSummary: input.reasonsSummary,
      variant: input.variant,
      experimentId: input.experimentId,
      shownAt: new Date(),
    },
  });

  return nudgeLog.id;
}

/**
 * Log a nudge interaction
 */
export async function logNudgeInteraction(input: LogInteractionInput): Promise<string> {
  // Verify nudge log exists
  const nudgeLog = await prisma.nudgeLog.findUnique({
    where: { id: input.nudgeLogId },
  });

  if (!nudgeLog) {
    throw new NotFoundError('Nudge log', input.nudgeLogId);
  }

  // Create interaction
  const interaction = await prisma.nudgeInteraction.create({
    data: {
      nudgeLogId: input.nudgeLogId,
      action: input.action,
      metadata: input.metadata as any,
      timestamp: new Date(),
    },
  });

  // Update nudge log timestamps based on action
  const updateData: Record<string, Date> = {};
  
  if (input.action === 'CLICKED' && !nudgeLog.clickedAt) {
    updateData.clickedAt = new Date();
  }
  
  if (input.action === 'DISMISSED' && !nudgeLog.dismissedAt) {
    updateData.dismissedAt = new Date();
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.nudgeLog.update({
      where: { id: input.nudgeLogId },
      data: updateData,
    });
  }

  return interaction.id;
}

/**
 * Log interaction by member and job (finds or creates nudge log)
 */
export async function logInteractionByContext(
  memberOrUserId: string,
  jobId: string,
  action: InteractionAction,
  metadata?: Record<string, unknown>
): Promise<string> {
  // Resolve the actual member ID
  // First, check if it's a valid MemberProfile ID
  let memberProfile = await prisma.memberProfile.findUnique({
    where: { id: memberOrUserId },
    select: { id: true },
  });

  // If not found, try to find by userId (in case user.id was passed)
  if (!memberProfile) {
    memberProfile = await prisma.memberProfile.findFirst({
      where: { userId: memberOrUserId },
      select: { id: true },
    });
  }

  // If still no member profile, create one
  if (!memberProfile) {
    const user = await prisma.user.findUnique({
      where: { id: memberOrUserId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      // Cannot log interaction without a valid user/member
      console.warn(`[NudgeLog] Cannot log interaction: no user found for ID ${memberOrUserId}`);
      return 'skipped';
    }

    memberProfile = await prisma.memberProfile.create({
      data: {
        userId: user.id,
      },
      select: { id: true },
    });
  }

  const memberId = memberProfile.id;

  // Find the most recent nudge log for this member/job
  let nudgeLog = await prisma.nudgeLog.findFirst({
    where: { memberId, jobId },
    orderBy: { shownAt: 'desc' },
  });

  // If no nudge log exists, create a minimal one
  if (!nudgeLog) {
    nudgeLog = await prisma.nudgeLog.create({
      data: {
        memberId,
        jobId,
        nudgeType: 'GENERIC',
        nudgeContent: { headline: '', body: '', cta: '', inferences: [] },
        matchScore: 0,
        matchTier: 'LOW',
        reasonsSummary: [],
        shownAt: new Date(),
      },
    });
  }

  return logNudgeInteraction({
    nudgeLogId: nudgeLog.id,
    action,
    metadata,
  });
}

/**
 * Get nudge stats for a job
 */
export async function getNudgeStatsForJob(jobId: string): Promise<NudgeStats> {
  const [total, clicked, dismissed, referred] = await Promise.all([
    prisma.nudgeLog.count({ where: { jobId } }),
    prisma.nudgeLog.count({ where: { jobId, clickedAt: { not: null } } }),
    prisma.nudgeLog.count({ where: { jobId, dismissedAt: { not: null } } }),
    prisma.nudgeInteraction.count({
      where: {
        nudgeLog: { jobId },
        action: 'REFERRED',
      },
    }),
  ]);

  return {
    totalShown: total,
    clicked,
    dismissed,
    referred,
    clickRate: total > 0 ? clicked / total : 0,
    conversionRate: total > 0 ? referred / total : 0,
  };
}

/**
 * Get nudge stats for a member
 */
export async function getNudgeStatsForMember(memberId: string): Promise<NudgeStats> {
  const [total, clicked, dismissed, referred] = await Promise.all([
    prisma.nudgeLog.count({ where: { memberId } }),
    prisma.nudgeLog.count({ where: { memberId, clickedAt: { not: null } } }),
    prisma.nudgeLog.count({ where: { memberId, dismissedAt: { not: null } } }),
    prisma.nudgeInteraction.count({
      where: {
        nudgeLog: { memberId },
        action: 'REFERRED',
      },
    }),
  ]);

  return {
    totalShown: total,
    clicked,
    dismissed,
    referred,
    clickRate: total > 0 ? clicked / total : 0,
    conversionRate: total > 0 ? referred / total : 0,
  };
}

/**
 * Get A/B test results for an experiment
 */
export async function getExperimentResults(experimentId: string): Promise<{
  variants: Array<{
    variant: string;
    shown: number;
    clicked: number;
    converted: number;
    clickRate: number;
    conversionRate: number;
  }>;
}> {
  const nudgeLogs = await prisma.nudgeLog.findMany({
    where: { experimentId },
    include: {
      interactions: {
        where: { action: 'REFERRED' },
      },
    },
  });

  // Group by variant
  const variantStats = new Map<string, {
    shown: number;
    clicked: number;
    converted: number;
  }>();

  for (const log of nudgeLogs) {
    const variant = log.variant || 'control';
    
    if (!variantStats.has(variant)) {
      variantStats.set(variant, { shown: 0, clicked: 0, converted: 0 });
    }

    const stats = variantStats.get(variant)!;
    stats.shown++;
    
    if (log.clickedAt) {
      stats.clicked++;
    }
    
    if (log.interactions.length > 0) {
      stats.converted++;
    }
  }

  return {
    variants: Array.from(variantStats.entries()).map(([variant, stats]) => ({
      variant,
      shown: stats.shown,
      clicked: stats.clicked,
      converted: stats.converted,
      clickRate: stats.shown > 0 ? stats.clicked / stats.shown : 0,
      conversionRate: stats.shown > 0 ? stats.converted / stats.shown : 0,
    })),
  };
}

/**
 * Get recent nudge logs for a member
 */
export async function getMemberNudgeLogs(
  memberId: string,
  limit: number = 20
): Promise<Array<{
  id: string;
  jobId: string;
  nudgeType: NudgeType;
  matchScore: number;
  shownAt: Date;
  clickedAt: Date | null;
}>> {
  const logs = await prisma.nudgeLog.findMany({
    where: { memberId },
    orderBy: { shownAt: 'desc' },
    take: limit,
    select: {
      id: true,
      jobId: true,
      nudgeType: true,
      matchScore: true,
      shownAt: true,
      clickedAt: true,
    },
  });

  return logs;
}
