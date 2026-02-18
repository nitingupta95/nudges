import { NextResponse } from "next/server";
import { requireAuth, requireRecruiterOrAdmin } from "@/lib/auth";
import {
  generateStatusEmail,
  sendEmail,
  buildMailtoLink,
  type ReferralStatusEmailType,
  type EmailContext,
} from "@/services/email/email.service";
import { prisma } from "@/lib/prisma";
 

/**
 * @swagger
 * /api/email/template:  
 *   post:
 *     summary: Get email template for a referral status update
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referralId
 *               - status
 *             properties:
 *               referralId:
 *                 type: string
 *               status:
 *                 type: string
 *               customMessage:
 *                 type: string
 *               interviewDate:
 *                 type: string
 *               interviewTime:
 *                 type: string
 *               interviewLocation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email template generated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Referral not found
 */
export async function POST(req: Request) {
  try {
    const user = await requireRecruiterOrAdmin(req);
    const body = await req.json();

    const { referralId, status, customMessage, interviewDate, interviewTime, interviewLocation, offerDetails, rejectionReason } = body;

    if (!referralId || !status) {
      return NextResponse.json(
        { error: "referralId and status are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Fetch referral with job and referrer details
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        job: {
          select: {
            title: true,
            company: true,
          },
        },
        referrer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!referral) {
      return NextResponse.json(
        { error: "Referral not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const context: EmailContext = {
      candidateName: referral.candidateName,
      candidateEmail: referral.candidateEmail,
      jobTitle: referral.job.title,
      companyName: typeof referral.job.company === 'string' ? referral.job.company : referral.job.company || 'Our Company',
      referrerName: referral.referrer?.name || undefined,
      recruiterName: user.name || undefined,
      customMessage,
      interviewDate,
      interviewTime,
      interviewLocation,
      offerDetails,
      rejectionReason,
    };

    const template = generateStatusEmail(status as ReferralStatusEmailType, context);
    const mailtoLink = buildMailtoLink(referral.candidateEmail, template.subject, template.body);

    return NextResponse.json({
      success: true,
      template: {
        to: referral.candidateEmail,
        subject: template.subject,
        body: template.body,
        mailtoLink,
      },
      context: {
        candidateName: context.candidateName,
        jobTitle: context.jobTitle,
        companyName: context.companyName,
      },
    });
  } catch (error) {
    console.error("Error generating email template:", error);
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate email template", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
