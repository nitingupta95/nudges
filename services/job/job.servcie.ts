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
  currentCompany?: string | null;
  currentTitle?: string | null;
  location?: string | null;
  preferredJobTypes?: string[];
  preferredLocations?: string[];
  isOpenToReferrals?: boolean;
  linkedinUrl?: string | null;
  bio?: string | null;
}

export interface MemberProfileResponse {
  id: string;
  userId: string;
  skills: string[];
  pastCompanies: string[];
  domains: string[];
  experienceLevel: ExperienceLevel;
  yearsOfExperience: number;
  currentCompany: string | null;
  currentTitle: string | null;
  location: string | null;
  preferredJobTypes: string[];
  preferredLocations: string[];
  isOpenToReferrals: boolean;
  linkedinUrl: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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
  if (!arr || !Array.isArray(arr)) return [];
  
  const normalized = arr
    .map((s) => s?.trim()?.toLowerCase())
    .filter((s): s is string => Boolean(s) && s.length > 0);
  
  return [...new Set(normalized)];
}

/**
 * Validate experience level
 */
function isValidExperienceLevel(level: string | undefined): level is ExperienceLevel {
  if (!level) return false;
  const validLevels: ExperienceLevel[] = [
    'INTERN', 'ENTRY', 'MID', 'SENIOR', 'STAFF', 'PRINCIPAL', 'EXECUTIVE'
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
    preferredJobTypes: normalizeStringArray(data.preferredJobTypes),
    preferredLocations: normalizeStringArray(data.preferredLocations),
    experienceLevel: isValidExperienceLevel(data.experienceLevel) 
      ? data.experienceLevel 
      : undefined,
    yearsOfExperience: typeof data.yearsOfExperience === 'number' && data.yearsOfExperience >= 0
      ? Math.floor(data.yearsOfExperience)
      : undefined,
    currentCompany: data.currentCompany?.trim() || null,
    currentTitle: data.currentTitle?.trim() || null,
    location: data.location?.trim() || null,
    linkedinUrl: data.linkedinUrl?.trim() || null,
    bio: data.bio?.trim()?.substring(0, 1000) || null, // Limit bio to 1000 chars
    isOpenToReferrals: typeof data.isOpenToReferrals === 'boolean' 
      ? data.isOpenToReferrals 
      : undefined,
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
  if (!userId?.trim()) {
    throw new Error("User ID is required");
  }

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: userId.trim() },
  });

  return profile;
}

/**
 * Get member profile with user info
 */
export async function getMemberProfileWithUser(userId: string) {
  if (!userId?.trim()) {
    throw new Error("User ID is required");
  }

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: userId.trim() },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
  });

  return profile;
}

/**
 * Create a new member profile
 * Throws error if profile already exists for user
 */
export async function createMemberProfile(
  userId: string,
  data: MemberProfileInput
): Promise<MemberProfileResponse> {
  if (!userId?.trim()) {
    throw new Error("User ID is required");
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId.trim() },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if profile already exists
  const existingProfile = await prisma.memberProfile.findUnique({
    where: { userId: userId.trim() },
  });

  if (existingProfile) {
    throw new Error("Member profile already exists for this user");
  }

  const sanitizedData = sanitizeProfileInput(data);

  const profile = await prisma.memberProfile.create({
    data: {
      userId: userId.trim(),
      skills: sanitizedData.skills || [],
      domains: sanitizedData.domains || [],
      pastCompanies: sanitizedData.pastCompanies || [],
      preferredJobTypes: sanitizedData.preferredJobTypes || [],
      preferredLocations: sanitizedData.preferredLocations || [],
      experienceLevel: sanitizedData.experienceLevel || 'MID',
      yearsOfExperience: sanitizedData.yearsOfExperience || 0,
      currentCompany: sanitizedData.currentCompany,
      currentTitle: sanitizedData.currentTitle,
      location: sanitizedData.location,
      linkedinUrl: sanitizedData.linkedinUrl,
      bio: sanitizedData.bio,
      isOpenToReferrals: sanitizedData.isOpenToReferrals ?? true,
    },
  });

  return profile;
}

/**
 * Update an existing member profile
 * Only updates fields that are provided
 */
