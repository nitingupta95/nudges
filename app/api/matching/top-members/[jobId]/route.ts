/**
 * @swagger
 * /api/matching/top-members/{jobId}:
 *   get:
 *     summary: Get top matching members for a job
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of top members to return
 *       - in: query
 *         name: minTier
 *         schema:
 *           type: string
 *           enum: [HIGH, MEDIUM, LOW]
 *           default: MEDIUM
 *         description: Minimum tier to include
 *     responses:
 *       200:
 *         description: Top matching members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topMembers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       memberId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       score:
 *                         type: number
 *                       tier:
 *                         type: string
 *                       topReasons:
 *                         type: array
 *                         items:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (recruiters/admins only)
 *       404:
 *         description: Job not found
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { getTopMembersController } from "@/controllers/matching.controller";

/**
 * GET: Get top matching members for a job
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.READ,
      () => getTopMembersController(request, jobId, user),
      user.id
    );
  }, { roles: ['ADMIN', 'RECRUITER'] });
}
