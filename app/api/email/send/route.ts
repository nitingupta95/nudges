import { NextResponse } from "next/server";
import { requireRecruiterOrAdmin } from "@/lib/auth";
import { sendEmail } from "@/services/email/email.service";
import {prisma} from "@/lib/prisma";

/**
 * @swagger
 * /api/email/send:
 *   post:
 *     summary: Send email to candidate
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
 *               - to
 *               - subject
 *               - body
 *             properties:
 *               to:
 *                 type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *               referralId:
 *                 type: string
 *               cc:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to send email
 */
export async function POST(req: Request) {
  try {
    const user = await requireRecruiterOrAdmin(req);
    const body = await req.json();

    const { to, subject, body: emailBody, referralId, cc } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: "to, subject, and body are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Invalid email address", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Send the email
    const result = await sendEmail(to, subject, emailBody, {
      cc,
      replyTo: user.email,
      fromName: user.name || 'Recruitment Team',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email", code: "EMAIL_ERROR" },
        { status: 500 }
      );
    }

    // Log email activity if referralId provided
    if (referralId) {
      try {
        const referral = await prisma.referral.findUnique({
          where: { id: referralId },
          select: { statusHistory: true },
        });

        if (referral) {
          const history = (referral.statusHistory as Array<{
            status: string;
            timestamp: string;
            note?: string;
          }>) || [];

          await prisma.referral.update({
            where: { id: referralId },
            data: {
              statusHistory: [
                ...history,
                {
                  status: 'EMAIL_SENT',
                  timestamp: new Date().toISOString(),
                  note: `Email sent: "${subject.substring(0, 50)}..."`,
                },
              ],
            },
          });
        }
      } catch (logError) {
        console.error("Failed to log email activity:", logError);
        // Don't fail the request if logging fails
      }
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send email", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
