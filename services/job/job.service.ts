import { prisma } from "@/lib/prisma";
import { ExperienceLevel } from "@/types/enums";
import { ParsedJobTags, parseJobDescription, parseJobDescriptionWithAI } from "../job/job.parser";
import { JobTag, Prisma } from "@/lib/generated/prisma/client";
import { Job } from "@/types";
import { summarizeJobDescription } from "@/services/ai/ai.service";

// ============================================
// TYPES
// ============================================

export interface CreateJobInput {
  title: string;
  company: string;
  description: string;
  location?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: ExperienceLevel;
  closingDate?: Date;
  createdById: string;
}

export interface UpdateJobInput {
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: ExperienceLevel;
  closingDate?: Date;
  isActive?: boolean;
  reParseTags?: boolean;
}

export interface JobFilters {
  search?: string;
  company?: string;
  isActive?: boolean;
  isRemote?: boolean;
  experienceLevel?: ExperienceLevel;
  skills?: string[];
  domains?: string[];
  minSalary?: number;
  maxSalary?: number;
  closingBefore?: Date;
  closingAfter?: Date;
  limit?: number;
  offset?: number;
  orderBy?: "createdAt" | "closingDate" | "salaryMax";
  orderDir?: "asc" | "desc";
}

export type JobWithTags = any; // Using any to avoid type conflicts with Prisma generated types

// ============================================
// VALIDATION
// ============================================

function validateCreateJobInput(input: CreateJobInput): string[] {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length === 0) {
    errors.push("Job title is required");
  } else if (input.title.length > 200) {
    errors.push("Job title must be 200 characters or less");
  }

  if (!input.company || input.company.trim().length === 0) {
    errors.push("Company name is required");
  } else if (input.company.length > 200) {
    errors.push("Company name must be 200 characters or less");
  }

  if (!input.description || input.description.trim().length === 0) {
    errors.push("Job description is required");
  } else if (input.description.length < 50) {
    errors.push("Job description must be at least 50 characters");
  } else if (input.description.length > 50000) {
    errors.push("Job description must be 50,000 characters or less");
  }

  if (!input.createdById || input.createdById.trim().length === 0) {
    errors.push("Creator ID is required");
  }

  // Salary validation
  if (input.salaryMin !== undefined && input.salaryMin < 0) {
    errors.push("Minimum salary cannot be negative");
  }

  if (input.salaryMax !== undefined && input.salaryMax < 0) {
    errors.push("Maximum salary cannot be negative");
  }

  if (
    input.salaryMin !== undefined &&
    input.salaryMax !== undefined &&
    input.salaryMin > input.salaryMax
  ) {
    errors.push("Minimum salary cannot be greater than maximum salary");
  }

  // Closing date validation
  if (input.closingDate !== undefined) {
    const closingDate = new Date(input.closingDate);
    if (isNaN(closingDate.getTime())) {
      errors.push("Invalid closing date");
    } else if (closingDate < new Date()) {
      errors.push("Closing date cannot be in the past");
    }
  }

  // Location validation
  if (input.location && input.location.length > 200) {
    errors.push("Location must be 200 characters or less");
  }

  return errors;
}

function validateUpdateJobInput(input: UpdateJobInput): string[] {
  const errors: string[] = [];

  if (input.title !== undefined) {
    if (input.title.trim().length === 0) {
      errors.push("Job title cannot be empty");
    } else if (input.title.length > 200) {
      errors.push("Job title must be 200 characters or less");
    }
  }

  if (input.company !== undefined) {
    if (input.company.trim().length === 0) {
      errors.push("Company name cannot be empty");
    } else if (input.company.length > 200) {
      errors.push("Company name must be 200 characters or less");
    }
  }

  if (input.description !== undefined) {
    if (input.description.trim().length === 0) {
      errors.push("Job description cannot be empty");
    } else if (input.description.length < 50) {
      errors.push("Job description must be at least 50 characters");
    } else if (input.description.length > 50000) {
      errors.push("Job description must be 50,000 characters or less");
    }
  }

  // Salary validation
  if (input.salaryMin !== undefined && input.salaryMin < 0) {
    errors.push("Minimum salary cannot be negative");
  }

  if (input.salaryMax !== undefined && input.salaryMax < 0) {
    errors.push("Maximum salary cannot be negative");
  }

  // Closing date validation
  if (input.closingDate !== undefined) {
    const closingDate = new Date(input.closingDate);
    if (isNaN(closingDate.getTime())) {
      errors.push("Invalid closing date");
    }
  }

  return errors;
}

// ============================================
// CREATE JOB
// ============================================

