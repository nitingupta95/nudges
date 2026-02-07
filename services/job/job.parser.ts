 

// ============================================
// TYPES
// ============================================

 
export type ExperienceLevel = "INTERN" | "ENTRY" | "MID" | "SENIOR" | "STAFF" | "PRINCIPAL" | "EXECUTIVE";

export interface ParsedJobTags {
  skills: string[];
  experienceLevel: ExperienceLevel;
  domain: string;
  keywords: string[];
  minYearsExperience: number;
  maxYearsExperience: number;
  remoteType: "remote" | "hybrid" | "onsite" | "unknown";
  employmentType: "full-time" | "part-time" | "contract" | "internship" | "unknown";
  seniorityIndicators: string[];
  techStack: string[];
  softSkills: string[];
  companyType: string[];
  confidence: number; // 0-1 score indicating parsing confidence
}

export interface ParserOptions {
  useGenAI?: boolean; // Optional hook for future GenAI integration
  fallbackToRules?: boolean;
}

// ============================================
// SKILL DICTIONARIES
// ============================================

const PROGRAMMING_LANGUAGES = [
  "javascript", "typescript", "python", "java", "c#", "csharp", "c++", "cpp",
  "go", "golang", "rust", "ruby", "php", "swift", "kotlin", "scala", "r",
  "matlab", "perl", "haskell", "clojure", "elixir", "erlang", "dart", "lua",
  "objective-c", "assembly", "cobol", "fortran", "groovy", "julia",
];

const FRONTEND_SKILLS = [
  "react", "reactjs", "react.js", "vue", "vuejs", "vue.js", "angular",
  "angularjs", "svelte", "nextjs", "next.js", "nuxt", "nuxtjs", "gatsby",
  "html", "html5", "css", "css3", "sass", "scss", "less", "tailwind",
  "tailwindcss", "bootstrap", "material-ui", "mui", "chakra", "styled-components",
  "emotion", "redux", "mobx", "zustand", "recoil", "webpack", "vite", "parcel",
  "rollup", "babel", "eslint", "prettier", "storybook", "jest", "cypress",
  "playwright", "testing-library", "enzyme", "jquery", "backbone",
];

const BACKEND_SKILLS = [
  "node", "nodejs", "node.js", "express", "expressjs", "fastify", "koa",
  "nestjs", "nest.js", "django", "flask", "fastapi", "spring", "springboot",
  "spring boot", "rails", "ruby on rails", "laravel", "symfony", "asp.net",
  ".net", "dotnet", "gin", "echo", "fiber", "actix", "rocket", "phoenix",
  "ecto", "graphql", "rest", "restful", "api", "grpc", "websocket", "soap",
];

const DATABASE_SKILLS = [
  "postgresql", "postgres", "mysql", "mariadb", "mongodb", "mongo", "redis",
  "elasticsearch", "elastic", "cassandra", "dynamodb", "firestore", "sqlite",
  "oracle", "sql server", "mssql", "couchdb", "neo4j", "arangodb", "influxdb",
  "timescaledb", "cockroachdb", "supabase", "planetscale", "prisma", "typeorm",
  "sequelize", "mongoose", "knex", "drizzle", "sql", "nosql",
];

const CLOUD_DEVOPS_SKILLS = [
  "aws", "amazon web services", "gcp", "google cloud", "azure", "microsoft azure",
  "docker", "kubernetes", "k8s", "terraform", "ansible", "puppet", "chef",
  "jenkins", "gitlab ci", "github actions", "circleci", "travis", "bamboo",
  "argocd", "helm", "istio", "prometheus", "grafana", "datadog", "newrelic",
  "splunk", "elk", "cloudformation", "pulumi", "serverless", "lambda",
  "cloud functions", "fargate", "ecs", "eks", "gke", "aks", "heroku", "vercel",
  "netlify", "digitalocean", "linode", "cloudflare", "nginx", "apache",
];

