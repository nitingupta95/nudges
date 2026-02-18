/**
 * @swagger
 * /api/nudges/interactions:
 *   post:
 *     summary: Log nudge interaction
 *     tags: [Nudges]
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
 *               - action
 *             properties:
 *               memberId:
 *                 type: string
 *                 description: Defaults to authenticated user
 *               jobId:
 *                 type: string
 *               nudgeId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [VIEWED, HOVERED, CLICKED, SHARE_WHATSAPP, SHARE_LINKEDIN, SHARE_EMAIL, COPY_MESSAGE, DISMISSED, REFERRED]
 *               metadata:
 *                 type: object
 *                 description: Additional context (source, position, etc.)
 *     responses:
 *       201:
 *         description: Interaction logged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logged:
 *                   type: boolean
 *                 interactionId:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { logNudgeInteractionController } from "@/controllers/nudge.controller";

/**
 * POST: Log a nudge interaction
 */
export async function POST(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.WRITE,
      () => logNudgeInteractionController(request, user),
      user.id
    );
  });
}
