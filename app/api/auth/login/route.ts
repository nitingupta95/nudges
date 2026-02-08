import { NextResponse } from "next/server";
import { loginUser } from "@/services/auth/auth.service";
import { sanitizeAuthInput } from "@/lib/auth";

/**
 * POST: Login a user
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

    return NextResponse.json(result);
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