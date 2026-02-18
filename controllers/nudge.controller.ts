/**
 * Nudge Controller
 * Handles HTTP logic for nudge-related endpoints
 */

import { NextResponse } from 'next/server';
import { AuthUser } from '@/lib/auth';
import {
  validateBody,
  validationErrorResponse,
  NudgeInteractionSchema,
} from '@/lib/middleware/validation.middleware';
import {
  withErrorHandler,
  successResponse,
  createdResponse,
  NotFoundError,
} from '@/lib/middleware/error-handler.middleware';
import { getReferralNudges } from '@/services/nudges/nudge.service';
import {
  createNudgeLog,
  logInteractionByContext,
  getNudgeStatsForJob,
  getNudgeStatsForMember,
  getExperimentResults,
} from '@/services/nudges/nudge-log.service';
import { getMatchScore } from '@/services/matching/matching.service';

// ============================================
// Get Referral Nudges for Job
// ============================================

export async function getReferralNudgesController(
  jobId: string,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const result = await getReferralNudges(user.id, jobId);

    return successResponse(result);
  });
}

// ============================================
// Get Personalized Nudge
// ============================================

export async function getPersonalizedNudgeController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId') || user.id;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId query parameter is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Get match score for context
    const matchScore = await getMatchScore(memberId, jobId);

    // Get nudges
    const nudges = await getReferralNudges(memberId, jobId);

    // Create nudge log
    const nudgeLogId = await createNudgeLog({
      memberId,
      jobId,
      nudgeType: matchScore.tier === 'HIGH' ? 'PERSONALIZED' : 'SKILL_BASED',
      nudgeContent: {
        headline: 'You may know the perfect candidate!',
        body: nudges.explain || nudges.nudges[0] || '',
        cta: 'Refer Someone',
        inferences: matchScore.topInferences,
      },
      matchScore: matchScore.overall,
      matchTier: matchScore.tier,
      reasonsSummary: matchScore.reasons.map(r => r.explanation),
    });

    return successResponse({
      nudge: {
        id: nudgeLogId,
        headline: 'You may know the perfect candidate!',
        body: nudges.explain || nudges.nudges[0] || '',
        cta: 'Refer Someone',
        matchScore: matchScore.overall,
        matchTier: matchScore.tier,
        inferences: matchScore.topInferences,
      },
    });
  });
}

// ============================================
// Log Nudge Interaction
// ============================================

export async function logNudgeInteractionController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = await validateBody(req, NudgeInteractionSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const data = validation.data!;

    // Use effective member ID (from body or auth)
    const memberId = data.memberId || user.id;

    const interactionId = await logInteractionByContext(
      memberId,
      data.jobId,
      data.action as any,
      data.metadata
    );

    return createdResponse({
      logged: true,
      interactionId,
    });
  });
}

// ============================================
// Get Nudge Stats
// ============================================

export async function getNudgeStatsController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const memberId = searchParams.get('memberId');

    let stats;

    if (jobId) {
      stats = await getNudgeStatsForJob(jobId);
    } else if (memberId) {
      // Only allow viewing own stats or admin
      if (memberId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      stats = await getNudgeStatsForMember(memberId);
    } else {
      stats = await getNudgeStatsForMember(user.id);
    }

    return successResponse({ stats });
  });
}

// ============================================
// Get A/B Experiment Results
// ============================================

export async function getExperimentResultsController(
  experimentId: string,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    // Only admins can view experiment results
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const results = await getExperimentResults(experimentId);

    return successResponse({ results });
  });
}
