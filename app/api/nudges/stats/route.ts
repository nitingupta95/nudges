/**
 * @swagger
 * /api/nudges/stats:
 *   get:
 *     summary: Get nudge statistics
 *     tags: [Nudges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         description: Get stats for a specific job
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *         description: Get stats for a specific member (own stats or admin)
 *     responses:
 *       200:
 *         description: Nudge statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalShown:
 *                       type: integer
 *                     clicked:
 *                       type: integer
 *                     dismissed:
 *                       type: integer
 *                     referred:
 *                       type: integer
 *                     clickRate:
 *                       type: number
 *                     conversionRate:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { getNudgeStatsController } from "@/controllers/nudge.controller";

/**
 * GET: Get nudge statistics
 */
export async function GET(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.READ,
      () => getNudgeStatsController(request, user),
      user.id
    );
  });
}
