/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 profile:
 *                   $ref: '#/components/schemas/MemberProfile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { getCurrentUserController } from "@/controllers/user.controller";

/**
 * GET: Fetch the current user's profile
 */
export async function GET(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.READ,
      () => getCurrentUserController(user),
      user.id
    );
  });
}