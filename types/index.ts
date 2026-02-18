export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  type?: string;
}

export interface JobTags {
  skills?: string[];
  domains?: string[];
  keywords?: string[];
  techStack?: string[];
  softSkills?: string[];
  seniorityTerms?: string[];
  experienceLevel?: string;
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
  experienceLevel?: "INTERN" | "ENTRY" | "MID" | "SENIOR" | "STAFF" | "PRINCIPAL" | "EXECUTIVE" | "junior" | "mid" | "senior";
  domain?: string;
  aiSummary?: JobSummary;
  // Additional fields from database
  isRemote?: boolean;
  isActive?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  viewCount?: number;
  referralCount?: number;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: JobTags;
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
  experienceLevel: string;
  yearsOfExperience: number;
  currentCompany?: string;
  currentTitle?: string;
  location?: string;
  preferredDomains: string[];
  preferredRoles: string[];
  isOpenToRefer: boolean;
  profileCompleteness?: number;
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
  | "EX_COLLEAGUE"
  | "COLLEGE_ALUMNI"
  | "FRIEND"
  | "FAMILY"
  | "BOOTCAMP_CONNECTION"
  | "LINKEDIN_CONNECTION"
  | "RELATIVE"
  | "CLASSMATE"
  | "MENTOR"
  | "MENTEE"
  | "OTHER";

export interface ReferralSubmission {
  id: string;
  jobId: string;
  jobTitle?: string;
  companyName?: string;
  candidateName?: string;
  candidateProfileUrl?: string;
  relationType: RelationType;
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
  skills?: string[];
  limit?: number;
  offset?: number;
}

export interface MessageTemplate {
  id: string;
  label: string;
  tone: string;
  body: string;
}
