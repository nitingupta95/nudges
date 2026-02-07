import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import {
  hashPassword,
  generateToken,
  isValidEmail,
  isValidPassword,
  sanitizeAuthInput,
} from "@/lib/auth";
import { Role } from "@/types/enums";
 

/**
 * POST: Signup a new user
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sanitizedInput = sanitizeAuthInput(body);
    const { email, password, name } = sanitizedInput;
    const role = body.role || "MEMBER";

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(", ") },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    // Validate role
  

 
    if (!Object.values(Role).includes(role as Role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN, RECRUITER, or MEMBER" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create new user with transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: { user: { create: (arg0: { data: { email: string; password: string; name: string; role: Role; }; }) => any; }; memberProfile: { create: (arg0: { data: { userId: any; skills: never[]; domains: never[]; pastCompanies: never[]; experienceLevel: string; yearsOfExperience: number; preferences: {}; isOpenToRefer: boolean; }; }) => any; }; }) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashPassword(password),
          name,
          role: role as Role,
        },
      });

      // Create member profile if the role is MEMBER
      let memberProfile = null;
      if (role === "MEMBER") {
        memberProfile = await tx.memberProfile.create({
          data: {
            userId: user.id,
            skills: [],
            domains: [],
            pastCompanies: [],
            experienceLevel: "MID",
            yearsOfExperience: 0,
            preferences: {},
            isOpenToRefer: true,
          },
        });
      }

      return { user, memberProfile };
    });

    // Generate auth token
    const token = generateToken({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    });

    // Return user details and token
    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          memberProfile: result.memberProfile
            ? {
                id: result.memberProfile.id,
                skills: result.memberProfile.skills,
                domains: result.memberProfile.domains,
                experienceLevel: result.memberProfile.experienceLevel,
                isOpenToRefer: result.memberProfile.isOpenToRefer,
              }
            : null,
        },
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);

    // Handle specific errors
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}