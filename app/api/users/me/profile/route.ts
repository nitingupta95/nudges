import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * GET: Get current user's member profile
 */
export async function GET(req: Request) {
    try {
        const user = await requireAuth(req);

        let memberProfile = await prisma.memberProfile.findUnique({
            where: { userId: user.id },
        });

        // Auto-create profile if it doesn't exist (fallback for existing users)
        if (!memberProfile) {
            console.log(`Creating missing profile for user ${user.id}`);
            memberProfile = await prisma.memberProfile.create({
                data: {
                    userId: user.id,
                    skills: [],
                    pastCompanies: [],
                    domains: [],
                    experienceLevel: "MID",
                    yearsOfExperience: 0,
                    preferredDomains: [],
                    preferredRoles: [],
                    isOpenToRefer: true,
                    profileCompleteness: 0,
                },
            });
        }

        return NextResponse.json(memberProfile);
    } catch (error) {
        console.error("Get profile error:", error);

        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

/**
 * PUT: Update current user's member profile
 */
export async function PUT(req: Request) {
    try {
        const user = await requireAuth(req);
        const body = await req.json();

        const {
            skills,
            pastCompanies,
            domains,
            experienceLevel,
            yearsOfExperience,
            preferences,
            currentCompany,
            currentTitle,
            location,
            preferredDomains,
            preferredRoles,
            isOpenToRefer,
        } = body;

        // Validate required fields
        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return NextResponse.json(
                { error: "Skills are required and must be a non-empty array" },
                { status: 400 }
            );
        }

        if (!pastCompanies || !Array.isArray(pastCompanies)) {
            return NextResponse.json(
                { error: "Past companies must be an array" },
                { status: 400 }
            );
        }

        if (!domains || !Array.isArray(domains)) {
            return NextResponse.json(
                { error: "Domains must be an array" },
                { status: 400 }
            );
        }

        // Normalize experience level to match Prisma enum
        const normalizedExperienceLevel = experienceLevel?.toUpperCase() as "INTERN" | "ENTRY" | "MID" | "SENIOR" | "STAFF" | "PRINCIPAL" | "EXECUTIVE";

        if (!experienceLevel || !["junior", "mid", "senior", "entry", "intern", "staff", "principal", "executive"].includes(experienceLevel.toLowerCase())) {
            return NextResponse.json(
                { error: "Experience level must be one of: intern, entry, junior, mid, senior, staff, principal, executive" },
                { status: 400 }
            );
        }

        if (yearsOfExperience !== undefined && (typeof yearsOfExperience !== "number" || yearsOfExperience < 0)) {
            return NextResponse.json(
                { error: "Years of experience must be a non-negative number" },
                { status: 400 }
            );
        }

        // Check if profile exists
        const existingProfile = await prisma.memberProfile.findUnique({
            where: { userId: user.id },
        });

        // Upsert profile (create if doesn't exist, update if it does)
        const updatedProfile = await prisma.memberProfile.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                skills,
                pastCompanies,
                domains,
                experienceLevel: normalizedExperienceLevel,
                yearsOfExperience: yearsOfExperience ?? 0,
                currentCompany: currentCompany ?? null,
                currentTitle: currentTitle ?? null,
                location: location ?? null,
                preferredDomains: preferredDomains ?? [],
                preferredRoles: preferredRoles ?? [],
                isOpenToRefer: isOpenToRefer ?? true,
                profileCompleteness: 0,
            },
            update: {
                skills,
                pastCompanies,
                domains,
                experienceLevel: normalizedExperienceLevel,
                yearsOfExperience: yearsOfExperience ?? existingProfile?.yearsOfExperience ?? 0,
                currentCompany: currentCompany ?? existingProfile?.currentCompany,
                currentTitle: currentTitle ?? existingProfile?.currentTitle,
                location: location ?? existingProfile?.location,
                preferredDomains: preferredDomains ?? existingProfile?.preferredDomains,
                preferredRoles: preferredRoles ?? existingProfile?.preferredRoles,
                isOpenToRefer: isOpenToRefer ?? existingProfile?.isOpenToRefer,
            },
        });

        return NextResponse.json(updatedProfile);
    } catch (error) {
        console.error("Update profile error:", error);

        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
