/**
 * @swagger
 * /api/ai/contact-insights:
 *   post:
 *     summary: Extract contact insights from job description
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobTitle
 *               - jobDescription
 *             properties:
 *               jobTitle:
 *                 type: string
 *               jobDescription:
 *                 type: string
 *               company:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact insights
 */

import { NextResponse } from "next/server";
import { extractContactInsights } from "@/services/ai/ai.service";
import { cachedAICall } from "@/services/ai/ai.cache.service";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobTitle, jobDescription, company } = body;

    if (!jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: "jobTitle and jobDescription are required" },
        { status: 400 }
      );
    }

    // Generate cache key
    const contentHash = crypto
      .createHash("md5")
      .update(`${jobTitle}:${jobDescription}:${company || ""}`)
      .digest("hex");

    const result = await cachedAICall("insights", contentHash, () =>
      extractContactInsights(jobTitle, jobDescription, company)
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Contact insights error:", error);
    return NextResponse.json(
      { error: "Failed to extract contact insights" },
      { status: 500 }
    );
  }
}