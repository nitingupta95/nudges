/**
 * @swagger
 * /api/jobs/contact-insights:
 *   post:
 *     summary: Get contact insights for a job posting
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobTitle
 *               - jobDescription
 *             properties:
 *               jobTitle:
 *                 type: string
 *               jobDescription:
 *                 type: string
 *               company:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 insights:
 *                   type: object
 *                   properties:
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     departments:
 *                       type: array
 *                       items:
 *                         type: string
 *                     description:
 *                       type: string
 *                     source:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { getContactInsightsController } from "@/controllers/user.controller";

/**
 * POST: Extract contact insights from a job posting
 */
export async function POST(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.AI,
      () => getContactInsightsController(request),
      user.id
    );
  });
}
