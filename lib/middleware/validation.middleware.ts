/**
 * Validation Middleware
 * Provides schema validation for request bodies, query params, and route params
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

export type ValidationSchema = z.ZodType<any, any, any>;

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map(
        (err) => `${String(err.path.join('.'))}: ${err.message}`
      );
      return { success: false, errors };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, errors: ['Invalid JSON body'] };
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
  req: Request,
  schema: z.ZodType<T>
): ValidationResult<T> {
  const { searchParams } = new URL(req.url);
  const params: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    if (params[key]) {
      // Handle array params
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    const errors = result.error.issues.map(
      (err) => `${String(err.path.join('.'))}: ${err.message}`
    );
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Create validation error response
 */
export function validationErrorResponse(errors: string[]): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
    },
    { status: 400 }
  );
}

// ============================================
// Common Validation Schemas
// ============================================

export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const IdParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const SortSchema = z.object({
  orderBy: z.string().optional(),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// Job Validation Schemas
// ============================================

export const CreateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  company: z.string().min(1, 'Company is required').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters').max(50000),
  location: z.string().max(200).optional(),
  isRemote: z.boolean().default(false),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  salaryCurrency: z.string().default('USD'),
  experienceLevel: z.enum(['INTERN', 'ENTRY', 'MID', 'SENIOR', 'STAFF', 'PRINCIPAL', 'EXECUTIVE']).default('MID'),
  minExperience: z.number().min(0).optional(),
  maxExperience: z.number().min(0).optional(),
  domain: z.string().default('general'),
  industry: z.string().optional(),
  closingDate: z.string().datetime().optional(),
  sourceUrl: z.string().url().optional(),
}).refine(
  (data) => !data.salaryMin || !data.salaryMax || data.salaryMin <= data.salaryMax,
  { message: 'Minimum salary cannot exceed maximum salary', path: ['salaryMin'] }
);


export const UpdateJobSchema = z.object({
  title: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  description: z.string().max(50000).optional(),
  location: z.string().max(200).optional(),
  isRemote: z.boolean().optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  salaryCurrency: z.string().optional(),
  experienceLevel: z.enum(['INTERN', 'ENTRY', 'MID', 'SENIOR', 'STAFF', 'PRINCIPAL', 'EXECUTIVE']).optional(),
  minExperience: z.number().min(0).optional(),
  maxExperience: z.number().min(0).optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  closingDate: z.string().datetime().optional(),
  sourceUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  reParseTags: z.boolean().optional(),
}).refine(
  (data) => !data.salaryMin || !data.salaryMax || data.salaryMin <= data.salaryMax,
  { message: 'Minimum salary cannot exceed maximum salary', path: ['salaryMin'] }
);

export const JobFiltersSchema = z.object({
  search: z.string().optional(),
  company: z.string().optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  experienceLevel: z.enum(['INTERN', 'ENTRY', 'MID', 'SENIOR', 'STAFF', 'PRINCIPAL', 'EXECUTIVE']).optional(),
  skills: z.string().transform(s => s?.split(',').filter(Boolean)).optional(),
  isActive: z.coerce.boolean().default(true),
  isRemote: z.coerce.boolean().optional(),
  minSalary: z.coerce.number().optional(),
  maxSalary: z.coerce.number().optional(),
  closingBefore: z.string().datetime().optional(),
  closingAfter: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  orderBy: z.enum(['createdAt', 'closingDate', 'salaryMax']).default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// Referral Validation Schemas
// ============================================

export const CreateReferralSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  candidateName: z.string().min(1, 'Candidate name is required').max(200),
  candidateEmail: z.string().email('Invalid email address'),
  candidatePhone: z.string().optional(),
  candidateLinkedIn: z.string().url().optional(),
  candidateResume: z.string().url().optional(),
  relationType: z.enum([
    'EX_COLLEAGUE', 'COLLEGE_ALUMNI', 'FRIEND', 'FAMILY',
    'BOOTCAMP_CONNECTION', 'LINKEDIN_CONNECTION', 'RELATIVE',
    'CLASSMATE', 'MENTOR', 'MENTEE', 'OTHER'
  ]),
  relationshipNote: z.string().max(1000).optional(),
  howLongKnown: z.string().optional(),
  workedTogether: z.boolean().default(false),
  workedTogetherAt: z.string().optional(),
  referralNote: z.string().max(2000).optional(),
  whyGoodFit: z.string().max(2000).optional(),
  nudgeUsed: z.string().optional(),
});

