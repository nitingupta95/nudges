import { NextResponse } from "next/server";
import { loginUser } from "@/services/auth/auth.service";
import { sanitizeAuthInput } from "@/lib/auth";

/**
 * POST: Login a user
 */
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
 
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sanitizedInput = sanitizeAuthInput(body);
    const { email, password } = sanitizedInput;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await loginUser(email, password);

    console.log("Login successful, setting cookie for user:", result.user.id);

    // Create response with user data (without token)
    const response = NextResponse.json({
      user: result.user,
    });

    // Set HTTP-only cookie with the token
    response.cookies.set({
      name: "auth_token",
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    console.log("Cookie set successfully");

    return response;
  } catch (error) {
    console.error("Login error:", error);

    // Return appropriate error message
    if (error instanceof Error) {
      const status = error.message.includes("Invalid email or password") ? 401 : 400;
      return NextResponse.json(
        { error: error.message },
        { status }
      );
    }

    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}