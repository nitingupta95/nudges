/**
 * @swagger
 * /api/ai/parse-job:
 *   post:
 *     summary: Parse job description using AI
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
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Parsed job data
 */

import { NextResponse } from "next/server";
import { parseJobDescriptionAI } from "@/services/ai/ai.service";
import { cachedAICall } from "@/services/ai/ai.cache.serivce";
import { checkBudget } from "@/services/ai/ai.budget.service";
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

    // Check budget before making AI call
    const budget = checkBudget();
    if (!budget.withinBudget) {
      return NextResponse.json(
        {
          error: "AI budget exceeded, using static parsing",
          budget: {
            dailySpend: budget.dailySpend,
            remaining: budget.remainingBudget,
          },
        },
        { status: 429 }
      );
    }

    // Generate cache key from content hash
    const contentHash = crypto
      .createHash("md5")
      .update(`${title}:${description}`)
      .digest("hex");

    // Use cached AI call
    const result = await cachedAICall("jobParsing", contentHash, () =>
      parseJobDescriptionAI(title, description)
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Job parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse job description" },
      { status: 500 }
    );
  }
}