const DATA_ML_SKILLS = [
  "machine learning", "ml", "deep learning", "dl", "tensorflow", "pytorch",
  "keras", "scikit-learn", "sklearn", "pandas", "numpy", "scipy", "matplotlib",
  "seaborn", "plotly", "jupyter", "notebook", "data science", "data analysis",
  "statistics", "nlp", "natural language processing", "computer vision", "cv",
  "llm", "large language model", "gpt", "bert", "transformer", "huggingface",
  "opencv", "spark", "pyspark", "hadoop", "hive", "airflow", "dbt", "looker",
  "tableau", "power bi", "superset", "metabase", "redshift", "bigquery",
  "snowflake", "databricks", "mlflow", "kubeflow", "sagemaker", "vertex ai",
];

const MOBILE_SKILLS = [
  "ios", "android", "react native", "flutter", "xamarin", "cordova", "ionic",
  "swiftui", "uikit", "jetpack compose", "kotlin multiplatform", "kmp",
  "expo", "capacitor", "nativescript", "pwa", "progressive web app",
];

const SOFT_SKILLS = [
  "communication", "leadership", "teamwork", "collaboration", "problem solving",
  "problem-solving", "critical thinking", "creativity", "adaptability",
  "time management", "project management", "agile", "scrum", "kanban",
  "mentoring", "mentorship", "presentation", "stakeholder management",
  "cross-functional", "self-motivated", "detail-oriented", "analytical",
];

// ============================================
// DOMAIN PATTERNS
// ============================================

const DOMAIN_PATTERNS: Record<string, string[]> = {
  fintech: [
    "fintech", "financial", "banking", "payments", "trading", "investment",
    "insurance", "insurtech", "lending", "credit", "debit", "transaction",
    "blockchain", "crypto", "cryptocurrency", "defi", "neobank", "wealth management",
  ],
  healthtech: [
    "healthtech", "healthcare", "medical", "health", "telemedicine", "telehealth",
    "clinical", "patient", "hospital", "pharmaceutical", "pharma", "biotech",
    "fitness", "wellness", "mental health", "ehr", "emr", "hipaa",
  ],
  edtech: [
    "edtech", "education", "learning", "e-learning", "elearning", "lms",
    "training", "course", "student", "teacher", "academic", "university",
    "school", "tutoring", "curriculum", "assessment",
  ],
  ecommerce: [
    "ecommerce", "e-commerce", "retail", "shopping", "marketplace", "commerce",
    "checkout", "cart", "inventory", "fulfillment", "logistics", "supply chain",
    "warehouse", "shipping", "product catalog",
  ],
  saas: [
    "saas", "b2b", "enterprise", "software", "platform", "subscription",
    "multi-tenant", "crm", "erp", "hrms", "workflow", "automation",
  ],
  gaming: [
    "gaming", "game", "video game", "esports", "unity", "unreal", "gamedev",
    "game development", "multiplayer", "mmo", "mobile game",
  ],
  media: [
    "media", "streaming", "content", "entertainment", "video", "audio",
    "music", "podcast", "news", "publishing", "social media", "creator",
  ],
  security: [
    "security", "cybersecurity", "infosec", "encryption", "authentication",
    "authorization", "identity", "iam", "sso", "oauth", "penetration testing",
    "vulnerability", "soc", "siem", "compliance",
  ],
  ai: [
    "artificial intelligence", "ai", "machine learning", "ml", "deep learning",
    "nlp", "computer vision", "generative ai", "genai", "llm", "gpt",
    "chatbot", "conversational ai", "recommendation", "prediction",
  ],
};

// ============================================
// EXPERIENCE LEVEL PATTERNS
// ============================================
 
