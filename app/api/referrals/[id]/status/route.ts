import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { updateReferralController } from "@/controllers/referral.controller";

/**
 * @swagger
 * /api/referrals/{id}/status:
 *   patch:
 *     summary: Update referral status
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Referral ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SUBMITTED, VIEWED, UNDER_REVIEW, SHORTLISTED, INTERVIEWING, OFFERED, HIRED, REJECTED, WITHDRAWN]
 *               reviewNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Referral status updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Referral not found
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: referralId } = await params;

  if (!referralId) {
    return NextResponse.json(
      { error: "Referral ID is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.WRITE,
      () => updateReferralController(request, referralId, user),
      user.id
    );
  });
}
