export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  type?: string;
}

export interface Job {
  id: string;
  title: string;
  company: Company | string; // Can be Company object or string
  location?: string;
  postedAt: string;
  closingDate?: string; // Changed from closingAt to match schema
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  skills?: string[];
  domains?: string[];
  experienceLevel?: "junior" | "mid" | "senior";
  domain?: string;
  aiSummary?: JobSummary;
}

export interface JobSummary {
  bullets: string[];
  source: "ai" | "static";
  generatedAt: string;
}

export interface MemberProfile {
  id: string;
  userId: string;
  skills: string[];
  pastCompanies: string[];
  domains: string[];
  experienceLevel: "junior" | "mid" | "senior";
  yearsOfExperience: number;
  currentCompany?: string;
  currentTitle?: string;
  location?: string;
  preferredDomains: string[];
  preferredRoles: string[];
  isOpenToRefer: boolean;
}

export interface ReferralNudgeResponse {
  nudges: string[];
  explain?: string;
}

export type ReferralStatus =
  | "pending"
  | "viewed"
  | "shortlisted"
  | "hired"
  | "rejected";

export type RelationType =
  | "friend"
  | "ex-colleague"
  | "relative"
  | "other";

export interface ReferralSubmission {
  id: string;
  jobId: string;
  jobTitle?: string;
  companyName?: string;
  candidateName?: string;
  candidateProfileUrl?: string;
  relation: RelationType;
  note?: string;
  status: ReferralStatus;
  createdAt: string;
  createdBy: string;
  activity?: ActivityEntry[];
}

export interface ActivityEntry {
  timestamp: string;
  action: string;
}

export interface UserProfile {
  skills: string[];
  pastCompanies: string[];
  domains?: string[];
  experienceLevel?: "junior" | "mid" | "senior";
  yearsOfExperience?: number;
  experienceYears?: number; // Deprecated, use yearsOfExperience
  preferences?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  memberProfile: UserProfile;
}

export interface JobFilters {
  domain?: string;
  experienceLevel?: string;
  location?: string;
  closingSoon?: boolean;
  goodFit?: boolean;
  search?: string;
}

export interface MessageTemplate {
  id: string;
  label: string;
  tone: string;
  body: string;
}