const EXPERIENCE_PATTERNS: { level: ExperienceLevel; patterns: RegExp[]; yearsRange: [number, number] }[] = [
  {
    level: "INTERN",
    patterns: [
      /\bintern(ship)?\b/i,
      /\bstudent\b/i,
      /\btrainee\b/i,
      /\bapprentice\b/i,
      /\bentry[\s-]?level\b/i,
    ],
    yearsRange: [0, 0],
  },
  {
    level: "ENTRY",
    patterns: [
      /\bjunior\b/i,
      /\bjr\.?\b/i,
      /\bentry[\s-]?level\b/i,
      /\bgraduate\b/i,
      /\bfresh(er)?\b/i,
      /\b0[\s-]?[–-][\s-]?[12]\s*years?\b/i,
      /\b1[\s-]?[–-][\s-]?2\s*years?\b/i,
    ],
    yearsRange: [0, 2],
  },
  {
    level: "MID",
    patterns: [
      /\bmid[\s-]?(level|career)?\b/i,
      /\bintermediate\b/i,
      /\b[23][\s-]?[–-][\s-]?[56]\s*years?\b/i,
      /\b2\+\s*years?\b/i,
      /\b3\+\s*years?\b/i,
    ],
    yearsRange: [2, 5],
  },
  {
    level: "SENIOR",
    patterns: [
      /\bsenior\b/i,
      /\bsr\.?\b/i,
      /\b[5-7][\s-]?[–-][\s-]?[89]\s*years?\b/i,
      /\b5\+\s*years?\b/i,
      /\b6\+\s*years?\b/i,
      /\b7\+\s*years?\b/i,
    ],
    yearsRange: [5, 8],
  },
  {
    level: "STAFF",
    patterns: [
      /\bstaff\b/i,
      /\b8[\s-]?[–-][\s-]?1[02]\s*years?\b/i,
      /\b8\+\s*years?\b/i,
      /\b10\+\s*years?\b/i,
    ],
    yearsRange: [8, 12],
  },
  {
    level: "PRINCIPAL",
    patterns: [
      /\bprincipal\b/i,
      /\bdistinguished\b/i,
      /\bfellow\b/i,
      /\barchitect\b/i,
      /\b1[0-5]\+\s*years?\b/i,
    ],
    yearsRange: [12, 20],
  },
  {
    level: "EXECUTIVE",
    patterns: [
      /\b(c-level|c-suite)\b/i,
      /\b(cto|ceo|cfo|coo|cio|ciso)\b/i,
      /\b(vp|vice[\s-]?president)\b/i,
      /\bdirector\b/i,
      /\bhead\s+of\b/i,
      /\b(evp|svp)\b/i,
    ],
    yearsRange: [10, 30],
  },
];

// ============================================
// EMPLOYMENT TYPE PATTERNS
// ============================================

const EMPLOYMENT_PATTERNS = {
  "full-time": [/\bfull[\s-]?time\b/i, /\bpermanent\b/i, /\bfte\b/i],
  "part-time": [/\bpart[\s-]?time\b/i],
  contract: [/\bcontract(or)?\b/i, /\bfreelance\b/i, /\bconsultant\b/i, /\bc2c\b/i, /\b1099\b/i],
  internship: [/\bintern(ship)?\b/i, /\btrainee\b/i, /\bapprentice\b/i],
};

// ============================================
// REMOTE TYPE PATTERNS
// ============================================

const REMOTE_PATTERNS = {
  remote: [/\bremote\b/i, /\bwork[\s-]?from[\s-]?home\b/i, /\bwfh\b/i, /\bdistributed\b/i, /\bfully[\s-]?remote\b/i],
  hybrid: [/\bhybrid\b/i, /\bflexible[\s-]?location\b/i, /\b[23][\s-]?days?\s*(in[\s-]?office|onsite)\b/i],
  onsite: [/\bonsite\b/i, /\bon[\s-]?site\b/i, /\bin[\s-]?office\b/i, /\bin[\s-]?person\b/i],
};

// ============================================
// COMPANY TYPE PATTERNS
// ============================================

