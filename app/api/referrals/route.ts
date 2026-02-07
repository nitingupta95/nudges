import { NextResponse } from "next/server";
import {
  createReferral,
  listReferrals,
  updateReferralStatus,
  getReferralById,
  deleteReferral,
  getReferralAnalytics,
} from "@/services/referrals/referrals.service";  
import { ReferralStatus, RelationType } from "@/types/enums";

/**
 * GET: List all referrals for a user
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const statusParam = searchParams.get("status");
    const status = statusParam ? (statusParam.toUpperCase() as any) : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const referrals = await listReferrals(userId, { status, limit, offset });

    return NextResponse.json({ referrals });
  } catch (error) {
    console.error("Error listing referrals:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

/**
 * POST: Create a new referral
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      jobId,
      relation,
      candidateName,
      candidateEmail,
      candidatePhone,
      referralNote,
    } = body;

    if (!userId || !jobId || !relation || !candidateName || !candidateEmail) {
      return NextResponse.json(
        { error: "userId, jobId, relation, candidateName, and candidateEmail are required" },
        { status: 400 }
      );
    }

    if (!Object.values(RelationType).includes(relation)) {
      return NextResponse.json({ error: "Invalid relation type" }, { status: 400 });
    }

    const referral = await createReferral(
      userId,
      jobId,
      relation,
      candidateName,
      candidateEmail,
      candidatePhone,
      referralNote
    );

    return NextResponse.json({ referral }, { status: 201 });
  } catch (error) {
    console.error("Error creating referral:", error);
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}

/**
 * PATCH: Update the status of a referral
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const { referralId, newStatus, updatedBy, note } = body;

    if (!referralId || !newStatus || !updatedBy) {
      return NextResponse.json(
        { error: "referralId, newStatus, and updatedBy are required" },
        { status: 400 }
      );
    }

    if (!Object.values(ReferralStatus).includes(newStatus)) {
      return NextResponse.json({ error: "Invalid referral status" }, { status: 400 });
    }

    const updatedReferral = await updateReferralStatus(referralId, newStatus, updatedBy, note);

    return NextResponse.json({ referral: updatedReferral });
  } catch (error) {
    console.error("Error updating referral status:", error);
    return NextResponse.json({ error: "Failed to update referral status" }, { status: 500 });
  }
}

/**
 * DELETE: Delete a referral by ID
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const referralId = searchParams.get("referralId");

    if (!referralId) {
      return NextResponse.json({ error: "Referral ID is required" }, { status: 400 });
    }

    await deleteReferral(referralId);

    return NextResponse.json({ message: "Referral deleted successfully" });
  } catch (error) {
    console.error("Error deleting referral:", error);
    return NextResponse.json({ error: "Failed to delete referral" }, { status: 500 });
  }
}