import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection middleware
 * Ensures users can only access dashboards matching their role
 */

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

const SECRET_KEY = process.env.AUTH_SECRET || "default-secret-key-change-in-production";

/**
 * Create HMAC signature using Web Crypto API (Edge-compatible)
 */
async function createHmacSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify and decode token (Edge-compatible version)
 */
async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = atob(token);
    const [tokenData, signature] = decoded.split(/:(?=[^:]+$)/);

    if (!tokenData || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = await createHmacSignature(tokenData, SECRET_KEY);

    if (signature !== expectedSignature) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(tokenData);

    // Check expiration
    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract auth token from cookies
 */
function getAuthToken(request: NextRequest): string | null {
  const authCookie = request.cookies.get('auth_token');
  if (authCookie?.value) {
    return decodeURIComponent(authCookie.value);
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected route patterns
  const isMemberRoute = pathname.startsWith('/dashboard/member');
  const isRecruiterRoute = pathname.startsWith('/dashboard/recruiter');
  const isDashboardRoute = pathname === '/dashboard';

  // Skip middleware for non-dashboard routes
  if (!isMemberRoute && !isRecruiterRoute && !isDashboardRoute) {
    return NextResponse.next();
  }

  // Get auth token
  const token = getAuthToken(request);

  if (!token) {
    // Not logged in - redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const payload = await verifyToken(token);

  if (!payload) {
    // Invalid/expired token - redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = payload.role;

  // Role-based access control
  if (isMemberRoute && userRole !== 'MEMBER') {
    // Non-members trying to access member dashboard
    if (userRole === 'RECRUITER' || userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/recruiter', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isRecruiterRoute && userRole !== 'RECRUITER' && userRole !== 'ADMIN') {
    // Non-recruiters/admins trying to access recruiter dashboard
    if (userRole === 'MEMBER') {
      return NextResponse.redirect(new URL('/dashboard/member', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Main /dashboard route - redirect based on role
  if (isDashboardRoute) {
    if (userRole === 'RECRUITER' || userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/recruiter', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard/member', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
