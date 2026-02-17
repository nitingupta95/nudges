/**
 * @swagger
 * /api/nudges/personalized:
 *   get:
 *     summary: Get personalized nudge for member-job pair
 *     tags: [Nudges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *         description: Member ID (defaults to authenticated user)
 *       - in: query
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Personalized nudge
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nudge:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     headline:
 *                       type: string
 *                     body:
 *                       type: string
 *                     cta:
 *                       type: string
 *                     matchScore:
 *                       type: number
 *                     matchTier:
 *                       type: string
 *                     inferences:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Missing jobId
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Member or job not found
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { getPersonalizedNudgeController } from "@/controllers/nudge.controller";

/**
 * GET: Get personalized nudge for a member-job pair
 */
export async function GET(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.AI,
      () => getPersonalizedNudgeController(request, user),
      user.id
    );
  });
}
