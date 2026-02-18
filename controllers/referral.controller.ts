/**
 * Referral Controller
 * Handles HTTP logic for referral-related endpoints
 */

import { NextResponse } from 'next/server';
import { AuthUser } from '@/lib/auth';
import {
  validateBody,
  validateQuery,
  validationErrorResponse,
  CreateReferralSchema,
  UpdateReferralSchema,
  ReferralFiltersSchema,
} from '@/lib/middleware/validation.middleware';
import {
  withErrorHandler,
  successResponse,
  createdResponse,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '@/lib/middleware/error-handler.middleware';
import {
  createReferral,
  listReferrals,
  getReferralById,
  updateReferralStatus,
  deleteReferral,
  getReferralAnalytics,
} from '@/services/referrals/referrals.service';
import { logInteractionByContext } from '@/services/nudges/nudge-log.service';

// ============================================
// List Referrals
// ============================================

export async function listReferralsController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = validateQuery(req, ReferralFiltersSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const filters = validation.data!;
    
    // Non-admins can only see their own referrals
    const effectiveUserId = user.role === 'ADMIN' 
      ? filters.userId 
      : user.id;

    const referrals = await listReferrals(effectiveUserId || user.id, {
      status: filters.status as any,
      limit: filters.limit,
      offset: filters.offset,
    });

    return successResponse({ referrals });
  });
}

// ============================================
// Create Referral
// ============================================

export async function createReferralController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = await validateBody(req, CreateReferralSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const data = validation.data!;

    try {
      const referral = await createReferral(
        user.id,
        data.jobId,
        data.relationType as any,
        data.candidateName,
        data.candidateEmail,
        data.candidatePhone,
        data.referralNote
      );

      // Log referral interaction if nudge was used
      if (data.nudgeUsed) {
        await logInteractionByContext(
          user.id,
          data.jobId,
          'REFERRED',
          { nudgeId: data.nudgeUsed }
        );
      }

      return createdResponse({ referral });
    } catch (error) {
      if ((error as Error).message?.includes('already exists')) {
        throw new ConflictError('A referral for this candidate already exists');
      }
      throw error;
    }
  });
}

// ============================================
// Get Referral by ID
// ============================================

export async function getReferralController(
  referralId: string,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const referral = await getReferralById(referralId);
    
    if (!referral) {
      throw new NotFoundError('Referral', referralId);
    }

    // Check access
    if (referral.referrerId !== user.id && user.role !== 'ADMIN' && user.role !== 'RECRUITER') {
      throw new ForbiddenError('You do not have permission to view this referral');
    }

    return successResponse({ referral });
  });
}

// ============================================
// Update Referral Status
// ============================================

export async function updateReferralController(
  req: Request,
  referralId: string,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = await validateBody(req, UpdateReferralSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const existingReferral = await getReferralById(referralId);
    if (!existingReferral) {
      throw new NotFoundError('Referral', referralId);
    }

    // Only recruiters, admins, or the referrer can update
    const canUpdate = 
      user.role === 'ADMIN' || 
      user.role === 'RECRUITER' ||
      existingReferral.referrerId === user.id;

    if (!canUpdate) {
      throw new ForbiddenError('You do not have permission to update this referral');
    }

    // Referrers can only withdraw their referrals
    if (existingReferral.referrerId === user.id && user.role === 'MEMBER') {
      const data = validation.data!;
      if (data.status && data.status !== 'WITHDRAWN') {
        throw new ForbiddenError('You can only withdraw your referral');
      }
    }

    const data = validation.data!;
    const updatedReferral = await updateReferralStatus(
      referralId,
      data.status as any,
      user.id,
      data.reviewNotes
    );

    return successResponse({ referral: updatedReferral });
  });
}

// ============================================
// Delete Referral
// ============================================

export async function deleteReferralController(
  referralId: string,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const existingReferral = await getReferralById(referralId);
    if (!existingReferral) {
      throw new NotFoundError('Referral', referralId);
    }

    // Only the referrer or admin can delete
    if (existingReferral.referrerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to delete this referral');
    }

    await deleteReferral(referralId);

    return successResponse({ message: 'Referral deleted successfully' });
  });
}

// ============================================
// Get Referral Analytics
// ============================================

export async function getReferralAnalyticsController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Determine which user's analytics to fetch
    let targetUserId = user.id;
    
    // Allow admins and recruiters to view other users' analytics
    if (userId && (user.role === 'ADMIN' || user.role === 'RECRUITER')) {
      targetUserId = userId;
    } else if (userId && userId !== user.id) {
      throw new ForbiddenError('You do not have permission to view other users\' analytics');
    }

    const analytics = await getReferralAnalytics(targetUserId);

    return successResponse({ analytics });
  });
}
