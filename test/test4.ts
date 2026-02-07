import { prisma } from "@/lib/prisma";
import { MemberProfile, ExperienceLevel, Prisma } from "@/lib/generated/prisma";
import { trackProfileUpdated } from "../events/event.service";

// ============================================
// TYPES
// ============================================

export interface CreateMemberProfileInput {
  userId: string;
  skills?: string[];
  pastCompanies?: string[];
  domains?: string[];
  experienceLevel?: ExperienceLevel;
  yearsOfExperience?: number;
  currentCompany?: string;
  currentTitle?: string;
  location?: string;
  preferredDomains?: string[];
  preferredRoles?: string[];
  isOpenToRefer?: boolean;
}

export interface UpdateMemberProfileInput {
  skills?: string[];
  pastCompanies?: string[];
  domains?: string[];
  experienceLevel?: ExperienceLevel;
  yearsOfExperience?: number;
  currentCompany?: string | null;
  currentTitle?: string | null;
  location?: string | null;
  preferredDomains?: string[];
  preferredRoles?: string[];
  isOpenToRefer?: boolean;
}

export interface MemberProfileFilters {
  skills?: string[];
  domains?: string[];
  experienceLevel?: ExperienceLevel;
  minYearsOfExperience?: number;
  maxYearsOfExperience?: number;
  location?: string;
  isOpenToRefer?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================
// VALIDATION
// ============================================

const VALID_EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "INTERN",
  "ENTRY",
  "MID",
  "SENIOR",
  "STAFF",
  "PRINCIPAL",
  "EXECUTIVE",
];

function validateCreateInput(input: CreateMemberProfileInput): string[] {
  const errors: string[] = [];

  if (!input.userId || input.userId.trim().length === 0) {
    errors.push("User ID is required");
  }

  // Validate experience level
  if (
    input.experienceLevel &&
    !VALID_EXPERIENCE_LEVELS.includes(input.experienceLevel)
  ) {
    errors.push("Invalid experience level");
  }

  // Validate years of experience
  if (input.yearsOfExperience !== undefined) {
    if (input.yearsOfExperience < 0) {
      errors.push("Years of experience cannot be negative");
    }
    if (input.yearsOfExperience > 60) {
      errors.push("Years of experience seems unrealistic");
    }
  }

  // Validate arrays have reasonable lengths
  if (input.skills && input.skills.length > 50) {
    errors.push("Skills list is too long (max 50)");
  }

  if (input.pastCompanies && input.pastCompanies.length > 30) {
    errors.push("Past companies list is too long (max 30)");
  }

  if (input.domains && input.domains.length > 20) {
    errors.push("Domains list is too long (max 20)");
  }

  // Validate string lengths
  if (input.currentCompany && input.currentCompany.length > 200) {
    errors.push("Current company name is too long (max 200)");
  }

  if (input.currentTitle && input.currentTitle.length > 200) {
    errors.push("Current title is too long (max 200)");
  }

  if (input.location && input.location.length > 200) {
    errors.push("Location is too long (max 200)");
  }

  return errors;
}

function validateUpdateInput(input: UpdateMemberProfileInput): string[] {
  const errors: string[] = [];

  // Validate experience level
  if (
    input.experienceLevel &&
    !VALID_EXPERIENCE_LEVELS.includes(input.experienceLevel)
  ) {
    errors.push("Invalid experience level");
  }

  // Validate years of experience
  if (input.yearsOfExperience !== undefined) {
    if (input.yearsOfExperience < 0) {
      errors.push("Years of experience cannot be negative");
    }
    if (input.yearsOfExperience > 60) {
      errors.push("Years of experience seems unrealistic");
    }
  }

  // Validate arrays have reasonable lengths
  if (input.skills && input.skills.length > 50) {
    errors.push("Skills list is too long (max 50)");
  }

  if (input.pastCompanies && input.pastCompanies.length > 30) {
    errors.push("Past companies list is too long (max 30)");
  }

  if (input.domains && input.domains.length > 20) {
    errors.push("Domains list is too long (max 20)");
  }

  // Validate string lengths
  if (
    input.currentCompany !== null &&
    input.currentCompany &&
    input.currentCompany.length > 200
  ) {
    errors.push("Current company name is too long (max 200)");
  }

  if (
    input.currentTitle !== null &&
    input.currentTitle &&
    input.currentTitle.length > 200
  ) {
    errors.push("Current title is too long (max 200)");
  }

  if (
    input.location !== null &&
    input.location &&
    input.location.length > 200
  ) {
    errors.push("Location is too long (max 200)");
  }

  return errors;
}

