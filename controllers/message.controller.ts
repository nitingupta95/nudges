/**
 * Message Controller
 * Handles HTTP logic for message generation endpoints
 */

import { NextResponse } from 'next/server';
import { AuthUser } from '@/lib/auth';
import {
  validateBody,
  validationErrorResponse,
  GenerateMessageSchema,
} from '@/lib/middleware/validation.middleware';
import {
  withErrorHandler,
  successResponse,
} from '@/lib/middleware/error-handler.middleware';
import {
  generateMessage,
  generateAIMessage,
  getMessageTemplates,
} from '@/services/messages/message.service';

// ============================================
// Generate Message
// ============================================

export async function generateMessageController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = await validateBody(req, GenerateMessageSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const { memberId, jobId, template, customContext } = validation.data!;

    // Use the authenticated user's member ID if not specified
    const effectiveMemberId = memberId || user.id;

    const result = await generateMessage(
      effectiveMemberId,
      jobId,
      template as any,
      customContext
    );

    return successResponse(result);
  });
}

// ============================================
// Generate AI Message
// ============================================

export async function generateAIMessageController(
  req: Request,
  user: AuthUser
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const validation = await validateBody(req, GenerateMessageSchema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const { memberId, jobId, customContext } = validation.data!;

    const effectiveMemberId = memberId || user.id;

    const result = await generateAIMessage(
      effectiveMemberId,
      jobId,
      customContext
    );

    return successResponse(result);
  });
}

// ============================================
// Get Message Templates
// ============================================

export async function getMessageTemplatesController(): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const templates = await getMessageTemplates();
    return successResponse({ templates });
  });
}

// Alias for route compatibility
export const getTemplatesController = async (
  req: Request,
  user: AuthUser
): Promise<NextResponse> => {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    const templates = await getMessageTemplates();
    
    // Filter by type if provided
    const filteredTemplates = type 
      ? templates.filter(t => t.id.toUpperCase().includes(type.toUpperCase()))
      : templates;
    
    return successResponse({ templates: filteredTemplates });
  });
};
