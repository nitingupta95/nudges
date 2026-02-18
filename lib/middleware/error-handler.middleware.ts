/**
 * Error Handler Middleware
 * Provides consistent error handling and response formatting
 */

import { NextResponse } from 'next/server';
import { Prisma } from '@/lib/generated/prisma/client';
import { ZodError } from 'zod';

// ============================================
// Custom Error Classes
// ============================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      404,
      'NOT_FOUND'
    );
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: string[]) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.name = 'RateLimitError';
  }
}

// ============================================
// Error Response Interface
// ============================================

export interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
  timestamp?: string;
  requestId?: string;
}

// ============================================
// Error Handler Functions
// ============================================

/**
 * Format error response consistently
 */
export function formatErrorResponse(
  error: unknown,
  requestId?: string
): { response: ErrorResponse; status: number } {
  const timestamp = new Date().toISOString();

  // Handle custom API errors
  if (error instanceof ApiError) {
    return {
      response: {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp,
        requestId,
      },
      status: error.statusCode,
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details = error.issues.map((e) => ({
      path: String(e.path.join('.')),
      message: e.message,
    }));
    return {
      response: {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
        timestamp,
        requestId,
      },
      status: 400,
    };
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, timestamp, requestId);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      response: {
        error: 'Invalid data provided',
        code: 'VALIDATION_ERROR',
        timestamp,
        requestId,
      },
      status: 400,
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Log the actual error for debugging
    console.error('[API Error]', error);

    // Don't expose internal error messages in production
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      response: {
        error: isProduction ? 'Internal server error' : error.message,
        code: 'INTERNAL_ERROR',
        timestamp,
        requestId,
      },
      status: 500,
    };
  }

  // Unknown error type
  console.error('[Unknown Error]', error);
  return {
    response: {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      timestamp,
      requestId,
    },
    status: 500,
  };
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  timestamp: string,
  requestId?: string
): { response: ErrorResponse; status: number } {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = (error.meta?.target as string[])?.join(', ') || 'field';
      return {
        response: {
          error: `A record with this ${target} already exists`,
          code: 'CONFLICT',
          timestamp,
          requestId,
        },
        status: 409,
      };

    case 'P2025':
      // Record not found
      return {
        response: {
          error: 'Record not found',
          code: 'NOT_FOUND',
          timestamp,
          requestId,
        },
        status: 404,
      };

    case 'P2003':
      // Foreign key constraint violation
      return {
        response: {
          error: 'Referenced record does not exist',
          code: 'VALIDATION_ERROR',
          timestamp,
          requestId,
        },
        status: 400,
      };

    case 'P2014':
      // Required relation violation
      return {
        response: {
          error: 'Required relation not found',
          code: 'VALIDATION_ERROR',
          timestamp,
          requestId,
        },
        status: 400,
      };

    default:
      console.error('[Prisma Error]', error.code, error.message);
      return {
        response: {
          error: 'Database operation failed',
          code: 'DATABASE_ERROR',
          timestamp,
          requestId,
        },
        status: 500,
      };
  }
}

/**
 * Wrap handler with error handling
 */
export async function withErrorHandler<T>(
  handler: () => Promise<T>,
  requestId?: string
): Promise<NextResponse> {
  try {
    const result = await handler();
    
    // If handler returns NextResponse, return it directly
    if (result instanceof NextResponse) {
      return result;
    }
    
    // Otherwise, wrap result in success response
    return NextResponse.json(result);
  } catch (error) {
    const { response, status } = formatErrorResponse(error, requestId);
    return NextResponse.json(response, { status });
  }
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create created response
 */
export function createdResponse<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

/**
 * Create no content response
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Generate request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
