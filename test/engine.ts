import { JobTag, MemberProfile, ExperienceLevel } from "@/lib/generated/prisma";

// ============================================
// TYPES
// ============================================

export interface ReferralNudge {
  id: string;
  category: NudgeCategory;
  message: string;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  matchedCriteria: string[];
  priority: number;
}

export type NudgeCategory =
  | "skill_match"
  | "domain_match"
  | "company_match"
  | "experience_match"
  | "seniority_match"
  | "general_network"
  | "family_friends"
  | "community";

export interface NudgeEngineInput {
  jobTag: JobTag;
  memberProfile: MemberProfile;
  jobTitle: string;
  jobCompany: string;
}

export interface NudgeRule {
  id: string;
  category: NudgeCategory;
  priority: number;
  condition: (input: NudgeEngineInput) => boolean;
  generateMessage: (input: NudgeEngineInput) => string;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  getMatchedCriteria: (input: NudgeEngineInput) => string[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSkillOverlap(jobSkills: string[], memberSkills: string[]): string[] {
  const memberSkillsSet = new Set(memberSkills.map((s) => s.toLowerCase()));
  return jobSkills.filter((s) => memberSkillsSet.has(s.toLowerCase()));
}

function getDomainOverlap(
  jobDomains: string[],
  memberDomains: string[]
): string[] {
  const memberDomainsSet = new Set(memberDomains.map((d) => d.toLowerCase()));
  return jobDomains.filter((d) => memberDomainsSet.has(d.toLowerCase()));
}

function formatSkillList(skills: string[], maxItems: number = 3): string {
  const formatted = skills.slice(0, maxItems).map(formatSkillName);
  if (skills.length > maxItems) {
    return `${formatted.join(", ")} and more`;
  }
  return formatted.join(skills.length === 2 ? " and " : ", ");
}

function formatSkillName(skill: string): string {
  const skillNames: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    java: "Java",
    golang: "Go",
    react: "React",
    vue: "Vue.js",
    angular: "Angular",
    nodejs: "Node.js",
    nextjs: "Next.js",
    postgresql: "PostgreSQL",
    mongodb: "MongoDB",
    redis: "Redis",
    aws: "AWS",
    gcp: "Google Cloud",
    azure: "Azure",
    docker: "Docker",
    kubernetes: "Kubernetes",
    machinelearning: "Machine Learning",
    graphql: "GraphQL",
  };

  return skillNames[skill.toLowerCase()] || skill;
}

function formatDomainName(domain: string): string {
  const domainNames: Record<string, string> = {
    fintech: "fintech",
    healthtech: "healthtech",
    edtech: "edtech",
    ecommerce: "e-commerce",
    saas: "SaaS",
    consumer: "consumer tech",
    gaming: "gaming",
    media: "media/entertainment",
    cybersecurity: "cybersecurity",
    ai: "AI/ML",
    devtools: "developer tools",
    logistics: "logistics",
    proptech: "real estate tech",
    insurtech: "insurtech",
    legaltech: "legal tech",
    hrtech: "HR tech",
    cleantech: "climate tech",
  };

  return domainNames[domain.toLowerCase()] || domain;
}

function getExperienceLevelIndex(level: ExperienceLevel): number {
  const levels: ExperienceLevel[] = [
    "INTERN",
    "ENTRY",
    "MID",
    "SENIOR",
    "STAFF",
    "PRINCIPAL",
    "EXECUTIVE",
  ];
  return levels.indexOf(level);
}

function isExperienceClose(
  jobLevel: ExperienceLevel,
  memberLevel: ExperienceLevel,
  tolerance: number = 1
): boolean {
  const jobIndex = getExperienceLevelIndex(jobLevel);
  const memberIndex = getExperienceLevelIndex(memberLevel);
  return Math.abs(jobIndex - memberIndex) <= tolerance;
}

function getExperienceDescription(level: ExperienceLevel): string {
  const descriptions: Record<ExperienceLevel, string> = {
    INTERN: "interns or students",
    ENTRY: "early-career professionals",
    MID: "mid-level engineers",
    SENIOR: "senior engineers",
    STAFF: "staff-level engineers",
    PRINCIPAL: "principal or architect-level engineers",
    EXECUTIVE: "engineering leaders",
  };
  return descriptions[level];
}

// ============================================
// NUDGE RULES DEFINITION
// ============================================

const NUDGE_RULES: NudgeRule[] = [
  // HIGH CONFIDENCE - Skill Match Rules
  {
    id: "skill-strong-match",
    category: "skill_match",
    priority: 100,
    condition: ({ jobTag, memberProfile }) => {
      const overlap = getSkillOverlap(jobTag.skills, memberProfile.skills);
      return overlap.length >= 3;
    },
    generateMessage: ({ jobTag, memberProfile }) => {
      const overlap = getSkillOverlap(jobTag.skills, memberProfile.skills);
      return `People you've worked with on ${formatSkillList(overlap)}`;
    },
    reasoning:
      "Member has strong skill overlap, very likely knows others with similar skills",
    confidence: "high",
    getMatchedCriteria: ({ jobTag, memberProfile }) =>
      getSkillOverlap(jobTag.skills, memberProfile.skills),
  },
  {
    id: "skill-moderate-match",
    category: "skill_match",
    priority: 80,
    condition: ({ jobTag, memberProfile }) => {
      const overlap = getSkillOverlap(jobTag.skills, memberProfile.skills);
      return overlap.length >= 1 && overlap.length < 3;
    },
    generateMessage: ({ jobTag, memberProfile }) => {
      const overlap = getSkillOverlap(jobTag.skills, memberProfile.skills);
      return `Tech friends who also know ${formatSkillList(overlap)}`;
    },
    reasoning: "Some skill overlap suggests adjacent network",
    confidence: "medium",
    getMatchedCriteria: ({ jobTag, memberProfile }) =>
      getSkillOverlap(jobTag.skills, memberProfile.skills),
  },

  // HIGH CONFIDENCE - Domain Match Rules
  {
    id: "domain-direct-match",
    category: "domain_match",
    priority: 90,
    condition: ({ jobTag, memberProfile }) => {
      const overlap = getDomainOverlap(jobTag.domains, memberProfile.domains);
      return overlap.length >= 1;
    },
    generateMessage: ({ jobTag, memberProfile }) => {
      const overlap = getDomainOverlap(jobTag.domains, memberProfile.domains);
      const domain = formatDomainName(overlap[0]);
      return `Ex-colleagues from ${domain} companies`;
    },
    reasoning: "Member has direct domain experience, knows people in the space",
    confidence: "high",
    getMatchedCriteria: ({ jobTag, memberProfile }) =>
      getDomainOverlap(jobTag.domains, memberProfile.domains),
  },
  {
    id: "domain-preferred-match",
    category: "domain_match",
    priority: 70,
    condition: ({ jobTag, memberProfile }) => {
      const directOverlap = getDomainOverlap(
        jobTag.domains,
        memberProfile.domains
      );
      const preferredOverlap = getDomainOverlap(
        jobTag.domains,
        memberProfile.preferredDomains
      );
      return directOverlap.length === 0 && preferredOverlap.length >= 1;
    },
    generateMessage: ({ jobTag, memberProfile }) => {
      const overlap = getDomainOverlap(
        jobTag.domains,
        memberProfile.preferredDomains
      );
      const domain = formatDomainName(overlap[0]);
      return `Friends interested in ${domain}`;
    },
    reasoning: "Member is interested in domain, may know aspiring folks",
    confidence: "medium",
    getMatchedCriteria: ({ jobTag, memberProfile }) =>
      getDomainOverlap(jobTag.domains, memberProfile.preferredDomains),
  },

  // COMPANY-BASED RULES
  {
    id: "company-past-saas",
    category: "company_match",
    priority: 75,
    condition: ({ jobTag, memberProfile }) =>
      jobTag.domains.includes("saas") && memberProfile.pastCompanies.length > 0,
    generateMessage: ({ memberProfile }) => {
      const company = memberProfile.pastCompanies[0];
      return `Former ${company} colleagues interested in B2B roles`;
    },
    reasoning: "SaaS experience is transferable, past colleagues may be looking",
    confidence: "medium",
    getMatchedCriteria: ({ memberProfile }) =>
      memberProfile.pastCompanies.slice(0, 2),
  },
  {
    id: "company-current-network",
    category: "company_match",
    priority: 65,
    condition: ({ memberProfile }) =>
      memberProfile.currentCompany !== null &&
      memberProfile.currentCompany.length > 0,
    generateMessage: ({ memberProfile }) =>
      `Current or former colleagues from ${memberProfile.currentCompany}`,
    reasoning: "Current company network is active and accessible",
    confidence: "medium",
    getMatchedCriteria: ({ memberProfile }) =>
      memberProfile.currentCompany ? [memberProfile.currentCompany] : [],
  },

  // EXPERIENCE LEVEL RULES
  {
    id: "experience-exact-match",
    category: "experience_match",
    priority: 85,
    condition: ({ jobTag, memberProfile }) =>
      jobTag.experienceLevel === memberProfile.experienceLevel,
    generateMessage: ({ jobTag }) => {
      const desc = getExperienceDescription(jobTag.experienceLevel);
      return `${desc.charAt(0).toUpperCase() + desc.slice(1)} in your professional circle`;
    },
    reasoning: "Same experience level suggests peer network",
    confidence: "high",
    getMatchedCriteria: ({ jobTag }) => [jobTag.experienceLevel],
  },
  {
    id: "experience-adjacent",
    category: "experience_match",
    priority: 60,
    condition: ({ jobTag, memberProfile }) =>
      isExperienceClose(jobTag.experienceLevel, memberProfile.experienceLevel) &&
      jobTag.experienceLevel !== memberProfile.experienceLevel,
    generateMessage: ({ jobTag }) => {
      const desc = getExperienceDescription(jobTag.experienceLevel);
      return `${desc.charAt(0).toUpperCase() + desc.slice(1)} you've mentored or worked with`;
    },
    reasoning: "Adjacent experience levels often have mentorship relationships",
    confidence: "medium",
    getMatchedCriteria: ({ jobTag }) => [jobTag.experienceLevel],
  },

  // ENTRY-LEVEL SPECIFIC
  {
    id: "entry-level-bootcamp",
    category: "experience_match",
    priority: 55,
    condition: ({ jobTag }) =>
      jobTag.experienceLevel === "ENTRY" || jobTag.experienceLevel === "INTERN",
    generateMessage: () => `Recent grads or bootcamp alumni you know`,
    reasoning: "Entry-level roles suit newer professionals",
    confidence: "medium",
    getMatchedCriteria: ({ jobTag }) => [jobTag.experienceLevel, "bootcamp"],
  },

  // SENIORITY-BASED RULES
  {
    id: "seniority-leadership",
    category: "seniority_match",
    priority: 75,
    condition: ({ jobTag }) =>
      jobTag.seniorityTerms.some((term) =>
        ["leadership", "management", "tech lead", "team lead"].includes(
          term.toLowerCase()
        )
      ),
    generateMessage: () => `Tech leaders or managers you've worked with`,
    reasoning: "Leadership roles need specific referrals from leadership network",
    confidence: "medium",
    getMatchedCriteria: ({ jobTag }) => jobTag.seniorityTerms,
  },
  {
    id: "seniority-founding",
    category: "seniority_match",
    priority: 70,
    condition: ({ jobTag }) =>
      jobTag.seniorityTerms.some((term) =>
        ["founding team", "early stage"].includes(term.toLowerCase())
      ),
    generateMessage: () => `Friends who've done early-stage startups before`,
    reasoning: "Startup experience suggests startup network",
    confidence: "medium",
    getMatchedCriteria: () => ["early-stage", "startup"],
  },
  {
    id: "seniority-ic",
    category: "seniority_match",
    priority: 50,
    condition: ({ jobTag }) =>
      jobTag.seniorityTerms.some((term) =>
        ["individual contributor", "ic track", "hands-on"].includes(
          term.toLowerCase()
        )
      ),
    generateMessage: () => `Individual contributors who want to stay hands-on`,
    reasoning: "IC track appeals to specific career preferences",
    confidence: "medium",
    getMatchedCriteria: () => ["IC", "hands-on"],
  },

  // GENERAL NETWORK RULES
  {
    id: "general-tech-friends",
    category: "general_network",
    priority: 40,
    condition: ({ memberProfile }) => memberProfile.skills.length > 0,
    generateMessage: () => `Tech friends currently exploring new opportunities`,
    reasoning: "General nudge for anyone with tech background",
    confidence: "low",
    getMatchedCriteria: () => ["general"],
  },
  {
    id: "general-community",
    category: "community",
    priority: 35,
    condition: () => true,
    generateMessage: () => `People from tech communities or meetups you attend`,
    reasoning: "Community connections are valid referral sources",
    confidence: "low",
    getMatchedCriteria: () => ["community"],
  },
  {
    id: "general-linkedin",
    category: "general_network",
    priority: 30,
    condition: () => true,
    generateMessage: () => `LinkedIn connections who might be a good fit`,
    reasoning: "Professional network is a valid referral source",
    confidence: "low",
    getMatchedCriteria: () => ["linkedin"],
  },

  // FAMILY & FRIENDS RULES
  {
    id: "family-early-career",
    category: "family_friends",
    priority: 25,
    condition: ({ jobTag }) =>
      jobTag.experienceLevel === "ENTRY" || jobTag.experienceLevel === "INTERN",
    generateMessage: () =>
      `Relatives or close family members early in their tech career`,
    reasoning: "Entry roles are good for family referrals",
    confidence: "low",
    getMatchedCriteria: () => ["family", "early-career"],
  },
  {
    id: "family-career-change",
    category: "family_friends",
    priority: 20,
    condition: () => true,
    generateMessage: () => `Friends considering a career change into tech`,
    reasoning: "Career changers benefit from referrals",
    confidence: "low",
    getMatchedCriteria: () => ["career-change"],
  },
];

// ============================================
// MAIN NUDGE GENERATION FUNCTION
// ============================================

export function generateReferralNudges(input: NudgeEngineInput): ReferralNudge[] {
  // Validate input
  if (!input.jobTag) {
    throw new Error("Job tags are required for nudge generation");
  }

  if (!input.memberProfile) {
    throw new Error("Member profile is required for nudge generation");
  }

  const nudges: ReferralNudge[] = [];
  const usedCategories = new Set<NudgeCategory>();

  // Sort rules by priority (highest first)
  const sortedRules = [...NUDGE_RULES].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    // Skip if we already have a high-confidence nudge in this category
    if (usedCategories.has(rule.category) && rule.confidence !== "high") {
      continue;
    }

    try {
      if (rule.condition(input)) {
        const nudge: ReferralNudge = {
          id: rule.id,
          category: rule.category,
          message: rule.generateMessage(input),
          reasoning: rule.reasoning,
          confidence: rule.confidence,
          matchedCriteria: rule.getMatchedCriteria(input),
          priority: rule.priority,
        };

        nudges.push(nudge);

        // Mark category as used for high confidence nudges
        if (rule.confidence === "high") {
          usedCategories.add(rule.category);
        }
      }
    } catch (error) {
      // Log error but continue processing other rules
      console.error(`Error processing nudge rule ${rule.id}:`, error);
    }
  }