const COMPANY_TYPE_PATTERNS: Record<string, RegExp[]> = {
  startup: [/\bstartup\b/i, /\bearly[\s-]?stage\b/i, /\bseed\b/i, /\bseries[\s-]?[a-c]\b/i, /\bfounding\b/i],
  scaleup: [/\bscale[\s-]?up\b/i, /\bgrowth[\s-]?stage\b/i, /\bseries[\s-]?[d-f]\b/i],
  enterprise: [/\benterprise\b/i, /\bfortune[\s-]?\d+\b/i, /\blarge[\s-]?company\b/i, /\bcorporate\b/i],
  agency: [/\bagency\b/i, /\bconsultancy\b/i, /\bprofessional[\s-]?services\b/i],
  nonprofit: [/\bnon[\s-]?profit\b/i, /\bngo\b/i, /\bcharity\b/i, /\bfoundation\b/i],
};

// ============================================
// MAIN PARSER FUNCTION
// ============================================

/**
 * Parse a job description and extract structured tags
 * This is the main entry point for the parser
 */
export function parseJobDescription(
  title: string,
  description: string,
  _options: ParserOptions = {}
): ParsedJobTags {
  const fullText = `${title}\n${description}`.toLowerCase();
  const titleLower = title.toLowerCase();

  // Extract skills
  const skills = extractSkills(fullText);
  const techStack = extractTechStack(fullText);
  const softSkills = extractSoftSkills(fullText);

  // Extract experience level
  const { level: experienceLevel, minYears, maxYears } = extractExperienceLevel(titleLower, fullText);

  // Extract domain
  const domain = extractDomain(fullText);

  // Extract keywords
  const keywords = extractKeywords(fullText, skills);

  // Extract remote type
  const remoteType = extractRemoteType(fullText);

  // Extract employment type
  const employmentType = extractEmploymentType(fullText);

  // Extract seniority indicators
  const seniorityIndicators = extractSeniorityIndicators(titleLower, fullText);

  // Extract company type
  const companyType = extractCompanyType(fullText);

  // Calculate confidence score
  const confidence = calculateConfidence({
    skills,
    domain,
    experienceLevel,
    keywords,
  });

  return {
    skills,
    experienceLevel,
    domain,
    keywords,
    minYearsExperience: minYears,
    maxYearsExperience: maxYears,
    remoteType,
    employmentType,
    seniorityIndicators,
    techStack,
    softSkills,
    companyType,
    confidence,
  };
}

// ============================================
// EXTRACTION FUNCTIONS
// ============================================

function extractSkills(text: string): string[] {
  const allSkills = [
    ...PROGRAMMING_LANGUAGES,
    ...FRONTEND_SKILLS,
    ...BACKEND_SKILLS,
    ...DATABASE_SKILLS,
    ...CLOUD_DEVOPS_SKILLS,
    ...DATA_ML_SKILLS,
    ...MOBILE_SKILLS,
  ];

  const foundSkills = new Set<string>();

  for (const skill of allSkills) {
    // Create a regex that matches the skill as a whole word
    const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, "i");
    if (regex.test(text)) {
      // Normalize skill names
      foundSkills.add(normalizeSkillName(skill));
    }
  }

  return Array.from(foundSkills).sort();
}

function extractTechStack(text: string): string[] {
  const techSkills = [
    ...PROGRAMMING_LANGUAGES,
    ...FRONTEND_SKILLS,
    ...BACKEND_SKILLS,
    ...DATABASE_SKILLS,
    ...CLOUD_DEVOPS_SKILLS,
  ];

  const foundTech = new Set<string>();

  for (const tech of techSkills) {
    const regex = new RegExp(`\\b${escapeRegex(tech)}\\b`, "i");
    if (regex.test(text)) {
      foundTech.add(normalizeSkillName(tech));
    }
  }

  return Array.from(foundTech).sort();
}

function extractSoftSkills(text: string): string[] {
  const foundSoftSkills = new Set<string>();

  for (const skill of SOFT_SKILLS) {
    const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, "i");
    if (regex.test(text)) {
      foundSoftSkills.add(skill.toLowerCase());
    }
  }

  return Array.from(foundSoftSkills).sort();
}