export async function updateMemberProfile(
  userId: string,
  data: MemberProfileInput
): Promise<MemberProfileResponse> {
  if (!userId?.trim()) {
    throw new Error("User ID is required");
  }

  // Check if profile exists
  const existingProfile = await prisma.memberProfile.findUnique({
    where: { userId: userId.trim() },
  });

  if (!existingProfile) {
    throw new Error("Member profile not found");
  }

  const sanitizedData = sanitizeProfileInput(data);

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};

  if (sanitizedData.skills !== undefined) {
    updateData.skills = sanitizedData.skills;
  }
  if (sanitizedData.domains !== undefined) {
    updateData.domains = sanitizedData.domains;
  }
  if (sanitizedData.pastCompanies !== undefined) {
    updateData.pastCompanies = sanitizedData.pastCompanies;
  }
  if (sanitizedData.preferredJobTypes !== undefined) {
    updateData.preferredJobTypes = sanitizedData.preferredJobTypes;
  }
  if (sanitizedData.preferredLocations !== undefined) {
    updateData.preferredLocations = sanitizedData.preferredLocations;
  }
  if (sanitizedData.experienceLevel !== undefined) {
    updateData.experienceLevel = sanitizedData.experienceLevel;
  }
  if (sanitizedData.yearsOfExperience !== undefined) {
    updateData.yearsOfExperience = sanitizedData.yearsOfExperience;
  }
  if (data.currentCompany !== undefined) {
    updateData.currentCompany = sanitizedData.currentCompany;
  }
  if (data.currentTitle !== undefined) {
    updateData.currentTitle = sanitizedData.currentTitle;
  }
  if (data.location !== undefined) {
    updateData.location = sanitizedData.location;
  }
  if (data.linkedinUrl !== undefined) {
    updateData.linkedinUrl = sanitizedData.linkedinUrl;
  }
  if (data.bio !== undefined) {
    updateData.bio = sanitizedData.bio;
  }
  if (sanitizedData.isOpenToReferrals !== undefined) {
    updateData.isOpenToReferrals = sanitizedData.isOpenToReferrals;
  }

  const profile = await prisma.memberProfile.update({
    where: { userId: userId.trim() },
    data: updateData,
  });

  return profile;
}

/**
 * Upsert member profile - create if not exists, update if exists
 * Idempotent operation
 */
export async function upsertMemberProfile(
  userId: string,
  data: MemberProfileInput
): Promise<MemberProfileResponse> {
  if (!userId?.trim()) {
    throw new Error("User ID is required");
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId.trim() },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const sanitizedData = sanitizeProfileInput(data);

  const profile = await prisma.memberProfile.upsert({
    where: { userId: userId.trim() },
    update: {
      ...(sanitizedData.skills && { skills: sanitizedData.skills }),
      ...(sanitizedData.domains && { domains: sanitizedData.domains }),
      ...(sanitizedData.pastCompanies && { pastCompanies: sanitizedData.pastCompanies }),
      ...(sanitizedData.preferredJobTypes && { preferredJobTypes: sanitizedData.preferredJobTypes }),
      ...(sanitizedData.preferredLocations && { preferredLocations: sanitizedData.preferredLocations }),
      ...(sanitizedData.experienceLevel && { experienceLevel: sanitizedData.experienceLevel }),
      ...(sanitizedData.yearsOfExperience !== undefined && { yearsOfExperience: sanitizedData.yearsOfExperience }),
      ...(data.currentCompany !== undefined && { currentCompany: sanitizedData.currentCompany }),
      ...(data.currentTitle !== undefined && { currentTitle: sanitizedData.currentTitle }),
      ...(data.location !== undefined && { location: sanitizedData.location }),
      ...(data.linkedinUrl !== undefined && { linkedinUrl: sanitizedData.linkedinUrl }),
      ...(data.bio !== undefined && { bio: sanitizedData.bio }),
      ...(sanitizedData.isOpenToReferrals !== undefined && { isOpenToReferrals: sanitizedData.isOpenToReferrals }),
    },
    create: {
      userId: userId.trim(),
      skills: sanitizedData.skills || [],
      domains: sanitizedData.domains || [],
      pastCompanies: sanitizedData.pastCompanies || [],
      preferredJobTypes: sanitizedData.preferredJobTypes || [],
      preferredLocations: sanitizedData.preferredLocations || [],
      experienceLevel: sanitizedData.experienceLevel || 'MID',
      yearsOfExperience: sanitizedData.yearsOfExperience || 0,
      currentCompany: sanitizedData.currentCompany,
      currentTitle: sanitizedData.currentTitle,
      location: sanitizedData.location,
      linkedinUrl: sanitizedData.linkedinUrl,
      bio: sanitizedData.bio,
      isOpenToReferrals: sanitizedData.isOpenToReferrals ?? true,
    },
  });

  return profile;
}

/**
 * Delete member profile
 */
