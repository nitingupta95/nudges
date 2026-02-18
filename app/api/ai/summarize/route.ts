/**
 * @swagger
 * /api/ai/summarize:
 *   post:
 *     summary: Generate job summary bullets
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job summary bullets
 */

import { NextResponse } from "next/server";
import { summarizeJobDescription } from "@/services/ai/ai.service";
import { cachedAICall } from "@/services/ai/ai.cache.serivce";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Generate cache key
    const contentHash = crypto
      .createHash("md5")
      .update(`${title}:${description}`)
      .digest("hex");

    const result = await cachedAICall("summary", contentHash, () =>
      summarizeJobDescription(title, description)
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: "Failed to summarize job description" },
      { status: 500 }
    );
  }
}