  // Sort by priority and limit results
  nudges.sort((a, b) => b.priority - a.priority);

  // Return top 6 nudges with at least one from each confidence level if possible
  return selectBalancedNudges(nudges, 6);
}

function selectBalancedNudges(
  nudges: ReferralNudge[],
  maxCount: number
): ReferralNudge[] {
  const highConfidence = nudges.filter((n) => n.confidence === "high");
  const mediumConfidence = nudges.filter((n) => n.confidence === "medium");
  const lowConfidence = nudges.filter((n) => n.confidence === "low");

  const selected: ReferralNudge[] = [];

  // Add all high confidence nudges (up to 3)
  selected.push(...highConfidence.slice(0, 3));

  // Add medium confidence nudges (up to 2)
  selected.push(...mediumConfidence.slice(0, 2));

  // Fill remaining with low confidence if needed
  const remaining = maxCount - selected.length;
  if (remaining > 0) {
    selected.push(...lowConfidence.slice(0, remaining));
  }

  return selected.slice(0, maxCount);
}

// ============================================
// GENAI EXTENSION POINT (Optional)
// ============================================

export interface GenAINudgeEnhancement {
  enhancedMessage: string;
  alternativeMessages: string[];
  explanation: string;
}

/**
 * Hook for GenAI-enhanced nudge explanations.
 * This is NOT auto-executed - only called explicitly.
 * Always has rule-based fallback.
 */
export async function enhanceNudgeWithGenAI(
  _nudge: ReferralNudge,
  _input: NudgeEngineInput,
  _apiKey?: string
): Promise<GenAINudgeEnhancement | null> {
  // TODO: Implement GenAI enhancement when needed
  // This should:
  // 1. Generate more personalized message variations
  // 2. Provide better explanations
  // 3. Never guess specific people
  // 4. Always be human-editable
  return null;
}