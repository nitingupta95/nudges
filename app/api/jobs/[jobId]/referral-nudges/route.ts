import { NextResponse } from "next/server";
import { getReferralNudges } from "@/services/nudges/nudge.service";

/**
 * GET: Fetch referral nudges for a specific job and user
 */
export async function GET(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const nudges = await getReferralNudges(userId, jobId);

    return NextResponse.json({ nudges });
  } catch (error) {
    console.error("Error fetching referral nudges:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral nudges" },
      { status: 500 }
    );
  }
}