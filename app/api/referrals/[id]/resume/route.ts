/**
 * @swagger
 * /api/referrals/{id}/resume:
 *   post:
 *     summary: Upload and parse resume for a referral
 *     tags: [Referrals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *               resumeText:
 *                 type: string
 *                 description: Plain text resume content (alternative to file upload)
 *     responses:
 *       200:
 *         description: Resume parsed successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Referral not found
 *   get:
 *     summary: Get parsed resume data for a referral
 *     tags: [Referrals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Parsed resume data
 *       404:
 *         description: Referral not found or no resume data
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  parseResume,
  calculateResumeMatchScore,
  extractTextFromResume,
  type ParsedResume,
  type ResumeMatchScore,
} from "@/services/resume/resume.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST: Upload and parse resume
export async function POST(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: referralId } = await context.params;

    // Get referral
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: { job: true },
    });

    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    // Check permission - must be referrer, recruiter, or admin
    const isReferrer = referral.referrerId === user.id;
    const isRecruiterOrAdmin = user.role === "RECRUITER" || user.role === "ADMIN";
    const isJobCreator = referral.job.createdById === user.id;

    if (!isReferrer && !isRecruiterOrAdmin && !isJobCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse the request
    const contentType = request.headers.get("content-type") || "";
    let resumeText = "";
    let resumeUrl: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("resume") as File | null;
      const textContent = formData.get("resumeText") as string | null;

      if (file) {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log(`[Resume Upload] File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
        
        // Extract text from file
        resumeText = await extractTextFromResume(buffer, file.type);
        
        console.log(`[Resume Upload] Extracted text length: ${resumeText.length} chars`);
        if (resumeText.length > 0) {
          console.log(`[Resume Upload] First 300 chars: ${resumeText.slice(0, 300)}`);
        }
        
        // In production, upload to S3/Cloudinary and get URL
        // For now, we'll store base64 or skip URL storage
        resumeUrl = `data:${file.type};name=${file.name}`;
      } else if (textContent) {
        resumeText = textContent;
        console.log(`[Resume Upload] Text content received, length: ${resumeText.length} chars`);
      }
    } else {
      // Handle JSON body
      const body = await request.json();
      resumeText = body.resumeText || "";
      resumeUrl = body.resumeUrl;
    }

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json(
        { error: "Resume text is too short or empty. Please provide valid resume content." },
        { status: 400 }
      );
    }

    // Parse resume using AI
    const parsedResume = await parseResume(resumeText);

    // Calculate match score against the job
    const matchScore = await calculateResumeMatchScore(parsedResume, referral.jobId);

    // Update referral with parsed data
    await prisma.referral.update({
      where: { id: referralId },
      data: {
        candidateResume: resumeUrl || referral.candidateResume,
        parsedResumeData: parsedResume as any,
        resumeMatchScore: matchScore as any,
        fitScore: matchScore.overall,
        resumeParsedAt: new Date(),
        // Update candidate name if extracted and not already set
        candidateName: parsedResume.personalInfo?.name || referral.candidateName,
      },
    });

    return NextResponse.json({
      success: true,
      parsedResume,
      matchScore,
      message: "Resume parsed and scored successfully",
    });
  } catch (error) {
    console.error("Error processing resume:", error);
    return NextResponse.json(
      { error: "Failed to process resume" },
      { status: 500 }
    );
  }
}

// GET: Get parsed resume data
export async function GET(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: referralId } = await context.params;

    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        candidateResume: true,
        parsedResumeData: true,
        resumeMatchScore: true,
        fitScore: true,
        resumeParsedAt: true,
        jobId: true,
        job: {
          select: {
            title: true,
            createdById: true,
          },
        },
        referrerId: true,
      },
    });

    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    // Check permission
    const isReferrer = referral.referrerId === user.id;
    const isRecruiterOrAdmin = user.role === "RECRUITER" || user.role === "ADMIN";
    const isJobCreator = referral.job.createdById === user.id;

    if (!isReferrer && !isRecruiterOrAdmin && !isJobCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!referral.parsedResumeData) {
      return NextResponse.json(
        { error: "No resume data available", hasResume: !!referral.candidateResume },
        { status: 404 }
      );
    }

    return NextResponse.json({
      referralId: referral.id,
      candidateName: referral.candidateName,
      candidateEmail: referral.candidateEmail,
      hasResumeFile: !!referral.candidateResume,
      parsedResume: referral.parsedResumeData as unknown as ParsedResume,
      matchScore: referral.resumeMatchScore as unknown as ResumeMatchScore,
      fitScore: referral.fitScore,
      parsedAt: referral.resumeParsedAt,
    });
  } catch (error) {
    console.error("Error fetching resume data:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume data" },
      { status: 500 }
    );
  }
}
