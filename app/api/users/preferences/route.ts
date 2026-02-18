/**
 * @swagger
 * /api/users/preferences:
 *   get:
 *     summary: Get user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                   properties:
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *                     pastCompanies:
 *                       type: array
 *                       items:
 *                         type: string
 *                     domains:
 *                       type: array
 *                       items:
 *                         type: string
 *                     experienceLevel:
 *                       type: string
 *                     yearsOfExperience:
 *                       type: number
 *                     isOpenToRefer:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *   patch:
 *     summary: Update user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               pastCompanies:
 *                 type: array
 *                 items:
 *                   type: string
 *               domains:
 *                 type: array
 *                 items:
 *                   type: string
 *               experienceLevel:
 *                 type: string
 *                 enum: [INTERN, ENTRY, MID, SENIOR, STAFF, PRINCIPAL, EXECUTIVE]
 *               yearsOfExperience:
 *                 type: number
 *               preferredRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferredDomains:
 *                 type: array
 *                 items:
 *                   type: string
 *               isOpenToRefer:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated preferences
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import {
  getUserPreferencesController,
  updateUserPreferencesController,
} from "@/controllers/user.controller";

/**
 * GET: Fetch the current user's preferences
 */
export async function GET(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.READ,
      () => getUserPreferencesController(request, user),
      user.id
    );
  });
}

/**
 * PATCH: Update the current user's preferences
 */
export async function PATCH(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.WRITE,
      () => updateUserPreferencesController(request, user),
      user.id
    );
  });
}
