import { prisma } from "./prisma";
import { User } from "@/lib/generated/prisma";
import crypto from "crypto";

// ============================================
// TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// ============================================
// CONFIGURATION
// ============================================

const SECRET_KEY = process.env.AUTH_SECRET || "default-secret-key-change-in-production";
const TOKEN_EXPIRY_HOURS = 24;
const SALT_ROUNDS = 16;

// ============================================
// PASSWORD HASHING
// ============================================

/**
 * Hash a password using PBKDF2
 * Returns a string in format: salt:hash
 */
export function hashPassword(password: string): string {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  const salt = crypto.randomBytes(SALT_ROUNDS).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");

  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) {
    return false;
  }

  const [salt, originalHash] = storedHash.split(":");

  if (!salt || !originalHash) {
    return false;
  }

  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");

  return hash === originalHash;
}

// ============================================
// TOKEN MANAGEMENT
// ============================================

/**
 * Generate a simple token (mock implementation)
 * In production, use JWT or a similar secure token mechanism
 */
export function generateToken(user: AuthUser): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  };

  // Simple base64 encoding (replace with JWT in production)
  const tokenData = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(tokenData)
    .digest("hex");

  return Buffer.from(`${tokenData}:${signature}`).toString("base64");
}

/**
 * Verify and decode a token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [tokenData, signature] = decoded.split(/:(?=[^:]+$)/);

    if (!tokenData || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(tokenData)
      .digest("hex");

    if (signature !== expectedSignature) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(tokenData);

    // Check expiration
    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// ============================================
// USER AUTHENTICATION
// ============================================

/**
 * Get current user from request
 * Extracts token from Authorization header
 */
export async function getCurrentUser(req: Request): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      // Development mode fallback
      if (process.env.NODE_ENV === "development") {
        return getDevUser();
      }
      return null;
    }

    // Handle Bearer token
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return user;
    }

    return null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(req: Request): Promise<AuthUser> {
  let token: string | null = null;

  // Use Next.js cookies helper (works in App Router)
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("auth_token");
    token = authCookie?.value || null;
    console.log("Token from Next.js cookies:", token ? "EXISTS" : "MISSING");
  } catch (error) {
    console.log("Failed to use Next.js cookies, falling back to manual parsing");

    // Fallback: Manual cookie parsing
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      token = cookies.auth_token || null;
      console.log("Token from manual parsing:", token ? "EXISTS" : "MISSING");
    }
  }

  // Fallback to Authorization header for API compatibility
  if (!token) {
    const authHeader = req.headers.get("authorization");
    token = authHeader?.replace("Bearer ", "") || null;
    console.log("Token from Authorization header:", token ? "EXISTS" : "MISSING");
  }

  if (!token) {
    console.log("No token found anywhere");
    throw new Error("Unauthorized");
  }

  console.log("Verifying token...");
  const payload = verifyToken(token);
  if (!payload) {
    console.log("Token verification failed");
    throw new Error("Unauthorized");
  }

  console.log("Token verified successfully for user:", payload.userId);
  return {
    id: payload.userId,
    email: payload.email,
    name: "", // Will be populated from DB if needed
    role: payload.role,
  };
}

/**
 * Require specific role(s) - throws error if user doesn't have required role
 */
export async function requireRole(
  req: Request,
  allowedRoles: string[]
): Promise<AuthUser> {
  const user = await requireAuth(req);

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin(req: Request): Promise<AuthUser> {
  return requireRole(req, ["ADMIN"]);
}

/**
 * Require recruiter or admin role
 */
export async function requireRecruiterOrAdmin(req: Request): Promise<AuthUser> {
  return requireRole(req, ["ADMIN", "RECRUITER"]);
}

// ============================================
// USER LOOKUP
// ============================================

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  if (!email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

/**
 * Find user by ID
 */
export async function findUserById(userId: string): Promise<User | null> {
  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * Get user with member profile
 */
export async function getUserWithProfile(userId: string) {
  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    include: { memberProfile: true },
  });
}

// ============================================
// DEVELOPMENT HELPERS
// ============================================

/**
 * Get a mock user for development
 */
async function getDevUser(): Promise<AuthUser | null> {
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (user) {
    return user;
  }

  // Return a default dev user if no users exist
  return {
    id: "dev-user-id",
    email: "dev@pieworks.com",
    name: "Dev User",
    role: "MEMBER",
  };
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
    return { valid: false, errors };
  }

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input (remove leading/trailing whitespace, lowercase email)
 */
export function sanitizeAuthInput(input: {
  email?: string;
  password?: string;
  name?: string;
}): {
  email?: string;
  password?: string;
  name?: string;
} {
  return {
    email: input.email?.trim().toLowerCase(),
    password: input.password, // Don't trim passwords
    name: input.name?.trim(),
  };
}