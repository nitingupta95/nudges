/**
 * @swagger
 * /api/jobs/{jobId}/candidates:
 *   get:
 *     summary: Get ranked candidates for a job
 *     tags: [Jobs, Candidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Comma-separated status filter (e.g., SUBMITTED,SHORTLISTED)
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: integer
 *         description: Minimum combined score (0-100)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of candidates to return
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [score, date, name]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Ranked candidates list
 *       403:
 *         description: Forbidden - not job owner
 *       404:
 *         description: Job not found
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getRankedCandidates,
  calculateResumeMatchScore,
  type CandidateRanking,
  type ParsedResume,
  type ResumeMatchScore,
} from "@/services/resume/resume.service";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await context.params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const statusParam = searchParams.get("status");
    const status = statusParam ? statusParam.split(",") : undefined;
    const minScore = parseInt(searchParams.get("minScore") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const sortBy = searchParams.get("sortBy") || "score";

    // Get job and verify permissions
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        createdById: true,
        company: true,
        jobTag: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Only recruiters, admins, or job creator can view candidates
    const isRecruiterOrAdmin = user.role === "RECRUITER" || user.role === "ADMIN";
    const isJobCreator = job.createdById === user.id;

    if (!isRecruiterOrAdmin && !isJobCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all referrals for this job
    const referrals = await prisma.referral.findMany({
      where: {
        jobId,
        ...(status && { status: { in: status as any[] } }),
      },
      include: {
        referrer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build candidate rankings
    const candidates: CandidateRanking[] = [];

    for (const referral of referrals) {
      const parsedResume = referral.parsedResumeData as ParsedResume | null;
      let matchScore = referral.resumeMatchScore as ResumeMatchScore | null;

      // If we have parsed data but no match score, calculate it
      if (parsedResume && !matchScore) {
        try {
          matchScore = await calculateResumeMatchScore(parsedResume, jobId);
          // Store the calculated score
          await prisma.referral.update({
            where: { id: referral.id },
            data: {
              resumeMatchScore: matchScore as any,
              fitScore: matchScore.overall,
            },
          });
        } catch (error) {
          console.error(`Failed to calculate match score for referral ${referral.id}:`, error);
        }
      }

      // Create default match score if none exists
      if (!matchScore) {
        matchScore = {
          overall: referral.fitScore || 50,
          breakdown: {
            skillMatch: 50,
            experienceMatch: 50,
            industryMatch: 50,
            domainMatch: 50,
            seniorityMatch: 50,
            educationMatch: 50,
          },
          matchedSkills: [],
          missingSkills: [],
          strengths: referral.candidateResume 
            ? ["Resume uploaded - awaiting analysis"] 
            : ["Referred by trusted network member"],
          concerns: referral.candidateResume 
            ? [] 
            : ["No resume uploaded for detailed analysis"],
          recommendation: "POTENTIAL_FIT",
          source: "calculated",
        };
      }

      const resumeScore = matchScore.overall;
      const fitScore = referral.fitScore ?? undefined;
      const combinedScore = fitScore
        ? Math.round(resumeScore * 0.6 + fitScore * 0.4)
        : resumeScore;

      if (combinedScore >= minScore) {
        candidates.push({
          referralId: referral.id,
          candidateName: referral.candidateName,
          candidateEmail: referral.candidateEmail,
          resumeMatchScore: resumeScore,
          fitScore,
          combinedScore,
          rank: 0,
          status: referral.status,
          parsedResume: parsedResume || undefined,
          matchDetails: matchScore,
          submittedAt: referral.submittedAt?.toISOString(),
          referrerName: referral.referrer.name,
        });
      }
    }

    // Sort candidates
    switch (sortBy) {
      case "date":
        candidates.sort((a, b) => 
          new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
        );
        break;
      case "name":
        candidates.sort((a, b) => a.candidateName.localeCompare(b.candidateName));
        break;
      case "score":
      default:
        candidates.sort((a, b) => b.combinedScore - a.combinedScore);
        break;
    }

    // Assign ranks
    candidates.forEach((c, i) => {
      c.rank = i + 1;
    });

    // Calculate summary stats
    const stats = {
      totalCandidates: candidates.length,
      withResume: candidates.filter(c => c.parsedResume).length,
      averageScore: candidates.length > 0
        ? Math.round(candidates.reduce((sum, c) => sum + c.combinedScore, 0) / candidates.length)
        : 0,
      byRecommendation: {
        strongFit: candidates.filter(c => c.matchDetails.recommendation === "STRONG_FIT").length,
        goodFit: candidates.filter(c => c.matchDetails.recommendation === "GOOD_FIT").length,
        potentialFit: candidates.filter(c => c.matchDetails.recommendation === "POTENTIAL_FIT").length,
        notRecommended: candidates.filter(c => c.matchDetails.recommendation === "NOT_RECOMMENDED").length,
      },
      byStatus: referrals.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      jobId,
      jobTitle: job.title,
      company: typeof job.company === "string" ? job.company : (job.company as any)?.name,
      candidates: candidates.slice(0, limit),
      stats,
      filters: {
        status,
        minScore,
        limit,
        sortBy,
      },
    });
  } catch (error) {
    console.error("Error fetching ranked candidates:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}
