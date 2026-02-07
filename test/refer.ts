import { prisma } from "@/lib/prisma";
import {
  generateReferralNudges,
  ReferralNudge,
  NudgeEngineInput,
} from "./nudge.engine";
import {
  trackNudgesShown,
  trackMessageCopied,
} from "../events/event.service";

// ============================================
// TYPES
// ============================================

export interface NudgeWithTemplates extends ReferralNudge {
  messageTemplates: string[];
}

export interface NudgesResponse {
  jobId: string;
  jobTitle: string;
  company: string;
  nudges: NudgeWithTemplates[];
  generatedAt: string;
}

// ============================================
// GET NUDGES FOR JOB
// ============================================

export async function getNudgesForJob(
  jobId: string,
  userId: string
): Promise<NudgesResponse | null> {
  // Validate inputs
  if (!jobId || jobId.trim().length === 0) {
    throw new Error("Job ID is required");
  }

  if (!userId || userId.trim().length === 0) {
    throw new Error("User ID is required");
  }

  // Fetch job with tags and member profile in parallel
  const [job, memberProfile, user] = await Promise.all([
    prisma.job.findUnique({
      where: { id: jobId },
      include: { jobTag: true },
    }),
    prisma.memberProfile.findUnique({
      where: { userId },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    }),
  ]);

  // Validate job
  if (!job) {
    throw new Error("Job not found");
  }

  if (!job.isActive) {
    throw new Error("Job is no longer active");
  }

  if (!job.jobTag) {
    throw new Error("Job tags not found. Please try again later.");
  }

  // Validate user
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isActive) {
    throw new Error("User account is not active");
  }

  // Validate member profile
  if (!memberProfile) {
    throw new Error(
      "Member profile not found. Please complete your profile first."
    );
  }

  if (!memberProfile.isOpenToRefer) {
    // User has opted out of referrals, return empty nudges
    return {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      nudges: [],
      generatedAt: new Date().toISOString(),
    };
  }

  // Prepare input for nudge engine
  const nudgeInput: NudgeEngineInput = {
    jobTag: job.jobTag,
    memberProfile,
    jobTitle: job.title,
    jobCompany: job.company,
  };

  // Generate nudges
  const rawNudges = generateReferralNudges(nudgeInput);

  // Add message templates to each nudge
  const nudgesWithTemplates: NudgeWithTemplates[] = rawNudges.map((nudge) => ({
    ...nudge,
    messageTemplates: generateMessageTemplates(nudge, job.title, job.company),
  }));

  // Track event
  try {
    await trackNudgesShown(
      userId,
      jobId,
      nudgesWithTemplates.length,
      nudgesWithTemplates.map((n) => n.category)
    );
  } catch (error) {
    // Don't fail if event tracking fails
    console.error("Failed to track nudges shown event:", error);
  }

  return {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    nudges: nudgesWithTemplates,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// MESSAGE TEMPLATES
// ============================================

function generateMessageTemplates(
  nudge: ReferralNudge,
  jobTitle: string,
  company: string
): string[] {
  const templates: string[] = [];

  // Generic template for all nudges
  templates.push(
    `Hey! I saw a ${jobTitle} role at ${company} that might be a good fit. Would you be interested in learning more?`
  );

  // Category-specific templates
  switch (nudge.category) {
    case "skill_match":
      templates.push(
        `Quick question - are you or anyone you know looking for ${jobTitle} roles? I can refer at ${company}.`
      );
      templates.push(
        `I thought of you for this ${jobTitle} position at ${company}. Your ${nudge.matchedCriteria.slice(0, 2).join(" and ")} skills would be a great match!`
      );
      break;

    case "domain_match":
      const domain = nudge.matchedCriteria[0] || "tech";
      templates.push(
        `I know you're in the ${domain} space. ${company} is hiring for ${jobTitle} - thought of you!`
      );
      templates.push(
        `Given your experience in ${domain}, this ${jobTitle} role at ${company} might interest you.`
      );
      break;

    case "company_match":
      templates.push(
        `Given your background, this ${jobTitle} at ${company} seems aligned. Want me to put in a referral?`
      );
      templates.push(
        `Hey! Based on your experience, you might be a great fit for this ${jobTitle} role at ${company}.`
      );
      break;

    case "experience_match":
      templates.push(
        `${company} has a ${jobTitle} opening that matches your experience level. Interested?`
      );
      templates.push(
        `This ${jobTitle} position at ${company} seems perfect for where you are in your career. Want to hear more?`
      );
      break;

    case "seniority_match":
      templates.push(
        `${company} is looking for a ${jobTitle}. Given your experience, this could be a great opportunity!`
      );
      break;

    case "family_friends":
      templates.push(
        `Sharing in case it's helpful - there's a ${jobTitle} role at ${company}. Let me know if you'd like more details!`
      );
      templates.push(
        `Hey! I have a referral opportunity for a ${jobTitle} at ${company}. Know anyone who might be interested?`
      );
      break;

    case "community":
      templates.push(
        `Spotted a ${jobTitle} role at ${company} that might interest folks in our community. Happy to refer!`
      );
      break;

    case "general_network":
    default:
      templates.push(
        `Thought of you for this ${jobTitle} role at ${company}. Happy to refer if interested!`
      );
      templates.push(
        `${company} is hiring a ${jobTitle}. Let me know if you want me to put in a good word!`
      );
  }

  // Remove duplicates and return
  return [...new Set(templates)];
}

// ============================================
// TRACK MESSAGE COPY
// ============================================

export async function trackMessageCopy(
  userId: string,
  jobId: string,
  nudgeId: string,
  templateIndex: number
): Promise<void> {
  // Validate inputs
  if (!userId || userId.trim().length === 0) {
    throw new Error("User ID is required");
  }

  if (!jobId || jobId.trim().length === 0) {
    throw new Error("Job ID is required");
  }

  await trackMessageCopied(userId, jobId, `${nudgeId}:template-${templateIndex}`);
}

// ============================================
// GET NUDGE STATS
// ============================================

export async function getNudgeStats(jobId: string): Promise<{
  totalNudgesShown: number;
  messagesCopied: number;
  referralsStarted: number;
  conversionRate: number;
}> {
  if (!jobId || jobId.trim().length === 0) {
    throw new Error("Job ID is required");
  }

  // Verify job exists
  const jobExists = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true },
  });

  if (!jobExists) {
    throw new Error("Job not found");
  }

  const [nudgesShownEvents, messagesCopiedEvents, referralsStartedEvents] =
    await Promise.all([
      prisma.event.count({
        where: { jobId, type: "NUDGES_SHOWN" },
      }),
      prisma.event.count({
        where: { jobId, type: "MESSAGE_COPIED" },
      }),
      prisma.event.count({
        where: { jobId, type: "REFERRAL_STARTED" },
      }),
    ]);

  const conversionRate =
    nudgesShownEvents > 0 ? referralsStartedEvents / nudgesShownEvents : 0;

  return {
    totalNudgesShown: nudgesShownEvents,
    messagesCopied: messagesCopiedEvents,
    referralsStarted: referralsStartedEvents,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}

// ============================================
// GENAI MESSAGE VARIATIONS (Optional Extension)
// ============================================

export interface MessageVariation {
  message: string;
  tone: "professional" | "casual" | "friendly";
  length: "short" | "medium" | "long";
}

/**
 * Hook for GenAI-generated message variations.
 * This is NOT auto-executed - only called explicitly.
 * Always returns rule-based templates as fallback.
 */
export async function getMessageVariationsWithGenAI(
  _nudge: ReferralNudge,
  _jobTitle: string,
  _company: string,
  _useGenAI: boolean = false
): Promise<MessageVariation[]> {
  // TODO: Implement GenAI message generation when needed
  // This should:
  // 1. Generate personalized variations
  // 2. Never auto-send messages
  // 3. Always be human-editable
  // 4. Return fallback templates if GenAI fails

  // For now, return empty array (use standard templates)
  return [];
}