/**
 * Authentication Middleware
 * Handles JWT validation, user extraction, and role-based access control
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, AuthUser, TokenPayload } from '../auth';
import { ApiError } from './error-handler.middleware';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface AuthMiddlewareOptions {
  /** Roles allowed to access the endpoint */
  roles?: ('ADMIN' | 'RECRUITER' | 'MEMBER')[];
  /** Whether to allow unauthenticated access (optional auth) */
  optional?: boolean;
}

/**
 * Convert TokenPayload to AuthUser
 */
function tokenToAuthUser(payload: TokenPayload): AuthUser {
  return {
    id: payload.userId,
    email: payload.email,
    name: payload.email.split('@')[0], // Fallback name from email
    role: payload.role,
  };
}

/**
 * Extract and validate authentication from request
 */
export async function extractAuth(req: Request): Promise<AuthUser | null> {
  // Try Authorization header first
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    return payload ? tokenToAuthUser(payload) : null;
  }

  // Try Next.js cookies API (most reliable in App Router)
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth_token');
    if (authCookie?.value) {
      // Decode URL-encoded characters (base64 tokens may have +, /, =)
      const token = decodeURIComponent(authCookie.value);
      const payload = verifyToken(token);
      return payload ? tokenToAuthUser(payload) : null;
    }
  } catch {
    // Fallback to manual cookie parsing if Next.js cookies() fails
    const cookieHeader = req.headers.get('Cookie');
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
      if (tokenMatch) {
        // Decode URL-encoded characters
        const token = decodeURIComponent(tokenMatch[1]);
        const payload = verifyToken(token);
        return payload ? tokenToAuthUser(payload) : null;
      }
    }
  }

  return null;
}

/**
 * Require authentication middleware
 * Use this wrapper to protect API routes
 */
export async function withAuth<T>(
  req: Request,
  handler: (req: Request, user: AuthUser) => Promise<T>,
  options: AuthMiddlewareOptions = {}
): Promise<NextResponse | T> {
  try {
    const user = await extractAuth(req);

    if (!user && !options.optional) {
      throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Check role-based access
    if (user && options.roles && options.roles.length > 0) {
      if (!options.roles.includes(user.role as any)) {
        throw new ApiError(
          'Insufficient permissions',
          403,
          'FORBIDDEN'
        );
      }
    }

    // If optional auth and no user, pass null
    if (options.optional && !user) {
      return handler(req, null as any);
    }

    return handler(req, user!);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Authentication failed', code: 'AUTH_ERROR' },
      { status: 401 }
    );
  }
}

/**
 * Require specific roles
 */
export function requireRoles(...roles: ('ADMIN' | 'RECRUITER' | 'MEMBER')[]) {
  return (user: AuthUser): boolean => {
    return roles.includes(user.role as any);
  };
}

/**
 * Check if user owns the resource
 */
export function requireOwnership(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

/**
 * Check if user is admin or owns the resource
 */
export function requireAdminOrOwnership(
  user: AuthUser,
  resourceOwnerId: string
): boolean {
  return user.role === 'ADMIN' || user.id === resourceOwnerId;
}
