import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getMemberProfileByUserId,
  upsertMemberProfile,
} from "@/services/member/member.service"; 
export type ExperienceLevel = "INTERN" | "ENTRY" | "MID" | "SENIOR" | "STAFF" | "PRINCIPAL" | "EXECUTIVE";
 

/**
 * GET: Fetch the current user's preferences
 */
export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);

    const profile = await getMemberProfileByUserId(user.id);

    if (!profile) {
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

/**
 * PATCH: Update the current user's preferences
 */
export async function PATCH(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const {
      skills,
      pastCompanies,
      domains,
      experienceLevel,
      yearsOfExperience,
      preferredRoles,
      preferredDomains,
      isOpenToRefer,
    } = body;

    // Validate experience level
    if (experienceLevel) {
      const validLevels: ExperienceLevel[] = [
        "INTERN",
        "ENTRY",
        "MID",
        "SENIOR",
        "STAFF",
        "PRINCIPAL",
        "EXECUTIVE",
      ];
      if (!validLevels.includes(experienceLevel)) {
        return NextResponse.json(
          { error: "Invalid experience level" },
          { status: 400 }
        );
      }
    }

    const updatedProfile = await upsertMemberProfile(user.id, {
      skills,
      pastCompanies,
      domains,
      experienceLevel,
      yearsOfExperience,
      preferences: {
        preferredRoles,
        preferredDomains,
      },
      isOpenToRefer,
    });

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("Error updating preferences:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}