import { NextResponse } from "next/server";
import { extractContactInsights } from "@/services/ai/ai.service";

/**
 * POST: Extract contact insights from a job posting
 * Returns who should be reached out to based on the job description
 */
export async function POST(req: Request) {
  try {
    const { jobTitle, jobDescription, company } = await req.json();

    if (!jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: "Missing required fields: jobTitle and jobDescription" },
        { status: 400 }
      );
    }

    const insights = await extractContactInsights(
      jobTitle,
      jobDescription,
      company
    );

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Error extracting contact insights:", error);
    return NextResponse.json(
      { error: "Failed to extract contact insights" },
      { status: 500 }
    );
  }
}