// Sanitize arrays (remove empty strings, trim, dedupe)
function sanitizeStringArray(arr?: string[]): string[] {
  if (!arr || !Array.isArray(arr)) return [];

  return [
    ...new Set(
      arr
        .filter((item) => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim().toLowerCase())
    ),
  ];
}

// ============================================
// CREATE MEMBER PROFILE
// ============================================

export async function createMemberProfile(
  input: CreateMemberProfileInput
): Promise<MemberProfile> {
  // Validate input
  const validationErrors = validateCreateInput(input);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
  }

  // Verify user exists and is active
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, isActive: true, role: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isActive) {
    throw new Error("User account is not active");
  }

  // Only MEMBER role should have member profiles
  if (user.role !== "MEMBER") {
    throw new Error("Only members can have member profiles");
  }

  // Check if profile already exists
  const existingProfile = await prisma.memberProfile.findUnique({
    where: { userId: input.userId },
  });

  if (existingProfile) {
    throw new Error("Member profile already exists for this user");
  }

  // Create profile
  const profile = await prisma.memberProfile.create({
    data: {
      userId: input.userId,
      skills: sanitizeStringArray(input.skills),
      pastCompanies: sanitizeStringArray(input.pastCompanies),
      domains: sanitizeStringArray(input.domains),
      experienceLevel: input.experienceLevel ?? "MID",
      yearsOfExperience: input.yearsOfExperience ?? 0,
      currentCompany: input.currentCompany?.trim() ?? null,
      currentTitle: input.currentTitle?.trim() ?? null,
      location: input.location?.trim() ?? null,
      preferredDomains: sanitizeStringArray(input.preferredDomains),
      preferredRoles: sanitizeStringArray(input.preferredRoles),
      isOpenToRefer: input.isOpenToRefer ?? true,
    },
  });

  return profile;
}

// ============================================
// GET MEMBER PROFILE
// ============================================

export async function getMemberProfileByUserId(
  userId: string
): Promise<MemberProfile | null> {
  if (!userId || userId.trim().length === 0) {
    throw new Error("User ID is required");
  }

  return prisma.memberProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });
}

export async function getMemberProfileById(
  profileId: string
): Promise<MemberProfile | null> {
  if (!profileId || profileId.trim().length === 0) {
    throw new Error("Profile ID is required");
  }

  return prisma.memberProfile.findUnique({
    where: { id: profileId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });
}

// ============================================
// UPDATE MEMBER PROFILE
// ============================================

export async function updateMemberProfile(
  userId: string,
  input: UpdateMemberProfileInput
): Promise<MemberProfile> {
  if (!userId || userId.trim().length === 0) {
    throw new Error("User ID is required");
  }

  // Validate input
  const validationErrors = validateUpdateInput(input);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
  }

  // Get existing profile
  const existingProfile = await prisma.memberProfile.findUnique({
    where: { userId },
  });

  if (!existingProfile) {
    throw new Error("Member profile not found");
  }

  // Track which fields are being updated
  const updatedFields: string[] = [];

  // Build update data
  const updateData: Prisma.MemberProfileUpdateInput = {};

  if (input.skills !== undefined) {
    updateData.skills = sanitizeStringArray(input.skills);
    updatedFields.push("skills");
  }

  if (input.pastCompanies !== undefined) {
    updateData.pastCompanies = sanitizeStringArray(input.pastCompanies);
    updatedFields.push("pastCompanies");
  }

  if (input.domains !== undefined) {
    updateData.domains = sanitizeStringArray(input.domains);
    updatedFields.push("domains");
  }

  if (input.experienceLevel !== undefined) {
    updateData.experienceLevel = input.experienceLevel;
    updatedFields.push("experienceLevel");
  }

  if (input.yearsOfExperience !== undefined) {
    updateData.yearsOfExperience = input.yearsOfExperience;
    updatedFields.push("yearsOfExperience");
  }

  if (input.currentCompany !== undefined) {
    updateData.currentCompany = input.currentCompany?.trim() ?? null;
    updatedFields.push("currentCompany");
  }

  if (input.currentTitle !== undefined) {
    updateData.currentTitle = input.currentTitle?.trim() ?? null;
    updatedFields.push("currentTitle");
  }

  if (input.location !== undefined) {
    updateData.location = input.location?.trim() ?? null;
    updatedFields.push("location");
  }

  if (input.preferredDomains !== undefined) {
    updateData.preferredDomains = sanitizeStringArray(input.preferredDomains);
    updatedFields.push("preferredDomains");
  }

  if (input.preferredRoles !== undefined) {
    updateData.preferredRoles = sanitizeStringArray(input.preferredRoles);
    updatedFields.push("preferredRoles");
  }

  if (input.isOpenToRefer !== undefined) {
    updateData.isOpenToRefer = input.isOpenToRefer;
    updatedFields.push("isOpenToRefer");
  }

  // Update profile
  const profile = await prisma.memberProfile.update({
    where: { userId },
    data: updateData,
  });

  // Track event
  if (updatedFields.length > 0) {
    await trackProfileUpdated(userId, updatedFields);
  }

  return profile;
}