function extractExperienceLevel(
  title: string,
  fullText: string
): { level: ExperienceLevel; minYears: number; maxYears: number } {
  // First check title for level indicators (higher priority)
  for (const { level, patterns, yearsRange } of EXPERIENCE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(title)) {
        return { level, minYears: yearsRange[0], maxYears: yearsRange[1] };
      }
    }
  }

  // Then check full text
  for (const { level, patterns, yearsRange } of EXPERIENCE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(fullText)) {
        return { level, minYears: yearsRange[0], maxYears: yearsRange[1] };
      }
    }
  }

  // Try to extract years directly
  const yearsMatch = fullText.match(/(\d+)\+?\s*(?:to|[-–])\s*(\d+)\s*years?/i);
  if (yearsMatch) {
    const minYears = parseInt(yearsMatch[1], 10);
    const maxYears = parseInt(yearsMatch[2], 10);
    const level = yearsToLevel(minYears);
    return { level, minYears, maxYears };
  }

  const singleYearsMatch = fullText.match(/(\d+)\+?\s*years?/i);
  if (singleYearsMatch) {
    const years = parseInt(singleYearsMatch[1], 10);
    const level = yearsToLevel(years);
    return { level, minYears: years, maxYears: years + 3 };
  }

  // Default to MID level
  return { level: "MID", minYears: 2, maxYears: 5 };
}

function extractDomain(text: string): string {
  const domainScores: Record<string, number> = {};

  for (const [domain, keywords] of Object.entries(DOMAIN_PATTERNS)) {
    let score = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
      if (regex.test(text)) {
        score++;
      }
    }
    if (score > 0) {
      domainScores[domain] = score;
    }
  }

  // Return domain with highest score
  let maxScore = 0;
  let bestDomain = "general";

  for (const [domain, score] of Object.entries(domainScores)) {
    if (score > maxScore) {
      maxScore = score;
      bestDomain = domain;
    }
  }

  return bestDomain;
}

