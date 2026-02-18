/**
 * User Controller
 * Handles HTTP logic for user and profile endpoints
 */

import { NextResponse } from 'next/server';
import { AuthUser } from '@/lib/auth';
import {
  validateBody,
  validationErrorResponse,
  UpdateProfileSchema,
  ContactInsightsSchema,
} from '@/lib/middleware/validation.middleware';
import {
  withErrorHandler,
  successResponse,
  NotFoundError,
} from '@/lib/middleware/error-handler.middleware';
import { getUserProfile } from '@/services/user/user.service';
import {
  getMemberProfileByUserId,
  upsertMemberProfile,
} from '@/services/member/member.service';
import { extractContactInsights } from '@/services/ai/ai.service';
import { invalidateMemberScores } from '@/services/matching/matching.service';

// ============================================
// Get Current User
// ============================================

export async function getCurrentUserController(
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userProfile = await getUserProfile(user.id);

    if (!userProfile) {
      throw new NotFoundError('User', user.id);
    }

    return successResponse(userProfile);
  });
}

// ============================================
// Get User Profile
// ============================================

export async function getUserProfileController(
  userId: string,
  currentUser: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    // Users can only view their own profile unless admin
    if (userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const userProfile = await getUserProfile(userId);

    if (!userProfile) {
      throw new NotFoundError('User', userId);
    }

    return successResponse(userProfile);
  });
}

// ============================================
// Get Member Preferences
// ============================================

export async function getMemberPreferencesController(
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const profile = await getMemberProfileByUserId(user.id);

    if (!profile) {
      throw new NotFoundError('Member profile', user.id);
    }

    return successResponse({ profile });
  });
}

// ============================================
// Update Member Profile
// ============================================

export async function updateMemberProfileController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = await validateBody(req, UpdateProfileSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const data = validation.data!;

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.primarySkills !== undefined) updateData.primarySkills = data.primarySkills;
    if (data.pastCompanies !== undefined) updateData.pastCompanies = data.pastCompanies;
    if (data.domains !== undefined) updateData.domains = data.domains;
    if (data.industries !== undefined) updateData.industries = data.industries;
    if (data.experienceLevel !== undefined) updateData.experienceLevel = data.experienceLevel;
    if (data.yearsOfExperience !== undefined) updateData.yearsOfExperience = data.yearsOfExperience;
    if (data.currentCompany !== undefined) updateData.currentCompany = data.currentCompany;
    if (data.currentTitle !== undefined) updateData.currentTitle = data.currentTitle;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl;
    if (data.preferredDomains !== undefined) updateData.preferredDomains = data.preferredDomains;
    if (data.preferredRoles !== undefined) updateData.preferredRoles = data.preferredRoles;
    if (data.isOpenToRefer !== undefined) updateData.isOpenToRefer = data.isOpenToRefer;
    if (data.networkPrefs !== undefined) updateData.networkPrefs = data.networkPrefs;

    const updatedProfile = await upsertMemberProfile(user.id, updateData);

    // Invalidate cached match scores when profile changes
    if (data.skills || data.pastCompanies || data.domains || data.experienceLevel) {
      // Get member profile ID
      const profile = await getMemberProfileByUserId(user.id);
      if (profile) {
        await invalidateMemberScores(profile.id);
      }
    }

    return successResponse({ profile: updatedProfile });
  });
}

// ============================================
// Get Contact Insights
// ============================================

export async function getContactInsightsController(
  req: Request
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = await validateBody(req, ContactInsightsSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const { jobTitle, jobDescription, company } = validation.data!;

    const insights = await extractContactInsights(
      jobTitle,
      jobDescription,
      company
    );

    return successResponse({ insights });
  });
}

// ============================================
// Get User Preferences (API route compatibility)
// ============================================

export async function getUserPreferencesController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const profile = await getMemberProfileByUserId(user.id);

    if (!profile) {
      throw new NotFoundError('Member profile', user.id);
    }

    return successResponse({ profile });
  });
}

// ============================================
// Update User Preferences (API route compatibility)
// ============================================

export async function updateUserPreferencesController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const body = await req.json();

    const {
      skills,
      pastCompanies,
      domains,
      experienceLevel,
      yearsOfExperience,
      preferredRoles,
      preferredDomains,
      isOpenToRefer,
    } = body;

    // Validate experience level
    if (experienceLevel) {
      const validLevels = [
        'INTERN',
        'ENTRY',
        'MID',
        'SENIOR',
        'STAFF',
        'PRINCIPAL',
        'EXECUTIVE',
      ];
      if (!validLevels.includes(experienceLevel)) {
        return NextResponse.json(
          { error: 'Invalid experience level', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (skills !== undefined) updateData.skills = skills;
    if (pastCompanies !== undefined) updateData.pastCompanies = pastCompanies;
    if (domains !== undefined) updateData.domains = domains;
    if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel;
    if (yearsOfExperience !== undefined) updateData.yearsOfExperience = yearsOfExperience;
    if (isOpenToRefer !== undefined) updateData.isOpenToRefer = isOpenToRefer;
    
    // Handle preferences object
    if (preferredRoles !== undefined || preferredDomains !== undefined) {
      updateData.preferences = {
        ...(preferredRoles && { preferredRoles }),
        ...(preferredDomains && { preferredDomains }),
      };
    }

    const updatedProfile = await upsertMemberProfile(user.id, updateData);

    // Invalidate cached match scores when profile changes
    if (skills || pastCompanies || domains || experienceLevel) {
      const profile = await getMemberProfileByUserId(user.id);
      if (profile) {
        await invalidateMemberScores(profile.id);
      }
    }

    return successResponse({ profile: updatedProfile });
  });
}