// ============================================
// UPSERT MEMBER PROFILE
// ============================================

export async function upsertMemberProfile(
  input: CreateMemberProfileInput
): Promise<MemberProfile> {
  const existingProfile = await prisma.memberProfile.findUnique({
    where: { userId: input.userId },
  });

  if (existingProfile) {
    return updateMemberProfile(input.userId, {
      skills: input.skills,
      pastCompanies: input.pastCompanies,
      domains: input.domains,
      experienceLevel: input.experienceLevel,
      yearsOfExperience: input.yearsOfExperience,
      currentCompany: input.currentCompany,
      currentTitle: input.currentTitle,
      location: input.location,
      preferredDomains: input.preferredDomains,
      preferredRoles: input.preferredRoles,
      isOpenToRefer: input.isOpenToRefer,
    });
  }

  return createMemberProfile(input);
}

// ============================================
// LIST MEMBER PROFILES
// ============================================

export async function listMemberProfiles(
  filters: MemberProfileFilters = {}
): Promise<{
  profiles: MemberProfile[];
  total: number;
  pagination: { limit: number; offset: number; hasMore: boolean };
}> {
  const {
    skills,
    domains,
    experienceLevel,
    minYearsOfExperience,
    maxYearsOfExperience,
    location,
    isOpenToRefer,
    limit = 20,
    offset = 0,
  } = filters;

  // Validate and sanitize pagination
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const safeOffset = Math.max(0, offset);

  // Build where clause
  const where: Prisma.MemberProfileWhereInput = {};

  // Only show profiles of active users
  where.user = { isActive: true };

  if (skills && skills.length > 0) {
    where.skills = { hasSome: sanitizeStringArray(skills) };
  }

  if (domains && domains.length > 0) {
    where.domains = { hasSome: sanitizeStringArray(domains) };
  }

  if (experienceLevel) {
    where.experienceLevel = experienceLevel;
  }

  if (minYearsOfExperience !== undefined || maxYearsOfExperience !== undefined) {
    where.yearsOfExperience = {};
    if (minYearsOfExperience !== undefined) {
      where.yearsOfExperience.gte = minYearsOfExperience;
    }
    if (maxYearsOfExperience !== undefined) {
      where.yearsOfExperience.lte = maxYearsOfExperience;
    }
  }

  if (location) {
    where.location = { contains: location.trim(), mode: "insensitive" };
  }

  if (isOpenToRefer !== undefined) {
    where.isOpenToRefer = isOpenToRefer;
  }

  // Execute queries
  const [profiles, total] = await Promise.all([
    prisma.memberProfile.findMany({
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
      orderBy: { updatedAt: "desc" },
      take: safeLimit,
      skip: safeOffset,
    }),
    prisma.memberProfile.count({ where }),
  ]);

  return {
    profiles,
    total,
    pagination: {
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + profiles.length < total,
    },
  };
}

// ============================================
// FIND MATCHING PROFILES FOR JOB
// ============================================

