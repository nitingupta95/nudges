import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import { listJobsController, createJobController } from "@/controllers/job.controller";
/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: List all jobs
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: domain
 *         schema:
 *           type: string
 *         description: Filter by domain
 *       - in: query
 *         name: experienceLevel
 *         schema:
 *           type: string
 *           enum: [INTERN, ENTRY, MID, SENIOR, STAFF, PRINCIPAL, EXECUTIVE]
 *         description: Filter by experience level
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Comma-separated skills
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *                 total:
 *                   type: integer
/**
 * GET: List all jobs with optional filters
 */
export async function GET(req: Request) {
  return withRateLimit(
    req,
    RATE_LIMITS.READ,
    () => listJobsController(req)
  );
}

/**
 * POST: Create a new job
 */
/**
 * @swagger
 * /api/jobs:
 *   get:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJobInput'
 *     responses:
 *       201:
 *         description: Job created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job:
 *                   $ref: '#/components/schemas/Job'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: Request) {
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.WRITE,
      () => createJobController(request, user),
      user.id
    );
  });
}