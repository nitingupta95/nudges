/**
 * @swagger
 * /api/jobs/{jobId}/referral-nudges:
 *   get:
 *     summary: Get referral nudges for a specific job
 *     tags: [Nudges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Referral nudges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nudges:
 *                   type: array
 *                   items:
 *                     type: string
 *                 explain:
 *                   type: string
 *                 matchScore:
 *                   type: number
 *                 matchTier:
 *                   type: string
 *                   enum: [HIGH, MEDIUM, LOW]
 *                 reasons:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { getReferralNudgesController } from "@/controllers/nudge.controller";

/**
 * GET: Fetch referral nudges for a specific job and authenticated user
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.AI,
      () => getReferralNudgesController(jobId, user),
      user.id
    );
  });
}