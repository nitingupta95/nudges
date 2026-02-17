/**
 * Job Controller
 * Handles HTTP logic for job-related endpoints
 */

import { NextResponse } from 'next/server';
import { AuthUser } from '@/lib/auth';
import {
  validateBody,
  validateQuery,
  validationErrorResponse,
  CreateJobSchema,
  UpdateJobSchema,
  JobFiltersSchema,
} from '@/lib/middleware/validation.middleware';
import {
  withErrorHandler,
  successResponse,
  createdResponse,
  NotFoundError,
  ForbiddenError,
} from '@/lib/middleware/error-handler.middleware';
import {
  createJob,
  listJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobStats,
  type CreateJobInput,
  type UpdateJobInput,
} from '@/services/job/job.service';
import { invalidateJobScores } from '@/services/matching/matching.service';

// ============================================
// List Jobs
// ============================================

export async function listJobsController(req: Request): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = validateQuery(req, JobFiltersSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const filters = validation.data!;
    const result = await listJobs({
      search: filters.search,
      company: filters.company,
      isActive: filters.isActive,
      isRemote: filters.isRemote,
      experienceLevel: filters.experienceLevel as any,
      skills: filters.skills,
      domains: filters.domain ? [filters.domain] : undefined,
      minSalary: filters.minSalary,
      maxSalary: filters.maxSalary,
      closingBefore: filters.closingBefore ? new Date(filters.closingBefore) : undefined,
      closingAfter: filters.closingAfter ? new Date(filters.closingAfter) : undefined,
      limit: filters.limit,
      offset: filters.offset,
      orderBy: filters.orderBy as any,
      orderDir: filters.orderDir as any,
    });

    return successResponse(result);
  });
}

// ============================================
// Create Job
// ============================================

export async function createJobController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = await validateBody(req, CreateJobSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const data = validation.data!;
    
    const job = await createJob({
      title: data.title,
      company: data.company,
      description: data.description,
      location: data.location,
      isRemote: data.isRemote,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      experienceLevel: data.experienceLevel as any,
      closingDate: data.closingDate ? new Date(data.closingDate) : undefined,
      createdById: user.id,
    } as CreateJobInput);

    return createdResponse({ job });
  });
}

// ============================================
// Get Job by ID
// ============================================

export async function getJobController(jobId: string): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const job = await getJobById(jobId);
    
    if (!job) {
      throw new NotFoundError('Job', jobId);
    }

    return successResponse({ job });
  });
}

// ============================================
// Update Job
// ============================================

export async function updateJobController(
  req: Request,
  jobId: string,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = await validateBody(req, UpdateJobSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    // Check ownership or admin
    const existingJob = await getJobById(jobId);
    if (!existingJob) {
      throw new NotFoundError('Job', jobId);
    }

    if (existingJob.createdById !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to update this job');
    }

    const data = validation.data!;
    const updatedJob = await updateJob(jobId, data as UpdateJobInput);

    // Invalidate cached match scores if job details changed
    if (data.description || data.title) {
      await invalidateJobScores(jobId);
    }

    return successResponse({ job: updatedJob });
  });
}

// ============================================
// Delete Job
// ============================================

export async function deleteJobController(
  jobId: string,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const existingJob = await getJobById(jobId);
    if (!existingJob) {
      throw new NotFoundError('Job', jobId);
    }

    if (existingJob.createdById !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to delete this job');
    }

    await deleteJob(jobId, user.id);

    return successResponse({ message: 'Job deleted successfully' });
  });
}

// ============================================
// Get Job Stats
// ============================================

export async function getJobStatsController(
  req: Request,
  user?: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const stats = await getJobStats();

    return successResponse({ stats });
  });
}
