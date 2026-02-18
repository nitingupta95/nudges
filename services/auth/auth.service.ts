import { prisma } from "@/lib/prisma";
import {
    generateToken,
    isValidEmail,
    sanitizeAuthInput,
} from "@/lib/auth";
import bcrypt from "bcrypt";

// ============================================
// TYPES
// ============================================

export interface LoginResponse {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        memberProfile: any;
    };
    token: string;
}

export interface SignupResponse {
    message: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    token: string;
}

// ============================================
// AUTH SERVICE FUNCTIONS
// ============================================

/**
 * Login a user with email and password
 */
export async function loginUser(
    email: string,
    password: string
): Promise<LoginResponse> {
    // Validate required fields
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    // Validate email format
    if (!isValidEmail(email)) {
        throw new Error("Invalid email format");
    }

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
            memberProfile: {
                select: {
                    id: true,
                    skills: true,
                    domains: true,
                    experienceLevel: true,
                    isOpenToRefer: true,
                },
            },
        },
    });

    // User not found - use generic error message for security
    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    // Generate auth token
    const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    });

    // Return user details and token
    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            memberProfile: user.memberProfile,
        },
        token,
    };
}

/**
 * Sign up a new user
 * @param role - Optional role (MEMBER or RECRUITER). ADMIN cannot be self-assigned.
 */
export async function signupUser(
    name: string,
    email: string,
    password: string,
    role?: "MEMBER" | "RECRUITER"
): Promise<SignupResponse> {
    // Validate required fields
    if (!name || !email || !password) {
        throw new Error("All fields are required");
    }

    // Validate password length
    if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
    }

    // Validate role - only MEMBER and RECRUITER allowed via signup
    const validRole = role === "RECRUITER" ? "RECRUITER" : "MEMBER";

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("Email is already in use");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with member profile in a transaction
    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: validRole,
            memberProfile: {
                create: {
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
            },
        },
    });

    // Generate auth token
    const token = generateToken({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
    });

    return {
        message: "Signup successful",
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
        },
        token,
    };
}