export async function createJob(input: CreateJobInput): Promise<JobWithTags> {
  // Validate input
  const validationErrors = validateCreateJobInput(input);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
  }

  // Verify creator exists and is active
  const creator = await prisma.user.findUnique({
    where: { id: input.createdById },
    select: { id: true, isActive: true, role: true },
  });

  if (!creator) {
    throw new Error("Creator not found");
  }

  if (!creator.isActive) {
    throw new Error("Creator account is not active");
  }

  // Only ADMIN and RECRUITER can create jobs
  if (creator.role !== "ADMIN" && creator.role !== "RECRUITER") {
    throw new Error("Only admins and recruiters can create jobs");
  }

  // Parse job description to extract tags (using AI with static fallback)
  const parsedTags = await parseJobDescriptionWithAI(input.title, input.description);
  console.log(`[JobService] Parsed job tags using ${parsedTags.source} parser`);

  // Determine experience level (use provided or parsed)
  const experienceLevel = input.experienceLevel ?? parsedTags.experienceLevel;

  // Create job with tags in a transaction
  const job = await prisma.$transaction(async (tx: any) => {
    const newJob = await tx.job.create({
      data: {
        title: input.title.trim(),
        company: input.company.trim(),
        description: input.description.trim(),
        location: input.location?.trim() ?? null,
        isRemote: input.isRemote ?? false,
        salaryMin: input.salaryMin ?? null,
        salaryMax: input.salaryMax ?? null,
        experienceLevel,
        closingDate: input.closingDate ?? null,
        createdById: input.createdById,
        isActive: true,
      },
    });

    // Create job tags
    await tx.jobTag.create({
      data: {
        jobId: newJob.id,
        skills: parsedTags.skills,
        domains: [parsedTags.domain], // Convert singular domain to array
        keywords: parsedTags.keywords,
        experienceLevel,
        seniorityTerms: parsedTags.seniorityIndicators, // Use seniorityIndicators from parser
        techStack: parsedTags.techStack,
        benefits: [], // Parser doesn't extract benefits, set empty array
        softSkills: parsedTags.softSkills,
        parserVersion: "v1",
        isManuallyEdited: false,
      },
    });

    return newJob;
  });

  // Return job with tags
  return getJobById(job.id) as Promise<JobWithTags>;
}

// ============================================
// GET JOB
// ============================================

export async function getJobById(jobId: string): Promise<JobWithTags | null> {
  if (!jobId || jobId.trim().length === 0) {
    throw new Error("Job ID is required");
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      jobTag: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: { referrals: true },
      },
    },
  });

  return job;
}

export async function getJobWithReferralCount(
  jobId: string
): Promise<(JobWithTags & { referralCount: number }) | null> {
  const job = await getJobById(jobId);
  if (!job) return null;

  const referralCount = await prisma.referral.count({
    where: { jobId },
  });

  return { ...job, referralCount };
}

// ============================================
// LIST JOBS
// ============================================

export async function listJobs(filters: JobFilters = {}): Promise<{
  jobs: JobWithTags[];
  total: number;
  pagination: { limit: number; offset: number; hasMore: boolean };
}> {
  const {
    search,
    company,
    isActive,
    isRemote,
    experienceLevel,
    skills,
    domains,
    minSalary,
    maxSalary,
    closingBefore,
    closingAfter,
    limit = 20,
    offset = 0,
    orderBy = "createdAt",
    orderDir = "desc",
  } = filters;

  // Validate and sanitize pagination
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const safeOffset = Math.max(0, offset);

  // Build where clause
  const where: any = {};

  // Text search
  if (search && search.trim().length > 0) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { company: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  // Company filter
  if (company && company.trim().length > 0) {
    where.company = { contains: company.trim(), mode: "insensitive" };
  }

  // Active filter
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // Remote filter
  if (isRemote !== undefined) {
    where.isRemote = isRemote;
  }

  // Experience level filter
  if (experienceLevel) {
    where.experienceLevel = experienceLevel;
  }

  // Salary filters
  if (minSalary !== undefined) {
    where.salaryMax = { gte: minSalary };
  }
  if (maxSalary !== undefined) {
    where.salaryMin = { lte: maxSalary };
  }

  // Closing date filters
  if (closingBefore || closingAfter) {
    where.closingDate = {};
    if (closingBefore) {
      where.closingDate.lte = closingBefore;
    }
    if (closingAfter) {
      where.closingDate.gte = closingAfter;
    }
  }

  // Skills filter (requires joining with JobTag)
  if (skills && skills.length > 0) {
    where.jobTag = {
      skills: { hasSome: skills },
    };
  }

  // Domains filter
  if (domains && domains.length > 0) {
    where.jobTag = {
      ...where.jobTag,
      domains: { hasSome: domains },
    };
  }

  // Build order by
  const orderByClause: any = {};
  orderByClause[orderBy] = orderDir;

  // Execute queries
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { jobTag: true },
      orderBy: orderByClause,
      take: safeLimit,
      skip: safeOffset,
    }),
    prisma.job.count({ where }),
  ]);

  // Generate AI summaries for jobs (in parallel)
  const jobsWithSummaries = await Promise.all(
    jobs.map(async (job) => {
      try {
        const aiSummary = await summarizeJobDescription(job.title, job.description);
        return { ...job, aiSummary };
      } catch (error) {
        console.error(`Failed to generate summary for job ${job.id}:`, error);
        return job; // Return job without summary on error
      }
    })
  );

  return {
    jobs: jobsWithSummaries,
    total,
    pagination: {
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + jobs.length < total,
    },
  };
}

