/**
 * @swagger
 * /api/messages/generate:
 *   post:
 *     summary: Generate referral message
 *     tags: [Messages]
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
 *             properties:
 *               memberId:
 *                 type: string
 *                 description: Defaults to authenticated user
 *               jobId:
 *                 type: string
 *               contactId:
 *                 type: string
 *                 description: Contact to refer
 *               tone:
 *                 type: string
 *                 enum: [FRIENDLY, PROFESSIONAL, CASUAL]
 *                 default: PROFESSIONAL
 *               includeJobLink:
 *                 type: boolean
 *                 default: true
 *               customContext:
 *                 type: string
 *                 description: Additional context to include
 *     responses:
 *       200:
 *         description: Generated message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 shareLinks:
 *                   type: object
 *                   properties:
 *                     whatsapp:
 *                       type: string
 *                     email:
 *                       type: string
 *                     linkedin:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job or member not found
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { generateMessageController } from "@/controllers/message.controller";

/**
 * POST: Generate a referral message
 */
export async function POST(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.AI,
      () => generateMessageController(request, user),
      user.id
    );
  });
}
