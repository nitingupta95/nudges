import { prisma } from "@/lib/prisma";
import { Prisma, EventType } from "@/lib/generated/prisma/client";

// ============================================
// TYPES
// ============================================

export interface CreateEventInput {
  type: EventType;
  userId: string;
  jobId?: string | null;
  referralId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface EventFilters {
  userId?: string;
  jobId?: string;
  referralId?: string;
  type?: EventType;
  types?: EventType[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface EventAggregation {
  type: EventType;
  count: number;
}

export interface JobEventStats {
  jobId: string;
  totalViews: number;
  uniqueViewers: number;
  nudgesShown: number;
  referralsStarted: number;
  referralsSubmitted: number;
  messagesCopied: number;
}

// ============================================
// EVENT SERVICE
// ============================================

export async function createEvent(input: CreateEventInput) {
  const userExists = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });

  if (!userExists) {
    throw new Error(`User not found: ${input.userId}`);
  }

  if (input.jobId) {
    const jobExists = await prisma.job.findUnique({
      where: { id: input.jobId },
      select: { id: true },
    });

    if (!jobExists) {
      throw new Error(`Job not found: ${input.jobId}`);
    }
  }

  if (input.referralId) {
    const referralExists = await prisma.referral.findUnique({
      where: { id: input.referralId },
      select: { id: true },
    });

    if (!referralExists) {
      throw new Error(`Referral not found: ${input.referralId}`);
    }
  }

  const sanitizedMetadata = sanitizeMetadata(input.metadata ?? {});

  return prisma.event.create({
    data: {
      type: input.type,
      userId: input.userId,
      jobId: input.jobId ?? null,
      referralId: input.referralId ?? null,
      metadata: sanitizedMetadata as Prisma.InputJsonValue,
    },
  });
}

export async function createEvents(inputs: CreateEventInput[]) {
  if (inputs.length === 0) return [];

  const userIds = [...new Set(inputs.map((i) => i.userId))];

  const existingUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true },
  });

  const existingUserIds = new Set(existingUsers.map((u) => u.id));
  const invalidUserIds = userIds.filter((id) => !existingUserIds.has(id));

  if (invalidUserIds.length > 0) {
    throw new Error(`Users not found: ${invalidUserIds.join(", ")}`);
  }

  return prisma.$transaction(
    inputs.map((input) =>
      prisma.event.create({
        data: {
          type: input.type,
          userId: input.userId,
          jobId: input.jobId ?? null,
          referralId: input.referralId ?? null,
          metadata: sanitizeMetadata(input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      })
    )
  );
}

export async function getEvents(filters: EventFilters) {
  const where: Prisma.EventWhereInput = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.jobId) where.jobId = filters.jobId;
  if (filters.referralId) where.referralId = filters.referralId;
  if (filters.type) where.type = filters.type;
  if (filters.types?.length) where.type = { in: filters.types };

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return prisma.event.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 100,
    skip: filters.offset ?? 0,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getEventById(eventId: string) {
  if (!eventId) throw new Error("Event ID is required");

  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getEventCountsByJob(jobId: string): Promise<JobEventStats> {
  if (!jobId) throw new Error("Job ID is required");

  const [
    totalViews,
    uniqueViewers,
    nudgesShown,
    referralsStarted,
    referralsSubmitted,
    messagesCopied,
  ] = await Promise.all([
    prisma.event.count({ where: { jobId, type: EventType.JOB_VIEWED } }),
    prisma.event.groupBy({
      by: ["userId"],
      where: { jobId, type: EventType.JOB_VIEWED },
    }),
    prisma.event.count({ where: { jobId, type: EventType.NUDGE_SHOWN } }),
    prisma.event.count({ where: { jobId, type: EventType.REFERRAL_STARTED } }),
    prisma.event.count({ where: { jobId, type: EventType.REFERRAL_SUBMITTED } }),
    prisma.event.count({ where: { jobId, type: EventType.MESSAGE_COPIED } }),
  ]);

  return {
    jobId,
    totalViews,
    uniqueViewers: uniqueViewers.length,
    nudgesShown,
    referralsStarted,
    referralsSubmitted,
    messagesCopied,
  };
}

export async function getEventAggregations(
  filters: Omit<EventFilters, "type" | "types" | "limit" | "offset">
): Promise<EventAggregation[]> {
  const where: Prisma.EventWhereInput = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.jobId) where.jobId = filters.jobId;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const aggregations = await prisma.event.groupBy({
    by: ["type"],
    where,
    _count: { type: true },
  });

  return aggregations.map((agg) => ({
    type: agg.type,
    count: agg._count.type,
  }));
}

export async function getUsersWhoViewedButDidntRefer(jobId: string): Promise<string[]> {
  if (!jobId) throw new Error("Job ID is required");

  const viewedEvents = await prisma.event.findMany({
    where: { jobId, type: EventType.JOB_VIEWED },
    select: { userId: true },
    distinct: ["userId"],
  });

  const viewedUserIds = viewedEvents.map((e) => e.userId);
  if (!viewedUserIds.length) return [];

  const referredEvents = await prisma.event.findMany({
    where: {
      jobId,
      type: { in: [EventType.REFERRAL_STARTED, EventType.REFERRAL_SUBMITTED] },
      userId: { in: viewedUserIds },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  const referredUserIds = new Set(referredEvents.map((e) => e.userId));
  return viewedUserIds.filter((id) => !referredUserIds.has(id));
}

// ============================================
// FUNNEL METRICS
// ============================================

export interface FunnelMetrics {
  jobViews: number;
  uniqueJobViewers: number;
  nudgesShown: number;
  nudgesClicked: number;
  referralsStarted: number;
  referralsSubmitted: number;
  // Conversion rates
  viewToNudgeRate: number;
  nudgeClickRate: number;
  clickToStartRate: number;
  startToSubmitRate: number;
  overallConversionRate: number;
  // Time-based metrics
  period: { startDate: Date; endDate: Date };
}

export async function getFunnelMetrics(
  startDate: Date,
  endDate: Date,
  jobId?: string
): Promise<FunnelMetrics> {
  const baseWhere = {
    createdAt: { gte: startDate, lte: endDate },
    ...(jobId && { jobId }),
  };

  const [
    jobViews,
    uniqueJobViewers,
    nudgesShown,
    nudgesClicked,
    referralsStarted,
    referralsSubmitted,
  ] = await Promise.all([
    prisma.event.count({ where: { ...baseWhere, type: EventType.JOB_VIEWED } }),
    prisma.event.groupBy({
      by: ["userId"],
      where: { ...baseWhere, type: EventType.JOB_VIEWED },
    }).then((r) => r.length),
    prisma.event.count({ where: { ...baseWhere, type: EventType.NUDGE_SHOWN } }),
    prisma.event.count({ where: { ...baseWhere, type: EventType.NUDGE_CLICKED } }),
    prisma.event.count({ where: { ...baseWhere, type: EventType.REFERRAL_STARTED } }),
    prisma.event.count({ where: { ...baseWhere, type: EventType.REFERRAL_SUBMITTED } }),
  ]);

  return {
    jobViews,
    uniqueJobViewers,
    nudgesShown,
    nudgesClicked,
    referralsStarted,
    referralsSubmitted,
    // Conversion rates (as percentages)
    viewToNudgeRate: jobViews > 0 ? (nudgesShown / jobViews) * 100 : 0,
    nudgeClickRate: nudgesShown > 0 ? (nudgesClicked / nudgesShown) * 100 : 0,
    clickToStartRate: nudgesClicked > 0 ? (referralsStarted / nudgesClicked) * 100 : 0,
    startToSubmitRate: referralsStarted > 0 ? (referralsSubmitted / referralsStarted) * 100 : 0,
    overallConversionRate: jobViews > 0 ? (referralsSubmitted / jobViews) * 100 : 0,
    period: { startDate, endDate },
  };
}

export async function getFunnelMetricsByJob(
  jobId: string,
  days: number = 30
): Promise<FunnelMetrics> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return getFunnelMetrics(startDate, endDate, jobId);
}

export async function getOverallFunnelMetrics(days: number = 30): Promise<FunnelMetrics> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return getFunnelMetrics(startDate, endDate);
}

// ============================================
// TRACKERS
// ============================================

export const trackJobView = (userId: string, jobId: string, metadata?: Record<string, unknown>) =>
  createEvent({
    type: EventType.JOB_VIEWED,
    userId,
    jobId,
    metadata: { ...metadata, viewedAt: new Date().toISOString() },
  });

export const trackNudgesShown = (
  userId: string,
  jobId: string,
  nudgeCount: number,
  nudgeCategories: string[]
) =>
  createEvent({
    type: EventType.NUDGE_SHOWN,
    userId,
    jobId,
    metadata: { nudgeCount, nudgeCategories, shownAt: new Date().toISOString() },
  });

export const trackMessageCopied = (
  userId: string,
  jobId: string,
  messageType: string,
  nudgeId?: string
) =>
  createEvent({
    type: EventType.MESSAGE_COPIED,
    userId,
    jobId,
    metadata: { messageType, nudgeId, copiedAt: new Date().toISOString() },
  });

export const trackReferralStatusChange = (
  userId: string,
  referralId: string,
  jobId: string,
  previousStatus: string,
  newStatus: string
) =>
  createEvent({
    type: EventType.REFERRAL_STATUS_CHANGED,
    userId,
    jobId,
    referralId,
    metadata: { previousStatus, newStatus, changedAt: new Date().toISOString() },
  });

// ============================================
// CLEANUP
// ============================================

export async function deleteOldEvents(olderThanDays: number) {
  if (olderThanDays < 30) {
    throw new Error("Cannot delete events newer than 30 days");
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.event.deleteMany({
    where: { createdAt: { lt: cutoffDate } },
  });

  return { deletedCount: result.count, cutoffDate };
}

// ============================================
// HELPERS
// ============================================

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ["password", "token", "secret", "apikey", "authorization", "cookie", "session"];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (!sensitiveFields.some((f) => key.toLowerCase().includes(f))) {
      sanitized[key] =
        typeof value === "string" && value.length > 1000
          ? value.slice(0, 1000) + "...[truncated]"
          : value;
    }
  }

  return sanitized;
}
