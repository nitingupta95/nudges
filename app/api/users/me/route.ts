import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserProfile } from "@/services/user/user.service";

/**
 * GET: Fetch the current user's profile
 */
export async function GET(req: Request) {
  try {
    console.log("=== /api/users/me called ===");
    console.log("Cookie header:", req.headers.get("cookie"));

    const authUser = await requireAuth(req);
    console.log("Auth successful for user:", authUser.id);

    const userProfile = await getUserProfile(authUser.id);

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user data directly (not wrapped in { user: ... })
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}