function extractKeywords(text: string, existingSkills: string[]): string[] {
  // Extract important phrases that aren't already captured as skills
  const commonWords = new Set([
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
    "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
    "people", "into", "year", "your", "good", "some", "could", "them", "see",
    "other", "than", "then", "now", "look", "only", "come", "its", "over",
    "also", "back", "after", "use", "two", "how", "our", "work", "first",
    "well", "way", "even", "new", "want", "because", "any", "these", "give",
    "must", "should", "experience", "years", "required", "preferred", "ability",
    "strong", "excellent", "working", "team", "development", "build", "etc",
  ]);

  const skillSet = new Set(existingSkills.map((s) => s.toLowerCase()));

  // Extract words that appear multiple times and aren't common
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const wordCount: Record<string, number> = {};

  for (const word of words) {
    if (!commonWords.has(word) && !skillSet.has(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  }

  return Object.entries(wordCount)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

function extractRemoteType(text: string): ParsedJobTags["remoteType"] {
  for (const [type, patterns] of Object.entries(REMOTE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return type as ParsedJobTags["remoteType"];
      }
    }
  }
  return "unknown";
}

function extractEmploymentType(text: string): ParsedJobTags["employmentType"] {
  for (const [type, patterns] of Object.entries(EMPLOYMENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return type as ParsedJobTags["employmentType"];
      }
    }
  }
  return "unknown";
}

function extractSeniorityIndicators(title: string, fullText: string): string[] {
  const indicators: string[] = [];

  const indicatorPatterns: Record<string, RegExp> = {
    "team lead": /\b(team\s*lead|tech\s*lead|engineering\s*lead)\b/i,
    "management": /\b(manage|managing|manager|management)\b/i,
    "mentorship": /\b(mentor|mentoring|mentorship|coach)\b/i,
    "architecture": /\b(architect|architecture|system\s*design)\b/i,
    "founding team": /\b(founding|first\s*engineer|employee\s*#?\d)\b/i,
    "ic track": /\b(individual\s*contributor|ic\s*track|hands[\s-]*on)\b/i,
    "player-coach": /\b(player[\s-]*coach|coding\s*manager)\b/i,
  };

  for (const [indicator, pattern] of Object.entries(indicatorPatterns)) {
    if (pattern.test(title) || pattern.test(fullText)) {
      indicators.push(indicator);
    }
  }

  return indicators;
}

function extractCompanyType(text: string): string[] {
  const types: string[] = [];

  for (const [type, patterns] of Object.entries(COMPANY_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        types.push(type);
        break;
      }
    }
  }

  return types;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function yearsToLevel(years: number): ExperienceLevel {
  if (years <= 0) return "INTERN";
  if (years <= 2) return "ENTRY";
  if (years <= 5) return "MID";
  if (years <= 8) return "SENIOR";
  if (years <= 12) return "STAFF";
  if (years <= 15) return "PRINCIPAL";
  return "EXECUTIVE";
}

function normalizeSkillName(skill: string): string {
  const normalizations: Record<string, string> = {
    "reactjs": "react",
    "react.js": "react",
    "vuejs": "vue",
    "vue.js": "vue",
    "angularjs": "angular",
    "nodejs": "node.js",
    "node": "node.js",
    "expressjs": "express",
    "nextjs": "next.js",
    "nuxtjs": "nuxt.js",
    "postgres": "postgresql",
    "mongo": "mongodb",
    "csharp": "c#",
    "golang": "go",
    "cpp": "c++",
    "k8s": "kubernetes",
    "amazon web services": "aws",
    "google cloud": "gcp",
    "microsoft azure": "azure",
  };

  const lower = skill.toLowerCase();
  return normalizations[lower] || lower;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function calculateConfidence(data: {
  skills: string[];
  domain: string;
  experienceLevel: ExperienceLevel;
  keywords: string[];
}): number {
  let confidence = 0.5; // Base confidence

  // More skills = higher confidence
  if (data.skills.length >= 5) confidence += 0.2;
  else if (data.skills.length >= 3) confidence += 0.1;

  // Non-general domain = higher confidence
  if (data.domain !== "general") confidence += 0.15;

  // Keywords found = higher confidence
  if (data.keywords.length >= 5) confidence += 0.1;

  // Cap at 0.95 since rule-based parsing can never be 100% confident
  return Math.min(confidence, 0.95);
}

// ============================================
// GENAI HOOKS (OPTIONAL - NOT AUTO-EXECUTED)
// ============================================

/**
 * Optional hook for GenAI-based parsing
 * This is NOT auto-executed - must be explicitly called
 * Always falls back to rule-based parsing
 */
export async function parseJobDescriptionWithAI(
  title: string,
  description: string,
  _aiProvider?: string
): Promise<ParsedJobTags | null> {
  // Placeholder for future GenAI integration
  // IMPORTANT: This should:
  // 1. Never auto-execute
  // 2. Always have human review capability
  // 3. Fall back to rule-based parsing on failure
  // 4. Log all AI-generated content for audit

  console.log("[AI Parser] GenAI parsing not implemented - using rule-based fallback");

  // Always return null to trigger rule-based fallback
  return null;
}

/**
 * Validate and enhance AI-parsed tags with rule-based checks
 * Ensures AI output is sensible and complete
 */
export function validateAndEnhanceAIParsedTags(
  aiTags: Partial<ParsedJobTags>,
  title: string,
  description: string
): ParsedJobTags {
  // Start with rule-based parsing
  const ruleBased = parseJobDescription(title, description);

  // Merge AI suggestions with rule-based results, preferring rule-based for critical fields
  return {
    ...ruleBased,
    // AI can suggest additional skills we might have missed
    skills: [...new Set([...ruleBased.skills, ...(aiTags.skills || [])])],
    // AI can suggest additional keywords
    keywords: [...new Set([...ruleBased.keywords, ...(aiTags.keywords || [])])],
    // Keep rule-based for critical fields
    experienceLevel: ruleBased.experienceLevel,
    domain: aiTags.domain && aiTags.domain !== "general" ? aiTags.domain : ruleBased.domain,
    // Lower confidence if using AI
    confidence: Math.min(ruleBased.confidence, 0.8),
  };
}