import { prisma } from "@/lib/prisma";

// ============================================
// TYPES
// ============================================

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
    memberProfile: any;
}

// ============================================
// USER SERVICE FUNCTIONS
// ============================================

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
    if (!userId) {
        throw new Error("User ID is required");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            memberProfile: true,
        },
    });

    return user;
}

/**
 * Get complete user profile with relations
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    return getUserById(userId);
}