export async function findProfilesMatchingJob(jobId: string): Promise<{
  profiles: MemberProfile[];
  matchScores: Map<string, number>;
}> {
  if (!jobId || jobId.trim().length === 0) {
    throw new Error("Job ID is required");
  }

  // Get job with tags
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { jobTag: true },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (!job.jobTag) {
    throw new Error("Job tags not found");
  }

  // Find profiles that match job criteria
  const profiles = await prisma.memberProfile.findMany({
    where: {
      isOpenToRefer: true,
      user: { isActive: true },
      OR: [
        { skills: { hasSome: job.jobTag.skills } },
        { domains: { hasSome: job.jobTag.domains } },
        { preferredDomains: { hasSome: job.jobTag.domains } },
      ],
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
    take: 100,
  });

  // Calculate match scores
  const matchScores = new Map<string, number>();

  for (const profile of profiles) {
    let score = 0;

    // Skill overlap (weighted heavily)
    const skillOverlap = profile.skills.filter((s) =>
      job.jobTag!.skills.includes(s)
    ).length;
    score += skillOverlap * 3;

    // Domain match
    const domainOverlap = profile.domains.filter((d) =>
      job.jobTag!.domains.includes(d)
    ).length;
    score += domainOverlap * 2;

    // Preferred domain match
    const preferredDomainOverlap = profile.preferredDomains.filter((d) =>
      job.jobTag!.domains.includes(d)
    ).length;
    score += preferredDomainOverlap;

    // Experience level proximity
    const expLevels: ExperienceLevel[] = [
      "INTERN",
      "ENTRY",
      "MID",
      "SENIOR",
      "STAFF",
      "PRINCIPAL",
      "EXECUTIVE",
    ];
    const jobExpIndex = expLevels.indexOf(job.experienceLevel);
    const profileExpIndex = expLevels.indexOf(profile.experienceLevel);
    const expDiff = Math.abs(jobExpIndex - profileExpIndex);
    score += Math.max(0, 3 - expDiff);

    matchScores.set(profile.id, score);
  }

  // Sort by score
  profiles.sort((a, b) => {
    const scoreA = matchScores.get(a.id) ?? 0;
    const scoreB = matchScores.get(b.id) ?? 0;
    return scoreB - scoreA;
  });

  return { profiles, matchScores };
}

// ============================================
// STALE PROFILE DETECTION (for cron)
// ============================================

export async function getStaleProfiles(
  olderThanDays: number = 30
): Promise<MemberProfile[]> {
  if (olderThanDays < 1) {
    throw new Error("Days must be at least 1");
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  return prisma.memberProfile.findMany({
    where: {
      updatedAt: { lt: cutoff },
      user: { isActive: true },
    },
    orderBy: { updatedAt: "asc" },
    take: 100,
  });
}

export async function touchMemberProfile(userId: string): Promise<void> {
  if (!userId || userId.trim().length === 0) {
    throw new Error("User ID is required");
  }

  await prisma.memberProfile.update({
    where: { userId },
    data: { updatedAt: new Date() },
  });
}

// ============================================
// STATISTICS
// ============================================

export async function getMemberProfileStats(): Promise<{
  totalProfiles: number;
  openToRefer: number;
  byExperienceLevel: Record<ExperienceLevel, number>;
  topSkills: { skill: string; count: number }[];
  topDomains: { domain: string; count: number }[];
}> {
  const [totalProfiles, openToRefer, byExpRaw, allProfiles] = await Promise.all([
    prisma.memberProfile.count(),
    prisma.memberProfile.count({ where: { isOpenToRefer: true } }),
    prisma.memberProfile.groupBy({
      by: ["experienceLevel"],
      _count: { experienceLevel: true },
    }),
    prisma.memberProfile.findMany({
      select: { skills: true, domains: true },
    }),
  ]);

  // Transform experience level counts
  const byExperienceLevel = byExpRaw.reduce(
    (acc, item) => {
      acc[item.experienceLevel] = item._count.experienceLevel;
      return acc;
    },
    {} as Record<ExperienceLevel, number>
  );

  // Count skills
  const skillCounts: Record<string, number> = {};
  const domainCounts: Record<string, number> = {};

  for (const profile of allProfiles) {
    for (const skill of profile.skills) {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    }
    for (const domain of profile.domains) {
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    }
  }

  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([skill, count]) => ({ skill, count }));

  const topDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([domain, count]) => ({ domain, count }));

  return {
    totalProfiles,
    openToRefer,
    byExperienceLevel,
    topSkills,
    topDomains,
  };
}