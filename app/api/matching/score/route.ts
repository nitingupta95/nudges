/**
 * @swagger
 * /api/matching/score:
 *   get:
 *     summary: Get match score between member and job
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Member profile ID
 *       - in: query
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Match score with breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matchScore:
 *                   type: object
 *                   properties:
 *                     overall:
 *                       type: number
 *                       description: Overall score 0-100
 *                     tier:
 *                       type: string
 *                       enum: [HIGH, MEDIUM, LOW]
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         skillOverlap:
 *                           type: number
 *                         companyOverlap:
 *                           type: number
 *                         industryOverlap:
 *                           type: number
 *                         seniorityMatch:
 *                           type: number
 *                         locationProximity:
 *                           type: number
 *                         domainSimilarity:
 *                           type: number
 *                     reasons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           weight:
 *                             type: number
 *                           score:
 *                             type: number
 *                           explanation:
 *                             type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Member or job not found
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { getMatchScoreController } from "@/controllers/matching.controller";

/**
 * GET: Get match score between a member and a job
 */
export async function GET(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.READ,
      () => getMatchScoreController(request, user),
      user.id
    );
  });
}
