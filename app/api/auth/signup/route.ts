import { NextResponse } from "next/server";
import { signupUser } from "@/services/auth/auth.service";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    const result = await signupUser(name, email, password);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Signup error:", error);

    // Return appropriate error message
    if (error instanceof Error) {
      const status = error.message.includes("already in use") ? 409 : 400;
      return NextResponse.json(
        { error: error.message },
        { status }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}