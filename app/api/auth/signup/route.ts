import { NextResponse } from "next/server";
import { signupUser } from "@/services/auth/auth.service";
import { sanitizeAuthInput } from "@/lib/auth";

/**
 * POST: Signup a new user
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sanitizedInput = sanitizeAuthInput(body);
    const { name, email, password } = sanitizedInput;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const result = await signupUser(name, email, password);

    // Create response with user data (without token)
    const response = NextResponse.json({
      user: result.user,
      message: "Account created successfully",
    });

    // Set HTTP-only cookie with the token (auto-login after signup)
    response.cookies.set("auth_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);

    // Return appropriate error message
    if (error instanceof Error) {
      const status = error.message.includes("already exists") ? 409 : 400;
      return NextResponse.json(
        { error: error.message },
        { status }
      );
    }

    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}