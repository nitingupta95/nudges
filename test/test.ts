import { prisma } from "@/lib/prisma";
import { EventType, Prisma } from "@/lib/generated/prisma";

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
  type?: EventType;
  jobId?: string;
  referralId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface EventAnalytics {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  uniqueUsers: number;
  recentActivity: { date: string; count: number }[];
}

// ============================================
// VALIDATION
// ============================================

function validateEventInput(input: CreateEventInput): string[] {
  const errors: string[] = [];

  if (!input.type) {
    errors.push("Event type is required");
  }

  if (!input.userId || input.userId.trim() === "") {
    errors.push("User ID is required");
  }

  // Validate metadata is a valid object if provided
  if (input.metadata !== undefined && input.metadata !== null) {
    if (typeof input.metadata !== "object" || Array.isArray(input.metadata)) {
      errors.push("Metadata must be a valid object");
    }

    // Check metadata size (prevent extremely large payloads)
    const metadataStr = JSON.stringify(input.metadata);
    if (metadataStr.length > 10000) {
      errors.push("Metadata exceeds maximum allowed size (10KB)");
    }
  }

  return errors;
}

// ============================================
// EVENT TRACKING
// ============================================

export async function trackEvent(input: CreateEventInput) {
  // Validate input
  const validationErrors = validateEventInput(input);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid event input: ${validationErrors.join(", ")}`);
  }

  // Verify user exists
  const userExists = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, isActive: true },
  });

  if (!userExists) {
    throw new Error(`User not found: ${input.userId}`);
  }

  if (!userExists.isActive) {
    // Still track event but add flag to metadata
    input.metadata = {
      ...input.metadata,
      _userInactive: true,
    };
  }

  // Verify job exists if jobId provided
  if (input.jobId) {
    const jobExists = await prisma.job.findUnique({
      where: { id: input.jobId },
      select: { id: true },
    });

    if (!jobExists) {
      throw new Error(`Job not found: ${input.jobId}`);
    }
  }

  // Verify referral exists if referralId provided
  if (input.referralId) {
    const referralExists = await prisma.referral.findUnique({
      where: { id: input.referralId },
      select: { id: true },
    });

    if (!referralExists) {
      throw new Error(`Referral not found: ${input.referralId}`);
    }
  }

  // Create event with sanitized metadata
  const event = await prisma.event.create({
    data: {
      type: input.type,
      userId: input.userId,
      jobId: input.jobId ?? null,
      referralId: input.referralId ?? null,
      metadata: input.metadata ?? {},
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return event;
}

// ============================================
// BATCH EVENT TRACKING (for performance)
// ============================================

export async function trackEventsBatch(inputs: CreateEventInput[]) {
  if (!inputs || inputs.length === 0) {
    return { created: 0, errors: [] };
  }

  // Limit batch size
  const MAX_BATCH_SIZE = 100;
  if (inputs.length > MAX_BATCH_SIZE) {
    throw new Error(`Batch size exceeds maximum of ${MAX_BATCH_SIZE}`);
  }

  const results: { created: number; errors: string[] } = {
    created: 0,
    errors: [],
  };

  // Validate all inputs first
  for (let i = 0; i < inputs.length; i++) {
    const validationErrors = validateEventInput(inputs[i]);
    if (validationErrors.length > 0) {
      results.errors.push(`Event ${i}: ${validationErrors.join(", ")}`);
    }
  }

  if (results.errors.length > 0) {
    return results;
  }

  // Get unique user IDs and verify they exist
  const userIds = [...new Set(inputs.map((i) => i.userId))];
  const existingUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true },
  });
  const existingUserIds = new Set(existingUsers.map((u) => u.id));

  // Filter out events for non-existent users
  const validInputs = inputs.filter((input) => {
    if (!existingUserIds.has(input.userId)) {
      results.errors.push(`User not found: ${input.userId}`);
      return false;
    }
    return true;
  });

  if (validInputs.length === 0) {
    return results;
  }

  // Batch create events
  const createResult = await prisma.event.createMany({
    data: validInputs.map((input) => ({
      type: input.type,
      userId: input.userId,
      jobId: input.jobId ?? null,
      referralId: input.referralId ?? null,
      metadata: input.metadata ?? {},
    })),
  });

  results.created = createResult.count;
  return results;
}

// ============================================
// EVENT QUERIES
// ============================================

export async function getEvents(filters: EventFilters) {
  const {
    userId,
    type,
    jobId,
    referralId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filters;

  // Validate limit
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const safeOffset = Math.max(0, offset);

  const where: Prisma.EventWhereInput = {};

  if (userId) {
    where.userId = userId;
  }

  if (type) {
    where.type = type;
  }

  if (jobId) {
    where.jobId = jobId;
  }

  if (referralId) {
    where.referralId = referralId;
  }

  // Date range filtering
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      skip: safeOffset,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    pagination: {
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + events.length < total,
    },
  };
}

export async function getEventsByUser(userId: string, limit: number = 50) {
  if (!userId || userId.trim() === "") {
    throw new Error("User ID is required");
  }

  // Verify user exists
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!userExists) {
    throw new Error(`User not found: ${userId}`);
  }

  return getEvents({ userId, limit });
}

export async function getEventsByJob(jobId: string, limit: number = 50) {
  if (!jobId || jobId.trim() === "") {
    throw new Error("Job ID is required");
  }

  // Verify job exists
  const jobExists = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true },
  });

  if (!jobExists) {
    throw new Error(`Job not found: ${jobId}`);
  }

  return getEvents({ jobId, limit });
}

// ============================================
// ANALYTICS
// ============================================

export async function getEventAnalytics(
  filters: {
    userId?: string;
    jobId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<EventAnalytics> {
  const where: Prisma.EventWhereInput = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.jobId) {
    where.jobId = filters.jobId;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  // Get total events
  const totalEvents = await prisma.event.count({ where });

  // Get events by type
  const eventsByTypeRaw = await prisma.event.groupBy({
    by: ["type"],
    where,
    _count: { type: true },
  });

  const eventsByType = eventsByTypeRaw.reduce(
    (acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    },
    {} as Record<EventType, number>
  );

  // Get unique users
  const uniqueUsersResult = await prisma.event.findMany({
    where,
    select: { userId: true },
    distinct: ["userId"],
  });
  const uniqueUsers = uniqueUsersResult.length;

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentEvents = await prisma.event.findMany({
    where: {
      ...where,
      createdAt: { gte: sevenDaysAgo },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const activityByDate: Record<string, number> = {};
  for (const event of recentEvents) {
    const dateStr = event.createdAt.toISOString().split("T")[0];
    activityByDate[dateStr] = (activityByDate[dateStr] || 0) + 1;
  }

  const recentActivity = Object.entries(activityByDate).map(
    ([date, count]) => ({
      date,
      count,
    })
  );

  return {
    totalEvents,
    eventsByType,
    uniqueUsers,
    recentActivity,
  };
}

// ============================================
// SPECIFIC EVENT TRACKERS (convenience methods)
// ============================================

export async function trackJobViewed(userId: string, jobId: string) {
  return trackEvent({
    type: "JOB_VIEWED",
    userId,
    jobId,
    metadata: { viewedAt: new Date().toISOString() },
  });
}

export async function trackNudgesShown(
  userId: string,
  jobId: string,
  nudgeCount: number,
  nudgeCategories: string[]
) {
  return trackEvent({
    type: "NUDGES_SHOWN",
    userId,
    jobId,
    metadata: {
      nudgeCount,
      nudgeCategories,
      shownAt: new Date().toISOString(),
    },
  });
}

export async function trackMessageCopied(
  userId: string,
  jobId: string,
  messageType: string
) {
  return trackEvent({
    type: "MESSAGE_COPIED",
    userId,
    jobId,
    metadata: {
      messageType,
      copiedAt: new Date().toISOString(),
    },
  });
}

export async function trackReferralStarted(
  userId: string,
  jobId: string,
  referralId: string
) {
  return trackEvent({
    type: "REFERRAL_STARTED",
    userId,
    jobId,
    referralId,
    metadata: { startedAt: new Date().toISOString() },
  });
}

export async function trackReferralSubmitted(
  userId: string,
  jobId: string,
  referralId: string
) {
  return trackEvent({
    type: "REFERRAL_SUBMITTED",
    userId,
    jobId,
    referralId,
    metadata: { submittedAt: new Date().toISOString() },
  });
}

export async function trackReferralStatusChanged(
  userId: string,
  referralId: string,
  previousStatus: string,
  newStatus: string,
  jobId?: string
) {
  return trackEvent({
    type: "REFERRAL_STATUS_CHANGED",
    userId,
    jobId,
    referralId,
    metadata: {
      previousStatus,
      newStatus,
      changedAt: new Date().toISOString(),
    },
  });
}

export async function trackProfileUpdated(
  userId: string,
  updatedFields: string[]
) {
  return trackEvent({
    type: "PROFILE_UPDATED",
    userId,
    metadata: {
      updatedFields,
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function trackJobCreated(userId: string, jobId: string) {
  return trackEvent({
    type: "JOB_CREATED",
    userId,
    jobId,
    metadata: { createdAt: new Date().toISOString() },
  });
}

export async function trackJobClosed(userId: string, jobId: string) {
  return trackEvent({
    type: "JOB_CLOSED",
    userId,
    jobId,
    metadata: { closedAt: new Date().toISOString() },
  });
}

// ============================================
// CLEANUP (for data retention)
// ============================================

export async function deleteOldEvents(olderThanDays: number = 90) {
  if (olderThanDays < 30) {
    throw new Error("Cannot delete events less than 30 days old");
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.event.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return { deletedCount: result.count };
}