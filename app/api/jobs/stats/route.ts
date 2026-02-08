import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET: Get dashboard statistics
 * Query params: userId (optional) - to calculate personalized good fit count
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        // Get total active jobs
        const totalJobs = await prisma.job.count({
            where: {
                isActive: true,
            },
        });

        // Get jobs closing soon (within 7 days)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const closingSoon = await prisma.job.count({
            where: {
                isActive: true,
                closingDate: {
                    lte: sevenDaysFromNow,
                    gte: new Date(),
                },
            },
        });

        // Calculate good fit count if userId is provided
        let goodFit = 0;
        if (userId) {
            // Fetch user's member profile
            const memberProfile = await prisma.memberProfile.findUnique({
                where: { userId },
            });

            if (memberProfile) {
                // Fetch all active jobs with their tags
                const jobs = await prisma.job.findMany({
                    where: { isActive: true },
                    include: {
                        jobTag: true,
                    },
                });

                // Calculate fit scores and count good/medium fits
                const { calculateFitScore } = await import("@/lib/referral-fit");

                goodFit = jobs.filter((job) => {
                    const fitScore = calculateFitScore(
                        {
                            id: job.id,
                            title: job.title,
                            company: job.company,
                            description: job.description,
                            skills: job.jobTag?.skills || [],
                            experienceLevel: job.experienceLevel.toLowerCase() as "junior" | "mid" | "senior" | undefined,
                            domain: job.domain || undefined,
                            postedAt: job.createdAt.toISOString(),
                            closingDate: job.closingDate?.toISOString(),
                        },
                        {
                            id: memberProfile.id,
                            userId: memberProfile.userId,
                            skills: memberProfile.skills,
                            pastCompanies: memberProfile.pastCompanies,
                            domains: memberProfile.domains,
                            experienceLevel: memberProfile.experienceLevel.toLowerCase() as "junior" | "mid" | "senior",
                            yearsOfExperience: memberProfile.yearsOfExperience,
                            currentCompany: memberProfile.currentCompany || undefined,
                            currentTitle: memberProfile.currentTitle || undefined,
                            location: memberProfile.location || undefined,
                            preferredDomains: memberProfile.preferredDomains,
                            preferredRoles: memberProfile.preferredRoles,
                            isOpenToRefer: memberProfile.isOpenToRefer,
                        }
                    );
                    return fitScore.level === "good" || fitScore.level === "medium";
                }).length;
            }
        }

        return NextResponse.json({
            totalJobs,
            closingSoon,
            goodFit,
        });
    } catch (error) {
        console.error("Get stats error:", error);

        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}

