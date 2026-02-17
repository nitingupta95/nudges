/**
 * @swagger
 * /api/jobs/{jobId}:
 *   get:
 *     summary: Get a specific job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job:
 *                   $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *   patch:
 *     summary: Update a specific job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateJobInput'
 *     responses:
 *       200:
 *         description: Job updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 *   delete:
 *     summary: Delete a specific job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 */

import { withAuth } from "@/lib/middleware/auth.middleware";
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit.middleware";
import {
  getJobController,
  updateJobController,
  deleteJobController,
} from "@/controllers/job.controller";

/**
 * GET: Fetch a specific job by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  
  return withRateLimit(
    req,
    RATE_LIMITS.READ,
    () => getJobController(jobId)
  );
}

/**
 * PATCH: Update a specific job by ID
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.WRITE,
      () => updateJobController(request, jobId, user),
      user.id
    );
  });
}

/**
 * DELETE: Delete a specific job by ID
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  
  return withAuth(req, async (request, user) => {
    return withRateLimit(
      request,
      RATE_LIMITS.WRITE,
      () => deleteJobController(jobId, user),
      user.id
    );
  });
}