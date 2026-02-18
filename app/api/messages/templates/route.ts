/**
 * @swagger
 * /api/messages/templates:
 *   get:
 *     summary: Get available message templates
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [REFERRAL, INTRO, FOLLOW_UP]
 *         description: Filter by template type
 *     responses:
 *       200:
 *         description: Available templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 templates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       tone:
 *                         type: string
 *                       preview:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { getTemplatesController } from "@/controllers/message.controller";

/**
 * GET: Get available message templates
 */
export async function GET(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.READ,
      () => getTemplatesController(request, user),
      user.id
    );
  });
}
