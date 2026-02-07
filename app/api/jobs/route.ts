import { NextResponse } from "next/server"; 
import { parseJobDescription } from "@/services/job/job.parser";
import { createJob, listJobs } from "@/test/test3";

/**
 * GET: List all jobs with optional filters
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      domain: searchParams.get("domain") || undefined,
      skills: searchParams.get("skills")?.split(",").filter(Boolean),
      isActive: searchParams.get("isActive") !== "false",
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const jobs = await listJobs(filters);

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error listing jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new job
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      title,
      company,
      description,
      location,
      salaryMin,
      salaryMax,
      isRemote,
      closingDate,
      createdById,
    } = body;

    if (!title || !company || !description || !createdById) {
      return NextResponse.json(
        { error: "Title, company, description, and createdById are required" },
        { status: 400 }
      );
    }

    // Parse job description to generate tags
    const parsedTags = parseJobDescription(title, description);

    const job = await createJob({
      title,
      company,
      description,
      location,
      salaryMin,
      salaryMax,
      isRemote,
      closingDate: closingDate ? new Date(closingDate) : undefined,
      createdById,
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}