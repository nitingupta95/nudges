/**
 * @swagger
 * /api/referrals:
 *   get:
 *     summary: List all referrals for the authenticated user
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, DRAFT, SUBMITTED, VIEWED, UNDER_REVIEW, SHORTLISTED, INTERVIEWING, OFFERED, HIRED, REJECTED, WITHDRAWN]
 *         description: Filter by status
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         description: Filter by job ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of referrals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 referrals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Referral'
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new referral
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReferralInput'
 *     responses:
 *       201:
 *         description: Referral created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 referral:
 *                   $ref: '#/components/schemas/Referral'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Referral already exists
 *   patch:
 *     summary: Update a referral status
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referralId
 *               - status
 *             properties:
 *               referralId:
 *                 type: string
 *               status:
 *                 type: string
 *               reviewNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Referral updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Referral not found
 *   delete:
 *     summary: Delete a referral
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: referralId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Referral deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Referral not found
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import {
  listReferralsController,
  createReferralController,
  updateReferralController,
  deleteReferralController,
} from "@/controllers/referral.controller";

/**
 * GET: List all referrals for a user
 */
export async function GET(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.READ,
      () => listReferralsController(request, user),
      user.id
    );
  });
}

/**
 * POST: Create a new referral
 */
export async function POST(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.WRITE,
      () => createReferralController(request, user),
      user.id
    );
  });
}

/**
 * PATCH: Update the status of a referral
 */
export async function PATCH(req: Request) {
  return withAuth(req, async (request, user) => {
    const body = await request.clone().json();
    const referralId = body.referralId;
    
    if (!referralId) {
      return NextResponse.json(
        { error: "referralId is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    return withRateLimit(
      request,
      RATE_LIMITS.WRITE,
      () => updateReferralController(request, referralId, user),
      user.id
    );
  });
}

/**
 * DELETE: Delete a referral by ID
 */
export async function DELETE(req: Request) {
  return withAuth(req, async (request, user) => {
    const { searchParams } = new URL(request.url);
    const referralId = searchParams.get("referralId");

    if (!referralId) {
      return NextResponse.json(
        { error: "Referral ID is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    return withRateLimit(
      request,
      RATE_LIMITS.WRITE,
      () => deleteReferralController(referralId, user),
      user.id
    );
  });
}