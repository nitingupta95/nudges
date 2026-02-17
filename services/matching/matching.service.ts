/**
 * Matching Service
 * Handles match score calculation between members and jobs
 */

import { prisma } from '@/lib/prisma';
import { MatchTier } from '@/lib/generated/prisma/client';
import { NotFoundError } from '@/lib/middleware/error-handler.middleware';

// ============================================
// Types
// ============================================

export interface MatchScoreBreakdown {
  skillOverlap: number;
  companyOverlap: number;
  industryOverlap: number;
  seniorityMatch: number;
  locationProximity: number;
  domainSimilarity: number;
}

export interface MatchReason {
  type: string;
  weight: number;
  score: number;
  explanation: string;
}

export interface MatchScoreResult {
  overall: number;
  tier: MatchTier;
  breakdown: MatchScoreBreakdown;
  reasons: MatchReason[];
  topInferences: string[];
}

export interface BatchScoreOptions {
  includeReasons?: boolean;
  minScore?: number;
}

export interface BatchScoreResult {
  memberId: string;
  score: number;
  tier: MatchTier;
  reasons?: MatchReason[];
}

// ============================================
// Score Weights
// ============================================

const WEIGHTS = {
  skillOverlap: 0.30,
  companyOverlap: 0.25,
  industryOverlap: 0.15,
  seniorityMatch: 0.15,
  locationProximity: 0.05,
  domainSimilarity: 0.10,
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate Jaccard similarity between two arrays
 */
function jaccardSimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 0;
  
  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));
  
  const intersection = [...set1].filter(x => set2.has(x));
  const union = new Set([...set1, ...set2]);
  
  return (intersection.length / union.size) * 100;
}

/**
 * Calculate overlap between two string arrays
 */
function calculateOverlap(arr1: string[], arr2: string[]): { score: number; matches: string[] } {
  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));
  
  const matches = [...set1].filter(x => set2.has(x));
  
  if (arr2.length === 0) return { score: 0, matches: [] };
  
  // Score based on how many job requirements are met
  const score = (matches.length / arr2.length) * 100;
  return { score: Math.min(100, score), matches };
}

/**
 * Calculate seniority match score
 */
function calculateSeniorityMatch(
  memberLevel: string,
  memberYears: number,
  jobLevel: string,
  jobMinYears?: number,
  jobMaxYears?: number
): number {
  const levelOrder = ['INTERN', 'ENTRY', 'MID', 'SENIOR', 'STAFF', 'PRINCIPAL', 'EXECUTIVE'];
  
  const memberIdx = levelOrder.indexOf(memberLevel);
  const jobIdx = levelOrder.indexOf(jobLevel);
  
  if (memberIdx === -1 || jobIdx === -1) return 50;
  
  // Perfect match
  if (memberIdx === jobIdx) {
    // Check years experience if available
    if (jobMinYears && memberYears < jobMinYears) {
      return 70;
    }
    if (jobMaxYears && memberYears > jobMaxYears) {
      return 80; // Overqualified slightly penalized
    }
    return 100;
  }
  
  // One level off
  const diff = Math.abs(memberIdx - jobIdx);
  if (diff === 1) return 75;
  if (diff === 2) return 50;
  
  return Math.max(0, 100 - diff * 20);
}

/**
 * Determine match tier from score
 */
