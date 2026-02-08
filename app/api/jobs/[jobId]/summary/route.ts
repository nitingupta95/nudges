import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { summarizeJobDescription } from "@/services/ai/ai.service";

/**
 * GET: Get AI-powered summary for a specific job
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;

        // Fetch job from database
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            select: {
                id: true,
                title: true,
                description: true,
            },
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Generate AI summary
        const summary = await summarizeJobDescription(job.title, job.description);

        // Return with caching headers (cache for 1 hour)
        return NextResponse.json(summary, {
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
        });
    } catch (error) {
        console.error("Error generating job summary:", error);
        return NextResponse.json(
            { error: "Failed to generate summary" },
            { status: 500 }
        );
    }
}