export const UpdateReferralSchema = z.object({
  status: z.enum([
    'PENDING', 'DRAFT', 'SUBMITTED', 'VIEWED', 'UNDER_REVIEW',
    'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'
  ]).optional(),
  reviewNotes: z.string().max(2000).optional(),
  rejectionReason: z.string().optional(),
});

export const ReferralFiltersSchema = z.object({
  userId: z.string().optional(),
  jobId: z.string().optional(),
  status: z.enum([
    'PENDING', 'DRAFT', 'SUBMITTED', 'VIEWED', 'UNDER_REVIEW',
    'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'
  ]).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// ============================================
// Nudge Validation Schemas
// ============================================

export const NudgeInteractionSchema = z.object({
  memberId: z.string().min(1),
  jobId: z.string().min(1),
  nudgeId: z.string().optional(),
  action: z.enum([
    'VIEWED', 'HOVERED', 'CLICKED', 'SHARE_WHATSAPP',
    'SHARE_LINKEDIN', 'SHARE_EMAIL', 'COPY_MESSAGE', 'DISMISSED', 'REFERRED'
  ]),
  metadata: z.record(z.string(), z.any()).optional(),
});

// ============================================
// Matching Validation Schemas
// ============================================

export const MatchScoreQuerySchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  jobId: z.string().min(1, 'Job ID is required'),
});

export const BatchScoreSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  memberIds: z.array(z.string()).min(1).max(100),
  options: z.object({
    includeReasons: z.boolean().default(true),
    minScore: z.number().min(0).max(100).default(0),
  }).optional(),
});

export const TopMembersQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  minTier: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
});

// ============================================
// Message Validation Schemas
// ============================================

export const GenerateMessageSchema = z.object({
  memberId: z.string().min(1),
  jobId: z.string().min(1),
  template: z.enum(['friendly', 'professional', 'casual']).default('friendly'),
  customContext: z.object({
    recipientName: z.string().optional(),
    additionalNotes: z.string().optional(),
  }).optional(),
});

// ============================================
// Event Validation Schemas
// ============================================

export const CreateEventSchema = z.object({
  type: z.enum([
    'JOB_VIEWED', 'JOB_SEARCHED', 'NUDGE_SHOWN', 'NUDGE_CLICKED',
    'NUDGE_DISMISSED', 'MESSAGE_GENERATED', 'MESSAGE_COPIED',
    'REFERRAL_STARTED', 'REFERRAL_SUBMITTED', 'REFERRAL_STATUS_CHANGED',
    'REFERRAL_WITHDRAWN', 'PROFILE_UPDATED', 'JOB_CREATED', 'JOB_CLOSED',
    'JOB_CLOSING_REMINDER', 'SHARE_CLICKED', 'LOGIN', 'SIGNUP', 'LOGOUT'
  ]),
  jobId: z.string().optional(),
  referralId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  sessionId: z.string().optional(),
});

// ============================================
// User/Profile Validation Schemas
// ============================================

export const UpdateProfileSchema = z.object({
  skills: z.array(z.string()).optional(),
  primarySkills: z.array(z.string()).optional(),
  pastCompanies: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  experienceLevel: z.enum(['INTERN', 'ENTRY', 'MID', 'SENIOR', 'STAFF', 'PRINCIPAL', 'EXECUTIVE']).optional(),
  yearsOfExperience: z.number().min(0).optional(),
  currentCompany: z.string().optional(),
  currentTitle: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  preferredDomains: z.array(z.string()).optional(),
  preferredRoles: z.array(z.string()).optional(),
  isOpenToRefer: z.boolean().optional(),
  networkPrefs: z.object({
    relativesInTech: z.boolean().optional(),
    collegeJuniors: z.boolean().optional(),
    bootcampGrads: z.boolean().optional(),
  }).optional(),
});

// ============================================
// Contact Insights Validation Schema
// ============================================

export const ContactInsightsSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  jobDescription: z.string().min(1, 'Job description is required'),
  company: z.string().optional(),
});
