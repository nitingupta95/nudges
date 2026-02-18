/**
 * Matching Controller
 * Handles HTTP logic for matching score endpoints
 */

import { NextResponse } from 'next/server';
import { AuthUser } from '@/lib/auth';
import {
  validateBody,
  validateQuery,
  validationErrorResponse,
  MatchScoreQuerySchema,
  BatchScoreSchema,
  TopMembersQuerySchema,
} from '@/lib/middleware/validation.middleware';
import {
  withErrorHandler,
  successResponse,
  ForbiddenError,
} from '@/lib/middleware/error-handler.middleware';
import {
  getMatchScore,
  batchScoreMembers,
  getTopMembersForJob,
} from '@/services/matching/matching.service';

// ============================================
// Get Match Score
// ============================================

export async function getMatchScoreController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = validateQuery(req, MatchScoreQuerySchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const { memberId, jobId } = validation.data!;

    // Users can only view their own match scores unless admin
    if (memberId !== user.id && user.role !== 'ADMIN' && user.role !== 'RECRUITER') {
      throw new ForbiddenError('You can only view your own match scores');
    }

    const matchScore = await getMatchScore(memberId, jobId);

    return successResponse({
      matchScore: {
        overall: matchScore.overall,
        tier: matchScore.tier,
        breakdown: matchScore.breakdown,
        reasons: matchScore.reasons,
      },
    });
  });
}

// ============================================
// Batch Score Members
// ============================================

export async function batchScoreMembersController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    // Only recruiters and admins can batch score
    if (user.role !== 'ADMIN' && user.role !== 'RECRUITER') {
      throw new ForbiddenError('Only recruiters can perform batch scoring');
    }

    const validation = await validateBody(req, BatchScoreSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const { jobId, memberIds, options } = validation.data!;

    const result = await batchScoreMembers(jobId, memberIds, {
      includeReasons: options?.includeReasons ?? true,
      minScore: options?.minScore ?? 0,
    });

    return successResponse(result);
  });
}

// ============================================
// Get Top Members for Job
// ============================================

export async function getTopMembersController(
  req: Request,
  jobId: string,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    // Only recruiters and admins can view top members
    if (user.role !== 'ADMIN' && user.role !== 'RECRUITER') {
      throw new ForbiddenError('Only recruiters can view top members');
    }

    const validation = validateQuery(req, TopMembersQuerySchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const { limit, minTier } = validation.data!;

    const topMembers = await getTopMembersForJob(jobId, limit, minTier as any);

    return successResponse({ topMembers });
  });
}
