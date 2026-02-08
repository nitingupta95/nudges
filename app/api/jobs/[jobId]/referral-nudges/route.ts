import { NextResponse } from "next/server";
import { getReferralNudges } from "@/services/nudges/nudge.service";
import { requireAuth } from "@/lib/auth";

/**
 * GET: Fetch referral nudges for a specific job and authenticated user
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Get authenticated user
    const user = await requireAuth(req);
    const { jobId } = await params; // Await params in Next.js 15+

    // Generate nudges for the authenticated user
    const result = await getReferralNudges(user.id, jobId);

    return NextResponse.json(result);
  } catch (error) {
    // Handle expected errors (like Job not found for mock IDs) gracefully
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.toLowerCase().includes("not found")) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      );
    }

    console.error("Error fetching referral nudges:", error);

    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch referral nudges" },
      { status: 500 }
    );
  }
}