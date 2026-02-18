import { NextResponse } from "next/server";

/**
 * POST: Logout user by clearing the auth cookie
 */
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logout successful
 */
export async function POST() {
    const response = NextResponse.json({ message: "Logged out successfully" });

    // Clear the auth cookie
    response.cookies.set("auth_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0, // Expire immediately
        path: "/",
    });

    return response;
}
