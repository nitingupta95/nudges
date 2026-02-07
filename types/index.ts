export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  type?: string;
}

export interface Job {
  id: string;
  title: string;
  company: Company;
  location?: string;
  postedAt: string;
  closingAt?: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  skills?: string[];
  experienceLevel?: "junior" | "mid" | "senior";
  domain?: string;
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
  experienceYears?: number;
  preferences?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  profile: UserProfile;
}

export interface JobFilters {
  domain?: string;
  experienceLevel?: string;
  location?: string;
  closingSoon?: boolean;
  search?: string;
}

export interface MessageTemplate {
  id: string;
  label: string;
  tone: string;
  body: string;
}
