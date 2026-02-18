/**
 * @swagger
 * /api/matching/batch-score:
 *   post:
 *     summary: Batch score multiple members for a job
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - memberIds
 *             properties:
 *               jobId:
 *                 type: string
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 100
 *               options:
 *                 type: object
 *                 properties:
 *                   includeReasons:
 *                     type: boolean
 *                     default: true
 *                   minScore:
 *                     type: number
 *                     default: 0
 *     responses:
 *       200:
 *         description: Batch scoring results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scores:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       memberId:
 *                         type: string
 *                       score:
 *                         type: number
 *                       tier:
 *                         type: string
 *                       reasons:
 *                         type: array
 *                 filtered:
 *                   type: integer
 *                 total:
 *                   type: integer
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (recruiters/admins only)
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { batchScoreMembersController } from "@/controllers/matching.controller";

/**
 * POST: Batch score multiple members for a job
 */
export async function POST(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.BATCH,
      () => batchScoreMembersController(request, user),
      user.id
    );
  }, { roles: ['ADMIN', 'RECRUITER'] });
}