// ============================================
// UPDATE JOB
// ============================================

export async function updateJob(
  jobId: string,
  input: UpdateJobInput,
  updatedById?: string
): Promise<JobWithTags> {
  if (!jobId || jobId.trim().length === 0) {
    throw new Error("Job ID is required");
  }

  // Validate input
  const validationErrors = validateUpdateJobInput(input);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
  }

  // Get existing job
  const existingJob = await prisma.job.findUnique({
    where: { id: jobId },
    include: { jobTag: true },
  });

  if (!existingJob) {
    throw new Error("Job not found");
  }

  // Check authorization if updatedById provided
  if (updatedById) {
    const updater = await prisma.user.findUnique({
      where: { id: updatedById },
      select: { role: true },
    });

    if (!updater) {
      throw new Error("Updater not found");
    }

    // Only admin, the creator, or recruiters can update
    if (
      updater.role !== "ADMIN" &&
      existingJob.createdById !== updatedById &&
      updater.role !== "RECRUITER"
    ) {
      throw new Error("Not authorized to update this job");
    }
  }

  const { reParseTags, ...updateData } = input;

  // If description changed and reParseTags is true, re-parse using AI
  let updatedTags: (ParsedJobTags & { source?: string }) | null = null;
  if (reParseTags && (input.description || input.title)) {
    const newTitle = input.title ?? existingJob.title;
    const newDescription = input.description ?? existingJob.description;
    updatedTags = await parseJobDescriptionWithAI(newTitle, newDescription);
    console.log(`[JobService] Re-parsed job tags using ${updatedTags.source} parser`);
  }

  // Update in transaction
  const job = await prisma.$transaction(async (tx: any) => {
    const updated = await tx.job.update({
      where: { id: jobId },
      data: {
        ...(updateData.title && { title: updateData.title.trim() }),
        ...(updateData.company && { company: updateData.company.trim() }),
        ...(updateData.description && {
          description: updateData.description.trim(),
        }),
        ...(updateData.location !== undefined && {
          location: updateData.location?.trim() ?? null,
        }),
        ...(updateData.isRemote !== undefined && {
          isRemote: updateData.isRemote,
        }),
        ...(updateData.salaryMin !== undefined && {
          salaryMin: updateData.salaryMin,
        }),
        ...(updateData.salaryMax !== undefined && {
          salaryMax: updateData.salaryMax,
        }),
        ...(updateData.experienceLevel && {
          experienceLevel: updateData.experienceLevel,
        }),
        ...(updateData.closingDate !== undefined && {
          closingDate: updateData.closingDate,
        }),
        ...(updateData.isActive !== undefined && {
          isActive: updateData.isActive,
        }),
      },
    });

    // Update tags if needed
    if (updatedTags && existingJob.jobTag) {
      await tx.jobTag.update({
        where: { id: existingJob.jobTag.id },
        data: {
          skills: updatedTags.skills,
          domains: [updatedTags.domain], // Convert singular domain to array
          keywords: updatedTags.keywords,
          experienceLevel:
            updateData.experienceLevel ?? updatedTags.experienceLevel,
          seniorityTerms: updatedTags.seniorityIndicators, // Use seniorityIndicators from parser
          techStack: updatedTags.techStack,
          benefits: [], // Parser doesn't extract benefits
          softSkills: updatedTags.softSkills,
          parsedAt: new Date(),
          isManuallyEdited: false,
        },
      });
    }

    return updated;
  });

  return getJobById(job.id) as Promise<JobWithTags>;
}

// ============================================
// UPDATE JOB TAGS (Manual editing)
// ============================================

