import { MemberProfile, Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
 export type ExperienceLevel = "INTERN" | "ENTRY" | "MID" | "SENIOR" | "STAFF" | "PRINCIPAL" | "EXECUTIVE";


// ============================================
// TYPES
// ============================================

export interface MemberProfileInput {
  skills?: string[];
  domains?: string[];
  pastCompanies?: string[];
  experienceLevel?: ExperienceLevel;
  yearsOfExperience?: number;
  preferences?: Record<string, any>;
  isOpenToRefer?: boolean;
}

export interface MemberProfileResponse extends MemberProfile {}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize and deduplicate string arrays
 * - Trims whitespace
 * - Converts to lowercase for consistency
 * - Removes empty strings
 * - Removes duplicates
 */
function normalizeStringArray(arr: string[] | undefined | null): string[] {
  if (!arr) return [];
  return Array.from(new Set(arr.map((item) => item.trim().toLowerCase()).filter(Boolean)));
}

/**
 * Validate experience level
 */
function isValidExperienceLevel(level: string | undefined): level is ExperienceLevel {
  const validLevels: ExperienceLevel[] = [
    "INTERN",
    "ENTRY",
    "MID",
    "SENIOR",
    "STAFF",
    "PRINCIPAL",
    "EXECUTIVE",
  ];
  return validLevels.includes(level as ExperienceLevel);
}

/**
 * Sanitize and validate member profile input
 */
function sanitizeProfileInput(data: MemberProfileInput): MemberProfileInput {
  return {
    skills: normalizeStringArray(data.skills),
    domains: normalizeStringArray(data.domains),
    pastCompanies: normalizeStringArray(data.pastCompanies),
    experienceLevel: isValidExperienceLevel(data.experienceLevel)
      ? data.experienceLevel
      : "MID",
    yearsOfExperience: data.yearsOfExperience ?? 0,
    preferences: data.preferences ?? {},
    isOpenToRefer: data.isOpenToRefer ?? true,
  };
}

// ============================================
// MEMBER PROFILE CRUD OPERATIONS
// ============================================

/**
 * Get member profile by user ID
 * Returns null if not found
 */
export async function getMemberProfileByUserId(
  userId: string
): Promise<MemberProfileResponse | null> {
  return prisma.memberProfile.findUnique({
    where: { userId },
  });
}

/**
 * Create a new member profile
 * Throws error if profile already exists for user
 */
export async function createMemberProfile(
  userId: string,
  data: MemberProfileInput
): Promise<MemberProfileResponse> {
  const sanitizedData = sanitizeProfileInput(data);

  return prisma.memberProfile.create({
    data: {
      userId,
      ...sanitizedData,
    },
  });
}

/**
 * Update an existing member profile
 * Only updates fields that are provided
 */
export async function updateMemberProfile(
  userId: string,
  data: MemberProfileInput
): Promise<MemberProfileResponse> {
  const sanitizedData = sanitizeProfileInput(data);

  return prisma.memberProfile.update({
    where: { userId },
    data: sanitizedData,
  });
}

/**
 * Upsert member profile - create if not exists, update if exists
 * Idempotent operation
 */
export async function upsertMemberProfile(
  userId: string,
  data: MemberProfileInput
): Promise<MemberProfileResponse> {
  const sanitizedData = sanitizeProfileInput(data);

  return prisma.memberProfile.upsert({
    where: { userId },
    update: sanitizedData,
    create: {
      userId,
      ...sanitizedData,
    },
  });
}

/**
 * Delete member profile
 */
export async function deleteMemberProfile(userId: string): Promise<void> {
  await prisma.memberProfile.delete({
    where: { userId },
  });
}

// ============================================
// QUERY OPERATIONS
// ============================================

/**
 * Find members by skills (for nudge matching)
 * Returns members who have at least one matching skill
 */
export async function findMembersBySkills(
  skills: string[],
  options?: {
    excludeUserIds?: string[];
    limit?: number;
    onlyOpenToReferrals?: boolean;
  }
): Promise<MemberProfileResponse[]> {
  const where: Prisma.MemberProfileWhereInput = {
    skills: { hasSome: normalizeStringArray(skills) },
    userId: options?.excludeUserIds ? { notIn: options.excludeUserIds } : undefined,
    isOpenToRefer: options?.onlyOpenToReferrals ?? undefined,
  };

  return prisma.memberProfile.findMany({
    where,
    take: options?.limit ?? 50,
  });
}

/**
 * Find members by domain
 */
export async function findMembersByDomain(
  domains: string[],
  options?: {
    excludeUserIds?: string[];
    limit?: number;
    onlyOpenToReferrals?: boolean;
  }
): Promise<MemberProfileResponse[]> {
  const where: Prisma.MemberProfileWhereInput = {
    domains: { hasSome: normalizeStringArray(domains) },
    userId: options?.excludeUserIds ? { notIn: options.excludeUserIds } : undefined,
    isOpenToRefer: options?.onlyOpenToReferrals ?? undefined,
  };

  return prisma.memberProfile.findMany({
    where,
    take: options?.limit ?? 50,
  });
}

/**
 * Get all member profiles (paginated)
 */
export async function getAllMemberProfiles(options?: {
  page?: number;
  limit?: number;
  onlyOpenToReferrals?: boolean;
}): Promise<{
  profiles: MemberProfileResponse[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;

  const where: Prisma.MemberProfileWhereInput = {
    ...(options?.onlyOpenToReferrals && { isOpenToRefer: true }),
  };

  const [profiles, total] = await Promise.all([
    prisma.memberProfile.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.memberProfile.count({ where }),
  ]);

  return {
    profiles,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get stale profiles (not updated in X days)
 * Used for cron job refresh
 */
export async function getStaleProfiles(
  daysOld: number = 30,
  limit: number = 100
): Promise<MemberProfileResponse[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return prisma.memberProfile.findMany({
    where: {
      updatedAt: { lt: cutoffDate },
    },
    take: limit,
  });
}

/**
 * Touch profile to update timestamp (for refresh cron)
 * Idempotent operation
 */
export async function touchMemberProfile(userId: string): Promise<void> {
  await prisma.memberProfile.update({
    where: { userId },
    data: { updatedAt: new Date() },
  });
}

/**
 * Bulk touch profiles (for cron efficiency)
 */
export async function bulkTouchMemberProfiles(userIds: string[]): Promise<number> {
  const result = await prisma.memberProfile.updateMany({
    where: { userId: { in: userIds } },
    data: { updatedAt: new Date() },
  });

  return result.count;
}

// ============================================
// SKILL MANAGEMENT
// ============================================

/**
 * Add skills to a member profile
 */
export async function addSkillsToProfile(
  userId: string,
  skills: string[]
): Promise<MemberProfileResponse> {
  const profile = await getMemberProfileByUserId(userId);
  if (!profile) {
    throw new Error("Member profile not found");
  }

  const updatedSkills = Array.from(new Set([...profile.skills, ...normalizeStringArray(skills)]));

  return prisma.memberProfile.update({
    where: { userId },
    data: { skills: updatedSkills },
  });
}

/**
 * Remove skills from a member profile
 */
export async function removeSkillsFromProfile(
  userId: string,
  skills: string[]
): Promise<MemberProfileResponse> {
  const profile = await getMemberProfileByUserId(userId);
  if (!profile) {
    throw new Error("Member profile not found");
  }

  const updatedSkills = profile.skills.filter(
    (skill: string) => !normalizeStringArray(skills).includes(skill)
  );

  return prisma.memberProfile.update({
    where: { userId },
    data: { skills: updatedSkills },
  });
}