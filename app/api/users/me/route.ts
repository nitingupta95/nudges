import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserProfile } from "@/services/user/user.service";

/**
 * GET: Fetch the current user's profile
 */
export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);

    const userProfile = await getUserProfile(user.id);

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}