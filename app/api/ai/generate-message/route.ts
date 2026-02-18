/**
 * @swagger
 * /api/ai/generate-message:
 *   post:
 *     summary: Generate personalized referral message
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobTitle
 *               - company
 *             properties:
 *               jobTitle:
 *                 type: string
 *               company:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               matchReason:
 *                 type: string
 *                 description: Why this job matches the user
 *     responses:
 *       200:
 *         description: Generated message
 */

import { NextResponse } from "next/server";
import { generateReferralMessage } from "@/services/ai/ai.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobTitle, company, skills, matchReason, memberName } = body;

    if (!jobTitle || !company) {
      return NextResponse.json(
        { error: "jobTitle and company are required" },
        { status: 400 }
      );
    }

    // Generate message
    const message = await generateReferralMessage(
      memberName || "A colleague",
      {
        title: jobTitle,
        company: company,
        skills: skills || [],
      },
      matchReason || "You might know someone great for this role"
    );

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Message generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}