function getTier(score: number): MatchTier {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

// ============================================
// Main Service Functions
// ============================================

/**
 * Calculate match score between a member and a job
 */
export async function calculateMatchScore(
  memberId: string,
  jobId: string
): Promise<MatchScoreResult> {
  // Fetch member profile and job with tags
  const [memberProfile, job] = await Promise.all([
    prisma.memberProfile.findUnique({
      where: { id: memberId },
    }),
    prisma.job.findUnique({
      where: { id: jobId },
      include: { jobTag: true },
    }),
  ]);

  if (!memberProfile) {
    throw new NotFoundError('Member profile', memberId);
  }

  if (!job) {
    throw new NotFoundError('Job', jobId);
  }

  const jobSkills = job.jobTag?.skills || [];
  const jobDomains = job.jobTag?.domains || [];
  const jobIndustry = job.industry || job.jobTag?.industry;

  // Calculate individual scores
  const skillResult = calculateOverlap(memberProfile.skills, jobSkills);
  const companyResult = calculateOverlap(
    memberProfile.pastCompanies,
    [job.company] // Check if member worked at this company
  );
  const domainResult = calculateOverlap(memberProfile.domains, [job.domain, ...jobDomains]);
  const industryResult = calculateOverlap(
    memberProfile.industries,
    jobIndustry ? [jobIndustry] : []
  );
  
  const seniorityScore = calculateSeniorityMatch(
    memberProfile.experienceLevel,
    memberProfile.yearsOfExperience,
    job.experienceLevel,
    job.minExperience || undefined,
    job.maxExperience || undefined
  );

  // Location proximity (simplified - could use geocoding)
  let locationScore = 50; // Default mid score
  if (memberProfile.location && job.location) {
    if (memberProfile.location.toLowerCase().includes(job.location.toLowerCase()) ||
        job.location.toLowerCase().includes(memberProfile.location.toLowerCase())) {
      locationScore = 100;
    }
  }
  if (job.isRemote) {
    locationScore = Math.max(locationScore, 80); // Remote-friendly
  }

  const breakdown: MatchScoreBreakdown = {
    skillOverlap: skillResult.score,
    companyOverlap: companyResult.score,
    industryOverlap: industryResult.score,
    seniorityMatch: seniorityScore,
    locationProximity: locationScore,
    domainSimilarity: domainResult.score,
  };

  // Calculate weighted overall score
  const overall = Math.round(
    breakdown.skillOverlap * WEIGHTS.skillOverlap +
    breakdown.companyOverlap * WEIGHTS.companyOverlap +
    breakdown.industryOverlap * WEIGHTS.industryOverlap +
    breakdown.seniorityMatch * WEIGHTS.seniorityMatch +
    breakdown.locationProximity * WEIGHTS.locationProximity +
    breakdown.domainSimilarity * WEIGHTS.domainSimilarity
  );

  // Generate reasons
  const reasons: MatchReason[] = [];
  
  if (companyResult.score > 0) {
    reasons.push({
      type: 'company_overlap',
      weight: WEIGHTS.companyOverlap,
      score: companyResult.score,
      explanation: `You worked at ${job.company}`,
    });
  }

  if (skillResult.matches.length > 0) {
    reasons.push({
      type: 'skill_match',
      weight: WEIGHTS.skillOverlap,
      score: skillResult.score,
      explanation: `Matching skills: ${skillResult.matches.slice(0, 5).join(', ')}`,
    });
  }

  if (domainResult.matches.length > 0) {
    reasons.push({
      type: 'domain_match',
      weight: WEIGHTS.domainSimilarity,
      score: domainResult.score,
      explanation: `Domain expertise in ${domainResult.matches.join(', ')}`,
    });
  }

  if (seniorityScore >= 75) {
    reasons.push({
      type: 'seniority_match',
      weight: WEIGHTS.seniorityMatch,
      score: seniorityScore,
      explanation: `Your ${memberProfile.experienceLevel} level matches this role`,
    });
  }

  // Generate top inferences
  const topInferences: string[] = [];
  
  if (companyResult.score > 0) {
    topInferences.push(`You may know engineers from ${job.company}`);
  }
  
  if (skillResult.matches.length > 0) {
    topInferences.push(`Your ${skillResult.matches[0]} expertise is relevant`);
  }
  
  if (memberProfile.pastCompanies.length > 0) {
    topInferences.push(`Think of colleagues from ${memberProfile.pastCompanies[0]} who might fit`);
  }

  return {
    overall,
    tier: getTier(overall),
    breakdown,
    reasons,
    topInferences,
  };
}

/**
 * Get or compute match score (with caching)
 */
export async function getMatchScore(
  memberId: string,
  jobId: string
): Promise<MatchScoreResult> {
  // Check for cached score
  const cached = await prisma.matchScore.findUnique({
    where: {
      memberId_jobId: { memberId, jobId },
    },
  });

  // Return cached if valid (not expired)
  if (cached && (!cached.expiresAt || cached.expiresAt > new Date())) {
    return {
      overall: cached.overallScore,
      tier: cached.tier,
      breakdown: {
        skillOverlap: cached.skillOverlap,
        companyOverlap: cached.companyOverlap,
        industryOverlap: cached.industryOverlap,
        seniorityMatch: cached.seniorityMatch,
        locationProximity: cached.locationProximity,
        domainSimilarity: cached.domainSimilarity,
      },
      reasons: (cached.reasons as any) || [],
      topInferences: cached.topInferences,
    };
  }

  // Calculate fresh score
  const result = await calculateMatchScore(memberId, jobId);

  // Cache the result
  await prisma.matchScore.upsert({
    where: {
      memberId_jobId: { memberId, jobId },
    },
    create: {
      memberId,
      jobId,
      overallScore: result.overall,
      tier: result.tier,
      skillOverlap: result.breakdown.skillOverlap,
      companyOverlap: result.breakdown.companyOverlap,
      industryOverlap: result.breakdown.industryOverlap,
      seniorityMatch: result.breakdown.seniorityMatch,
      locationProximity: result.breakdown.locationProximity,
      domainSimilarity: result.breakdown.domainSimilarity,
      reasons: result.reasons as any,
      topInferences: result.topInferences,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    update: {
      overallScore: result.overall,
      tier: result.tier,
      skillOverlap: result.breakdown.skillOverlap,
      companyOverlap: result.breakdown.companyOverlap,
      industryOverlap: result.breakdown.industryOverlap,
      seniorityMatch: result.breakdown.seniorityMatch,
      locationProximity: result.breakdown.locationProximity,
      domainSimilarity: result.breakdown.domainSimilarity,
      reasons: result.reasons as any,
      topInferences: result.topInferences,
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return result;
}

/**
 * Batch score multiple members for a job
 */
export async function batchScoreMembers(
  jobId: string,
  memberIds: string[],
  options: BatchScoreOptions = {}
): Promise<{
  scores: BatchScoreResult[];
  filtered: number;
  total: number;
}> {
  const { includeReasons = true, minScore = 0 } = options;

  const results: BatchScoreResult[] = [];

  for (const memberId of memberIds) {
    try {
      const score = await getMatchScore(memberId, jobId);
      
      if (score.overall >= minScore) {
        results.push({
          memberId,
          score: score.overall,
          tier: score.tier,
          reasons: includeReasons ? score.reasons : undefined,
        });
      }
    } catch (error) {
      // Skip members that couldn't be scored
      console.error(`Failed to score member ${memberId}:`, error);
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return {
    scores: results,
    filtered: memberIds.length - results.length,
    total: memberIds.length,
  };
}

/**
 * Get top members for a job
 */
export async function getTopMembersForJob(
  jobId: string,
  limit: number = 10,
  minTier: MatchTier = 'MEDIUM'
): Promise<Array<{
  memberId: string;
  name: string;
  score: number;
  tier: MatchTier;
  topReasons: string[];
}>> {
  // Get job to verify it exists
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new NotFoundError('Job', jobId);
  }

  // Get cached scores
  const tierOrder: MatchTier[] = ['HIGH', 'MEDIUM', 'LOW'];
  const minTierIdx = tierOrder.indexOf(minTier);
  const validTiers = tierOrder.slice(0, minTierIdx + 1);

  const scores = await prisma.matchScore.findMany({
    where: {
      jobId,
      tier: { in: validTiers },
    },
    orderBy: { overallScore: 'desc' },
    take: limit,
    include: {
      member: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  return scores.map((s) => ({
    memberId: s.memberId,
    name: s.member.user.name,
    score: s.overallScore,
    tier: s.tier,
    topReasons: s.topInferences.slice(0, 3),
  }));
}

/**
 * Invalidate match scores for a member (when profile updates)
 */
export async function invalidateMemberScores(memberId: string): Promise<void> {
  await prisma.matchScore.deleteMany({
    where: { memberId },
  });
}

/**
 * Invalidate match scores for a job (when job updates)
 */
export async function invalidateJobScores(jobId: string): Promise<void> {
  await prisma.matchScore.deleteMany({
    where: { jobId },
  });
}
