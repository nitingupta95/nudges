/**
 * Event Controller
 * Handles HTTP logic for analytics and event tracking endpoints
 */

import { NextResponse } from 'next/server';
import { AuthUser } from '@/lib/auth';
import {
  validateBody,
  validateQuery,
  validationErrorResponse,
  CreateEventSchema,
  PaginationSchema,
} from '@/lib/middleware/validation.middleware';
import {
  withErrorHandler,
  successResponse,
  createdResponse,
  ForbiddenError,
} from '@/lib/middleware/error-handler.middleware';
import {
  createEvent,
  getEvents,
  getEventCountsByJob,
  getEventAggregations,
  deleteOldEvents,
} from '@/services/events/event.service';
import { z } from 'zod';

// ============================================
// Validation Schemas
// ============================================

const EventFiltersSchema = z.object({
  userId: z.string().optional(),
  jobId: z.string().optional(),
  referralId: z.string().optional(),
  type: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(100),
  offset: z.coerce.number().min(0).default(0),
});

// ============================================
// Create Event
// ============================================

export async function createEventController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = await validateBody(req, CreateEventSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const data = validation.data!;

    const event = await createEvent({
      type: data.type as any,
      userId: user.id,
      jobId: data.jobId,
      referralId: data.referralId,
      metadata: data.metadata,
    });

    return createdResponse({ event });
  });
}

// ============================================
// Get Events
// ============================================

export async function getEventsController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = validateQuery(req, EventFiltersSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const filters = validation.data!;

    // Non-admins can only see their own events
    if (user.role !== 'ADMIN' && filters.userId && filters.userId !== user.id) {
      throw new ForbiddenError('You can only view your own events');
    }

    const effectiveUserId = user.role === 'ADMIN' 
      ? filters.userId 
      : user.id;

    const events = await getEvents({
      userId: effectiveUserId,
      jobId: filters.jobId,
      referralId: filters.referralId,
      type: filters.type as any,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      limit: filters.limit,
      offset: filters.offset,
    });

    return successResponse({ events });
  });
}

// ============================================
// Get Event Counts by Job
// ============================================

export async function getEventCountsByJobController(
  req: Request,
  jobId: string,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    // Only recruiters and admins can view job event counts
    if (user.role !== 'ADMIN' && user.role !== 'RECRUITER') {
      throw new ForbiddenError('Only recruiters can view job event counts');
    }

    const counts = await getEventCountsByJob(jobId);

    return successResponse({ counts });
  });
}

// ============================================
// Get Event Aggregations
// ============================================

export async function getEventAggregationsController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    // Only admins can view aggregations
    if (user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can view event aggregations');
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const aggregations = await getEventAggregations({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return successResponse({ aggregations });
  });
}

// ============================================
// Delete Old Events
// ============================================

export async function deleteOldEventsController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    // Only admins can delete events
    if (user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can delete events');
    }

    const { searchParams } = new URL(req.url);
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '90');

    if (olderThanDays < 30) {
      return NextResponse.json(
        { error: 'Cannot delete events less than 30 days old', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const deletedCount = await deleteOldEvents(olderThanDays);

    return successResponse({ deletedCount, olderThanDays });
  });
}