export async function updateJobTags(
  jobId: string,
  tags: Partial<{
    skills: string[];
    domains: string[];
    keywords: string[];
    seniorityTerms: string[];
    techStack: string[];
    benefits: string[];
  }>
): Promise<JobTag> {
  if (!jobId || jobId.trim().length === 0) {
    throw new Error("Job ID is required");
  }

  const existingTag = await prisma.jobTag.findUnique({
    where: { jobId },
  });

  if (!existingTag) {
    throw new Error("Job tags not found");
  }

  return prisma.jobTag.update({
    where: { jobId },
    data: {
      ...(tags.skills && { skills: tags.skills }),
      ...(tags.domains && { domains: tags.domains }),
      ...(tags.keywords && { keywords: tags.keywords }),
      ...(tags.seniorityTerms && { seniorityTerms: tags.seniorityTerms }),
      ...(tags.techStack && { techStack: tags.techStack }),
      ...(tags.benefits && { benefits: tags.benefits }),
      isManuallyEdited: true,
    },
  }) as any;
}

// ============================================
// DELETE/DEACTIVATE JOB
// ============================================

export async function deactivateJob(
  jobId: string,
  userId: string
): Promise<JobWithTags> {
  return updateJob(jobId, { isActive: false }, userId);
}

export async function deleteJob(jobId: string, userId: string): Promise<void> {
  if (!jobId || jobId.trim().length === 0) {
    throw new Error("Job ID is required");
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { _count: { select: { referrals: true } } },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  // Check authorization
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "ADMIN" && job.createdById !== userId) {
    throw new Error("Not authorized to delete this job");
  }

  // Prevent deletion if there are referrals
  if (job._count.referrals > 0) {
    throw new Error(
      "Cannot delete job with existing referrals. Deactivate instead."
    );
  }

  // Delete in transaction (job tag will cascade delete)
  await prisma.job.delete({
    where: { id: jobId },
  });
}

// ============================================
// SPECIALIZED QUERIES
// ============================================

export async function getJobsClosingSoon(
  withinHours: number = 48
): Promise<JobWithTags[]> {
  const now = new Date();
  const deadline = new Date(now.getTime() + withinHours * 60 * 60 * 1000);

  return prisma.job.findMany({
    where: {
      isActive: true,
      closingDate: {
        gte: now,
        lte: deadline,
      },
    },
    include: { jobTag: true },
    orderBy: { closingDate: "asc" },
  });
}

export async function getActiveJobsByCompany(
  company: string
): Promise<JobWithTags[]> {
  if (!company || company.trim().length === 0) {
    throw new Error("Company name is required");
  }

  return prisma.job.findMany({
    where: {
      company: { contains: company.trim(), mode: "insensitive" },
      isActive: true,
    },
    include: { jobTag: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJobsBySkills(skills: string[]): Promise<JobWithTags[]> {
  if (!skills || skills.length === 0) {
    throw new Error("At least one skill is required");
  }

  return prisma.job.findMany({
    where: {
      isActive: true,
      jobTag: {
        skills: { hasSome: skills },
      },
    },
    include: { jobTag: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getJobStats(): Promise<{
  totalJobs: number;
  activeJobs: number;
  jobsByExperience: Record<ExperienceLevel, number>;
  topCompanies: { company: string; count: number }[];
  topSkills: { skill: string; count: number }[];
}> {
  const [totalJobs, activeJobs, jobsByExpRaw, topCompaniesRaw, allTags] =
    await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.job.groupBy({
        by: ["experienceLevel"],
        _count: { experienceLevel: true },
      }),
      prisma.job.groupBy({
        by: ["company"],
        where: { isActive: true },
        _count: { company: true },
        orderBy: { _count: { company: "desc" } },
        take: 10,
      }),
      prisma.jobTag.findMany({
        select: { skills: true },
      }),
    ]);

  // Transform experience level counts
  const jobsByExperience = jobsByExpRaw.reduce(
    (acc: any, item: any) => {
      acc[item.experienceLevel] = item._count.experienceLevel;
      return acc;
    },
    {} as Record<ExperienceLevel, number>
  );

  // Transform companies
  const topCompanies = topCompaniesRaw.map((item: any) => ({
    company: item.company,
    count: item._count.company,
  }));

  // Count skills across all jobs
  const skillCounts: Record<string, number> = {};
  for (const tag of allTags) {
    for (const skill of tag.skills) {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    }
  }

  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([skill, count]) => ({ skill, count }));

  return {
    totalJobs,
    activeJobs,
    jobsByExperience,
    topCompanies,
    topSkills,
  };
}