import { NextResponse } from "next/server";
import { requireRecruiterOrAdmin } from "@/lib/auth";
import {
  getOverallFunnelMetrics,
  getFunnelMetricsByJob,
} from "@/services/events/event.service";

/**
 * @swagger
 * /api/analytics/funnel:
 *   get:
 *     summary: Get referral funnel metrics
 *     tags:
 *       - Analytics
 *     parameters:
 *       - name: days
 *         in: query
 *         description: Number of days to look back (default 30)
 *         schema:
 *           type: integer
 *       - name: jobId
 *         in: query
 *         description: Filter by specific job ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Funnel metrics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export async function GET(req: Request) {
  try {
    // Only admins and recruiters can view analytics
    await requireRecruiterOrAdmin(req);

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const jobId = searchParams.get("jobId");

    let metrics;
      if (jobId) {
        metrics = await getFunnelMetricsByJob(jobId, days);
      } else {
        metrics = await getOverallFunnelMetrics(days);
      }

      return NextResponse.json({
        success: true,
        metrics,
      });
    } catch (error) {
      console.error("Error fetching funnel metrics:", error);
    
    // Check if this is an auth error
    if (error instanceof Error && (error.message.includes("Unauthorized") || error.message.includes("Forbidden"))) {
      return NextResponse.json(
        { error: error.message, code: "AUTH_ERROR" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch funnel metrics", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}