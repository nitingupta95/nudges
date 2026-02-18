/**
 * Email Service
 * Handles email templates and sending for referral status updates
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

// ============================================
// SMTP Configuration
// ============================================

const smtpConfig: SMTPTransport.Options = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create reusable transporter instance
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
    }
    transporter = nodemailer.createTransport(smtpConfig);
  }
  return transporter;
}

// ============================================
// Types
// ============================================

export interface EmailTemplate {
  subject: string;
  body: string;
  htmlBody?: string;
}

export interface EmailContext {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  referrerName?: string;
  recruiterName?: string;
  customMessage?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  offerDetails?: string;
  rejectionReason?: string;
}

export type ReferralStatusEmailType = 
  | 'SUBMITTED'
  | 'VIEWED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEWING'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

// ============================================
// Email Templates
// ============================================

const EMAIL_TEMPLATES: Record<ReferralStatusEmailType, (ctx: EmailContext) => EmailTemplate> = {
  SUBMITTED: (ctx) => ({
    subject: `Your referral for ${ctx.jobTitle} at ${ctx.companyName} has been received`,
    body: `Dear ${ctx.candidateName},

Thank you for your interest in the ${ctx.jobTitle} position at ${ctx.companyName}. ${ctx.referrerName ? `You were referred by ${ctx.referrerName}.` : ''}

We have received your application and our team will review it shortly. We will be in touch regarding the next steps.

Best regards,
${ctx.recruiterName || 'The Recruitment Team'}
${ctx.companyName}`,
  }),

  VIEWED: (ctx) => ({
    subject: `Update on your ${ctx.jobTitle} application at ${ctx.companyName}`,
    body: `Dear ${ctx.candidateName},

Good news! Your application for the ${ctx.jobTitle} position at ${ctx.companyName} has been viewed by our hiring team.

We will review your profile and get back to you soon with next steps.

Best regards,
${ctx.recruiterName || 'The Recruitment Team'}
${ctx.companyName}`,
  }),

  UNDER_REVIEW: (ctx) => ({
    subject: `Your application for ${ctx.jobTitle} is under review`,
    body: `Dear ${ctx.candidateName},

Your application for the ${ctx.jobTitle} position at ${ctx.companyName} is currently under detailed review by our hiring team.

We appreciate your patience and will contact you soon with an update.

Best regards,
${ctx.recruiterName || 'The Recruitment Team'}
${ctx.companyName}`,
  }),

  SHORTLISTED: (ctx) => ({
    subject: `Congratulations! You've been shortlisted for ${ctx.jobTitle} at ${ctx.companyName}`,
    body: `Dear ${ctx.candidateName},

Great news! We are pleased to inform you that you have been shortlisted for the ${ctx.jobTitle} position at ${ctx.companyName}.

Our team was impressed with your profile and we would like to move forward with the interview process. We will reach out shortly to schedule an interview at your convenience.

${ctx.customMessage ? `\n${ctx.customMessage}\n` : ''}
Best regards,
${ctx.recruiterName || 'The Recruitment Team'}
${ctx.companyName}`,
  }),

  INTERVIEWING: (ctx) => ({
    subject: `Interview Scheduled: ${ctx.jobTitle} at ${ctx.companyName}`,
    body: `Dear ${ctx.candidateName},

We are excited to invite you for an interview for the ${ctx.jobTitle} position at ${ctx.companyName}.

${ctx.interviewDate ? `Date: ${ctx.interviewDate}` : ''}
${ctx.interviewTime ? `Time: ${ctx.interviewTime}` : ''}
${ctx.interviewLocation ? `Location/Link: ${ctx.interviewLocation}` : ''}

${ctx.customMessage ? `\nAdditional Information:\n${ctx.customMessage}\n` : ''}
Please confirm your availability by replying to this email. If you need to reschedule, please let us know at least 24 hours in advance.

Best regards,
${ctx.recruiterName || 'The Recruitment Team'}
${ctx.companyName}`,
  }),

  OFFERED: (ctx) => ({
    subject: `Job Offer: ${ctx.jobTitle} at ${ctx.companyName}`,
    body: `Dear ${ctx.candidateName},

Congratulations! We are delighted to extend an offer for the ${ctx.jobTitle} position at ${ctx.companyName}.

${ctx.offerDetails ? `Offer Details:\n${ctx.offerDetails}\n` : ''}
${ctx.customMessage ? `\n${ctx.customMessage}\n` : ''}
Please review the offer and let us know your decision within the next 5 business days. We're excited about the possibility of having you join our team!

Best regards,
${ctx.recruiterName || 'The Recruitment Team'}
${ctx.companyName}`,
  }),

  HIRED: (ctx) => ({
    subject: `Welcome to ${ctx.companyName}!`,
    body: `Dear ${ctx.candidateName},

We are thrilled to welcome you to ${ctx.companyName} as our new ${ctx.jobTitle}!

We're excited to have you join the team. Our HR department will be in touch shortly with onboarding details including your start date, documentation requirements, and first-day logistics.

${ctx.customMessage ? `\n${ctx.customMessage}\n` : ''}
If you have any questions in the meantime, please don't hesitate to reach out.

Welcome aboard!

Best regards,
${ctx.recruiterName || 'The Recruitment Team'}
${ctx.companyName}`,
  }),

  REJECTED: (ctx) => ({
    subject: `Update on your ${ctx.jobTitle} application at ${ctx.companyName}`,
    body: `Dear ${ctx.candidateName},

Thank you for your interest in the ${ctx.jobTitle} position at ${ctx.companyName} and for taking the time to go through our interview process.

After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.

${ctx.rejectionReason ? `Feedback:\n${ctx.rejectionReason}\n` : ''}
${ctx.customMessage ? `\n${ctx.customMessage}\n` : ''}
We encourage you to apply for other positions at ${ctx.companyName} that match your skills in the future. We wish you the best in your job search.

Best regards,
${ctx.recruiterName || 'The Recruitment Team'}
${ctx.companyName}`,
  }),

  WITHDRAWN: (ctx) => ({
    subject: `Application Withdrawal Confirmed: ${ctx.jobTitle} at ${ctx.companyName}`,
    body: `Dear ${ctx.candidateName},

This email confirms that your application for the ${ctx.jobTitle} position at ${ctx.companyName} has been withdrawn as requested.

Thank you for your interest in our company. We hope you'll consider us for future opportunities.

Best regards,
${ctx.recruiterName || 'The Recruitment Team'}
${ctx.companyName}`,
  }),
};

// ============================================
// Service Functions
// ============================================

/**
 * Generate email content for a specific status with context
 */
