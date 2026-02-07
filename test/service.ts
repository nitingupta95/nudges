import { prisma } from "@/lib/prisma";
import {
  Referral,
  ReferralStatus,
  RelationType,
  Prisma,
} from "@/lib/generated/prisma";
import {
  trackReferralStarted,
  trackReferralSubmitted,
  trackReferralStatusChanged,
} from "../events/event.service";

// ============================================
// TYPES
// ============================================

export interface CreateReferralInput {
  jobId: string;
  referrerId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateLinkedIn?: string;
  candidateResume?: string;
  relationType: RelationType;
  relationshipNote?: string;
  howLongKnown?: string;
  workedTogether?: boolean;
  referralNote?: string;
  whyGoodFit?: string;
}

export interface UpdateReferralInput {
  candidateName?: string;
  candidatePhone?: string;
  candidateLinkedIn?: string;
  candidateResume?: string;
  relationshipNote?: string;
  howLongKnown?: string;
  workedTogether?: boolean;
  referralNote?: string;
  whyGoodFit?: string;
}

export interface UpdateReferralStatusInput {
  referralId: string;
  status: ReferralStatus;
  note?: string;
  updatedById: string;
}

export interface ReferralFilters {
  referrerId?: string;
  jobId?: string;
  status?: ReferralStatus;
  relationType?: RelationType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ReferralWithDetails extends Referral {
  job: {
    id: string;
    title: string;
    company: string;
    isActive: boolean;
  };
  referrer: {
    id: string;
    name: string;
    email: string;
  };
}

// ============================================
// VALIDATION
// ============================================

const VALID_RELATION_TYPES: RelationType[] = [
  "FRIEND",
  "EX_COLLEAGUE",
  "RELATIVE",
  "CLASSMATE",
  "MENTOR",
  "MENTEE",
  "OTHER",
];

const VALID_STATUSES: ReferralStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "INTERVIEWING",
  "OFFERED",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
];

// Valid status transitions
const STATUS_TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  DRAFT: ["SUBMITTED", "WITHDRAWN"],
  SUBMITTED: ["UNDER_REVIEW", "REJECTED", "WITHDRAWN"],
  UNDER_REVIEW: ["INTERVIEWING", "REJECTED", "WITHDRAWN"],
  INTERVIEWING: ["OFFERED", "REJECTED", "WITHDRAWN"],
  OFFERED: ["HIRED", "REJECTED", "WITHDRAWN"],
  HIRED: [], // Terminal state
  REJECTED: [], // Terminal state
  WITHDRAWN: [], // Terminal state
};

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
  // Basic phone validation (allows various formats)
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

function validateLinkedIn(url: string): boolean {
  const linkedInRegex =
    /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w\-]+\/?$/i;
  return linkedInRegex.test(url);
}

function validateCreateInput(input: CreateReferralInput): string[] {
  const errors: string[] = [];

  // Required fields
  if (!input.jobId || input.jobId.trim().length === 0) {
    errors.push("Job ID is required");
  }

  if (!input.referrerId || input.referrerId.trim().length === 0) {
    errors.push("Referrer ID is required");
  }

  if (!input.candidateName || input.candidateName.trim().length === 0) {
    errors.push("Candidate name is required");
  } else if (input.candidateName.length > 200) {
    errors.push("Candidate name is too long (max 200 characters)");
  }

  if (!input.candidateEmail || input.candidateEmail.trim().length === 0) {
    errors.push("Candidate email is required");
  } else if (!validateEmail(input.candidateEmail)) {
    errors.push("Invalid candidate email format");
  }

  if (!input.relationType) {
    errors.push("Relation type is required");
  } else if (!VALID_RELATION_TYPES.includes(input.relationType)) {
    errors.push("Invalid relation type");
  }

  // Optional field validations
  if (input.candidatePhone && !validatePhone(input.candidatePhone)) {
    errors.push("Invalid phone number format");
  }

  if (input.candidateLinkedIn && !validateLinkedIn(input.candidateLinkedIn)) {
    errors.push("Invalid LinkedIn URL format");
  }

  if (input.relationshipNote// filepath: /Users/nitingupta/Documents/Projects/sumit/nudges/services/referrals/refe…