export async function deleteMemberProfile(userId: string): Promise<void> {
  if (!userId?.trim()) {
    throw new Error("User ID is required");
  }

  const existingProfile = await prisma.memberProfile.findUnique({
    where: { userId: userId.trim() },
  });

  if (!existingProfile) {
    throw new Error("Member profile not found");
  }

  await prisma.memberProfile.delete({
    where: { userId: userId.trim() },
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
  const normalizedSkills = normalizeStringArray(skills);
  
  if (normalizedSkills.length === 0) {
    return [];
  }

  const members = await prisma.memberProfile.findMany({
    where: {
      skills: {
        hasSome: normalizedSkills,
      },
      ...(options?.excludeUserIds?.length && {
        userId: {
          notIn: options.excludeUserIds,
        },
      }),
      ...(options?.onlyOpenToReferrals && {
        isOpenToReferrals: true,
      }),
    },
    take: options?.limit || 100,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return members;
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
  const normalizedDomains = normalizeStringArray(domains);
  
  if (normalizedDomains.length === 0) {
    return [];
  }

  const members = await prisma.memberProfile.findMany({
    where: {
      domains: {
        hasSome: normalizedDomains,
      },
      ...(options?.excludeUserIds?.length && {
        userId: {
          notIn: options.excludeUserIds,
        },
      }),
      ...(options?.onlyOpenToReferrals && {
        isOpenToReferrals: true,
      }),
    },
    take: options?.limit || 100,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return members;
}

/**
 * Find members by past companies
 */
export async function findMembersByPastCompanies(
  companies: string[],
  options?: {
    excludeUserIds?: string[];
    limit?: number;
  }
): Promise<MemberProfileResponse[]> {
  const normalizedCompanies = normalizeStringArray(companies);
  
  if (normalizedCompanies.length === 0) {
    return [];
  }

  const members = await prisma.memberProfile.findMany({
    where: {
      pastCompanies: {
        hasSome: normalizedCompanies,
      },
      ...(options?.excludeUserIds?.length && {
        userId: {
          notIn: options.excludeUserIds,
        },
      }),
    },
    take: options?.limit || 100,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return members;
}

/**
 * Find members by experience level range
 */
export async function findMembersByExperienceLevel(
  levels: ExperienceLevel[],
  options?: {
    excludeUserIds?: string[];
    limit?: number;
    onlyOpenToReferrals?: boolean;
  }
): Promise<MemberProfileResponse[]> {
  if (!levels || levels.length === 0) {
    return [];
  }

  const members = await prisma.memberProfile.findMany({
    where: {
      experienceLevel: {
        in: levels,
      },
      ...(options?.excludeUserIds?.length && {
        userId: {
          notIn: options.excludeUserIds,
        },
      }),
      ...(options?.onlyOpenToReferrals && {
        isOpenToReferrals: true,
      }),
    },
    take: options?.limit || 100,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return members;
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
  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 20));
  const skip = (page - 1) * limit;

  const whereClause = options?.onlyOpenToReferrals 
    ? { isOpenToReferrals: true } 
    : {};

  const [profiles, total] = await Promise.all([
    prisma.memberProfile.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.memberProfile.count({ where: whereClause }),
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

  const profiles = await prisma.memberProfile.findMany({
    where: {
      updatedAt: {
        lt: cutoffDate,
      },
    },
    take: limit,
    orderBy: {
      updatedAt: 'asc',
    },
  });

  return profiles;
}

/**
 * Touch profile to update timestamp (for refresh cron)
 * Idempotent operation
 */
export async function touchMemberProfile(userId: string): Promise<void> {
  if (!userId?.trim()) {
    return;
  }

  await prisma.memberProfile.updateMany({
    where: { userId: userId.trim() },
    data: { updatedAt: new Date() },
  });
}

/**
 * Bulk touch profiles (for cron efficiency)
 */
export async function bulkTouchMemberProfiles(userIds: string[]): Promise<number> {
  if (!userIds || userIds.length === 0) {
    return 0;
  }

  const validIds = userIds.filter((id) => id?.trim());
  
  if (validIds.length === 0) {
    return 0;
  }

  const result = await prisma.memberProfile.updateMany({
    where: {
      userId: {
        in: validIds,
      },
    },
    data: {
      updatedAt: new Date(),
    },
  });

  return result.count;
}

// ============================================
// SKILL MANAGEMENT
// ============================================

/**
 * Add skills to a member profile
 * Prevents duplicates
 */
export async function addSkillsToProfile(
  userId: string,
  skills: string[]
): Promise<MemberProfileResponse> {
  if (!userId?.trim()) {
    throw new Error("User ID is required");
  }

  const normalizedSkills = normalizeStringArray(skills);
  
  if (normalizedSkills.length === 0) {
    const existing = await getMemberProfileByUserId(userId);
    if (!existing) throw new Error("Member profile not found");
    return existing;
  }

  const existing = await prisma.memberProfile.findUnique({
    where: { userId: userId.trim() },
  });

  if (!existing) {
    throw new Error("Member profile not found");
  }

  const combinedSkills = [...new Set([...existing.skills, ...normalizedSkills])];

  const updated = await prisma.memberProfile.update({
    where: { userId: userId.trim() },
    data: { skills: combinedSkills },
  });

  return updated;
}

/**
 * Remove skills from a member profile
 */
export async function removeSkillsFromProfile(
  userId: string,
  skills: string[]
): Promise<MemberProfileResponse> {
  if (!userId?.trim()) {
    throw new Error("User ID is required");
  }

  const normalizedSkills = normalizeStringArray(skills);
  
  if (normalizedSkills.length === 0) {
    const existing = await getMemberProfileByUserId(userId);
    if (!existing) throw new Error("Member profile not found");
    return existing;
  }

  const existing = await prisma.memberProfile.findUnique({
    where: { userId: userId.trim() },
  });

  if (!existing) {
    throw new Error("Member profile not found");
  }

  const filteredSkills = existing.skills.filter(
    (s: string) => !normalizedSkills.includes(s.toLowerCase())
  );

  const updated = await prisma.memberProfile.update({
    where: { userId: userId.trim() },
    data: { skills: filteredSkills },
  });

  return updated;
}