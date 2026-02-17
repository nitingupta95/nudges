/**
 * Message Generator Service
 * Generates personalized referral messages with AI and template support
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/middleware/error-handler.middleware';

// ============================================
// Types
// ============================================

export type MessageTemplate = 'friendly' | 'professional' | 'casual';

export interface MessageContext {
  recipientName?: string;
  additionalNotes?: string;
}

export interface GeneratedMessage {
  subject: string;
  body: string;
  shareLinks: {
    whatsapp: string;
    linkedin: string;
    email: string;
  };
}

export interface MessageGeneratorResult {
  message: GeneratedMessage;
  source: 'ai' | 'template';
}

// ============================================
// Templates
// ============================================

const TEMPLATES: Record<MessageTemplate, {
  subject: string;
  body: string;
}> = {
  friendly: {
    subject: 'Know anyone for this {{jobTitle}} role?',
    body: `Hey{{recipientGreeting}},

I came across this {{jobTitle}} role at {{company}}. {{personalContext}}

{{jobHighlight}}

Let me know if anyone comes to mind!

{{jobUrl}}`,
  },
  professional: {
    subject: '{{jobTitle}} opportunity at {{company}}',
    body: `Hi{{recipientGreeting}},

I wanted to share a {{jobTitle}} opportunity at {{company}} that might interest someone in your network.

{{jobHighlight}}

If you know someone who would be a good fit, I'd appreciate the introduction.

Best regards

{{jobUrl}}`,
  },
  casual: {
    subject: '{{company}} is hiring! 👋',
    body: `Hey{{recipientGreeting}}!

Quick heads up - {{company}} is looking for a {{jobTitle}}.

{{personalContext}}

{{jobHighlight}}

Know anyone? 🤔

{{jobUrl}}`,
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Generate share URLs
 */
function generateShareLinks(text: string, jobUrl?: string): {
  whatsapp: string;
  linkedin: string;
  email: string;
} {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = jobUrl ? encodeURIComponent(jobUrl) : '';

  return {
    whatsapp: `https://wa.me/?text=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodeURIComponent('Job Opportunity')}&body=${encodedText}`,
  };
}

/**
 * Apply template variables
 */
function applyTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  // Clean up any unused placeholders
  result = result.replace(/{{[^}]+}}/g, '');
  
  return result.trim();
}

/**
 * Generate personal context based on member-job relationship
 */
function generatePersonalContext(
  memberProfile: {
    pastCompanies: string[];
    skills: string[];
    domains: string[];
  },
  job: {
    company: string;
    domain: string;
  },
  jobSkills: string[]
): string {
  const contexts: string[] = [];

  // Company match
  if (memberProfile.pastCompanies.some(c => 
    c.toLowerCase() === job.company.toLowerCase()
  )) {
    contexts.push(`Since you've worked at ${job.company}, you might know some great candidates.`);
  }

  // Skill match
  const matchingSkills = memberProfile.skills.filter(s =>
    jobSkills.some(js => js.toLowerCase() === s.toLowerCase())
  );
  if (matchingSkills.length > 0) {
    contexts.push(`Given your experience with ${matchingSkills.slice(0, 2).join(' and ')}, you probably know people who'd be perfect for this.`);
  }

  // Domain match
  if (memberProfile.domains.some(d => 
    d.toLowerCase() === job.domain.toLowerCase()
  )) {
    contexts.push(`This role is in ${job.domain} - right up your alley!`);
  }

  return contexts[0] || 'Thought of you as someone who might know the right person.';
}

/**
 * Generate job highlight
 */
function generateJobHighlight(job: {
  title: string;
  company: string;
  location?: string | null;
  isRemote?: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
}): string {
  const highlights: string[] = [];

  if (job.isRemote) {
    highlights.push('Remote-friendly');
  } else if (job.location) {
    highlights.push(`Based in ${job.location}`);
  }

  if (job.salaryMin && job.salaryMax) {
    const currency = job.salaryCurrency || 'USD';
    highlights.push(`${currency} ${job.salaryMin.toLocaleString()}-${job.salaryMax.toLocaleString()}`);
  }

  if (highlights.length > 0) {
    return `Key details: ${highlights.join(' | ')}`;
  }

  return '';
}

// ============================================
// Main Service Functions
// ============================================

/**
 * Generate a referral message
 */
export async function generateMessage(
  memberId: string,
  jobId: string,
  template: MessageTemplate = 'friendly',
  context?: MessageContext
): Promise<MessageGeneratorResult> {
  // Fetch member profile and job
  const [memberProfile, job] = await Promise.all([
    prisma.memberProfile.findUnique({
      where: { id: memberId },
    }),
    prisma.job.findUnique({
      where: { id: jobId },
      include: { jobTag: true },
    }),
  ]);

  if (!memberProfile) {
    throw new NotFoundError('Member profile', memberId);
  }

  if (!job) {
    throw new NotFoundError('Job', jobId);
  }

  const jobSkills = job.jobTag?.skills || [];
  const jobUrl = job.sourceUrl || `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job.id}`;

  // Prepare template variables
  const variables: Record<string, string> = {
    jobTitle: job.title,
    company: job.company,
    recipientGreeting: context?.recipientName ? ` ${context.recipientName}` : '',
    personalContext: generatePersonalContext(
      {
        pastCompanies: memberProfile.pastCompanies,
        skills: memberProfile.skills,
        domains: memberProfile.domains,
      },
      {
        company: job.company,
        domain: job.domain,
      },
      jobSkills
    ),
    jobHighlight: generateJobHighlight({
      title: job.title,
      company: job.company,
      location: job.location,
      isRemote: job.isRemote,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
    }),
    jobUrl,
  };

  // Apply template
  const templateConfig = TEMPLATES[template];
  const subject = applyTemplate(templateConfig.subject, variables);
  const body = applyTemplate(templateConfig.body, variables);

  // Generate share links
  const shareLinks = generateShareLinks(body, jobUrl);

  // Track event
  await prisma.event.create({
    data: {
      type: 'MESSAGE_GENERATED',
      userId: memberProfile.userId,
      jobId: job.id,
      metadata: {
        template,
        hasRecipient: !!context?.recipientName,
      },
    },
  });

  return {
    message: {
      subject,
      body,
      shareLinks,
    },
    source: 'template',
  };
}

/**
 * Get available message templates
 */
export async function getMessageTemplates(): Promise<Array<{
  id: string;
  name: string;
  description: string;
  preview: string;
}>> {
  return [
    {
      id: 'friendly',
      name: 'Friendly',
      description: 'Casual and warm tone, perfect for close contacts',
      preview: 'Hey, I came across this role...',
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Formal tone for professional networks',
      preview: 'I wanted to share an opportunity...',
    },
    {
      id: 'casual',
      name: 'Casual',
      description: 'Light and fun, with emojis',
      preview: 'Quick heads up - they\'re hiring! 👋',
    },
  ];
}

/**
 * Generate AI-powered message (if OpenAI is configured)
 * Currently falls back to template-based generation
 */
export async function generateAIMessage(
  memberId: string,
  jobId: string,
  context?: MessageContext
): Promise<MessageGeneratorResult> {
  // TODO: Implement AI-powered message generation when OpenAI service is available
  // For now, use professional template as fallback
  console.log('AI message generation not available, using professional template');
  return generateMessage(memberId, jobId, 'professional', context);
}