export function generateStatusEmail(
  status: ReferralStatusEmailType,
  context: EmailContext
): EmailTemplate {
  const templateFn = EMAIL_TEMPLATES[status];
  if (!templateFn) {
    throw new Error(`No email template found for status: ${status}`);
  }
  return templateFn(context);
}

/**
 * Generate a custom email with provided subject and body
 */
export function generateCustomEmail(
  subject: string,
  body: string,
  context?: Partial<EmailContext>
): EmailTemplate {
  // Replace placeholders if context is provided
  let processedSubject = subject;
  let processedBody = body;

  if (context) {
    const replacements: Record<string, string | undefined> = {
      '{{candidateName}}': context.candidateName,
      '{{jobTitle}}': context.jobTitle,
      '{{companyName}}': context.companyName,
      '{{referrerName}}': context.referrerName,
      '{{recruiterName}}': context.recruiterName,
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      if (value) {
        processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
        processedBody = processedBody.replace(new RegExp(placeholder, 'g'), value);
      }
    });
  }

  return {
    subject: processedSubject,
    body: processedBody,
  };
}

/**
 * Get status-specific email template suggestions
 */
export function getEmailTemplateSuggestion(
  status: ReferralStatusEmailType,
  context: EmailContext
): { subject: string; body: string; editable: boolean } {
  const template = generateStatusEmail(status, context);
  return {
    subject: template.subject,
    body: template.body,
    editable: true,
  };
}

/**
 * Build mailto link with subject and body
 */
export function buildMailtoLink(
  to: string,
  subject: string,
  body: string,
  cc?: string,
  bcc?: string
): string {
  const params = new URLSearchParams();
  params.set('subject', subject);
  params.set('body', body);
  if (cc) params.set('cc', cc);
  if (bcc) params.set('bcc', bcc);
  
  return `mailto:${to}?${params.toString()}`;
}

/**
 * Send email via SMTP using Nodemailer
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  options?: {
    cc?: string;
    bcc?: string;
    replyTo?: string;
    fromName?: string;
    html?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transport = getTransporter();
    
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
    const fromName = options?.fromName || process.env.SMTP_FROM_NAME || 'Nudges';
    
    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      text: body,
      html: options?.html || body.replace(/\n/g, '<br>'),
      ...(options?.cc && { cc: options.cc }),
      ...(options?.bcc && { bcc: options.bcc }),
      ...(options?.replyTo && { replyTo: options.replyTo }),
    };

    const info = await transport.sendMail(mailOptions);
    
    console.log('📧 Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
    };
  }
}

/**
 * Verify SMTP connection
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('✅ SMTP connection verified');
    return { success: true };
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMTP connection failed',
    };
  }
}

/**
 * Get available status email templates for preview
 */
export function getAvailableEmailStatuses(): ReferralStatusEmailType[] {
  return Object.keys(EMAIL_TEMPLATES) as ReferralStatusEmailType[];
}

/**
 * Send bulk emails with rate limiting
 */
export async function sendBulkEmails(
  emails: Array<{
    to: string;
    subject: string;
    body: string;
    html?: string;
  }>,
  options?: {
    fromName?: string;
    delayMs?: number; // Delay between emails to avoid rate limits
  }
): Promise<{ total: number; sent: number; failed: number; errors: string[] }> {
  const results = { total: emails.length, sent: 0, failed: 0, errors: [] as string[] };
  const delay = options?.delayMs || 100;

  for (const email of emails) {
    const result = await sendEmail(email.to, email.subject, email.body, {
      fromName: options?.fromName,
      html: email.html,
    });

    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(`${email.to}: ${result.error}`);
    }

    // Rate limiting delay
    if (delay > 0 && emails.indexOf(email) < emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return results;
}
