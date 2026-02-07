import { ExperienceLevel } from "@/lib/generated/prisma";

// ============================================
// TYPES
// ============================================

export interface ParsedJobTags {
  skills: string[];
  domains: string[];
  keywords: string[];
  experienceLevel: ExperienceLevel;
  seniorityTerms: string[];
  techStack: string[];
  benefits: string[];
  confidence: number; // 0-1 confidence score
}

export interface ParserOptions {
  useGenAI?: boolean;
  minConfidence?: number;
}

// ============================================
// SKILL DICTIONARY
// ============================================

const SKILL_PATTERNS: Record<string, RegExp[]> = {
  // Programming Languages
  javascript: [/\bjavascript\b/i, /\bjs\b/i, /\bes6\+?\b/i],
  typescript: [/\btypescript\b/i, /\bts\b/i],
  python: [/\bpython\b/i, /\bpy3?\b/i],
  java: [/\bjava\b(?!\s*script)/i],
  csharp: [/\bc#\b/i, /\bcsharp\b/i, /\b\.net\b/i],
  golang: [/\bgo\b(?:lang)?\b/i, /\bgolang\b/i],
  rust: [/\brust\b/i],
  ruby: [/\bruby\b/i],
  php: [/\bphp\b/i],
  swift: [/\bswift\b/i],
  kotlin: [/\bkotlin\b/i],
  scala: [/\bscala\b/i],
  cpp: [/\bc\+\+\b/i, /\bcpp\b/i],
  c: [/\bc\b(?!\+\+|#)/i],

  // Frontend
  react: [/\breact\b/i, /\breactjs\b/i, /\breact\.js\b/i],
  vue: [/\bvue\b/i, /\bvuejs\b/i, /\bvue\.js\b/i],
  angular: [/\bangular\b/i, /\bangularjs\b/i],
  svelte: [/\bsvelte\b/i],
  nextjs: [/\bnext\.?js\b/i, /\bnextjs\b/i],
  nuxt: [/\bnuxt\b/i],
  html: [/\bhtml5?\b/i],
  css: [/\bcss3?\b/i, /\bscss\b/i, /\bsass\b/i, /\bless\b/i],
  tailwind: [/\btailwind\b/i, /\btailwindcss\b/i],

  // Backend
  nodejs: [/\bnode\.?js\b/i, /\bnodejs\b/i],
  express: [/\bexpress\b/i, /\bexpress\.js\b/i],
  fastapi: [/\bfastapi\b/i],
  django: [/\bdjango\b/i],
  flask: [/\bflask\b/i],
  rails: [/\brails\b/i, /\bruby on rails\b/i],
  spring: [/\bspring\b/i, /\bspring\s*boot\b/i],
  nestjs: [/\bnestjs\b/i, /\bnest\.js\b/i],

  // Databases
  postgresql: [/\bpostgres(?:ql)?\b/i],
  mysql: [/\bmysql\b/i],
  mongodb: [/\bmongo(?:db)?\b/i],
  redis: [/\bredis\b/i],
  elasticsearch: [/\belastic(?:search)?\b/i],
  dynamodb: [/\bdynamodb\b/i],
  cassandra: [/\bcassandra\b/i],
  sqlite: [/\bsqlite\b/i],

  // Cloud & DevOps
  aws: [/\baws\b/i, /\bamazon web services\b/i],
  gcp: [/\bgcp\b/i, /\bgoogle cloud\b/i],
  azure: [/\bazure\b/i, /\bmicrosoft azure\b/i],
  docker: [/\bdocker\b/i],
  kubernetes: [/\bkubernetes\b/i, /\bk8s\b/i],
  terraform: [/\bterraform\b/i],
  ansible: [/\bansible\b/i],
  jenkins: [/\bjenkins\b/i],
  cicd: [/\bci\/cd\b/i, /\bcicd\b/i],

  // Data & ML
  machinelearning: [/\bmachine\s*learning\b/i, /\bml\b/i],
  deeplearning: [/\bdeep\s*learning\b/i, /\bdl\b/i],
  tensorflow: [/\btensorflow\b/i],
  pytorch: [/\bpytorch\b/i],
  pandas: [/\bpandas\b/i],
  numpy: [/\bnumpy\b/i],
  spark: [/\bspark\b/i, /\bpyspark\b/i],
  hadoop: [/\bhadoop\b/i],

  // API & Protocols
  rest: [/\brest(?:ful)?\s*api\b/i, /\brest\b/i],
  graphql: [/\bgraphql\b/i],
  grpc: [/\bgrpc\b/i],
  websocket: [/\bwebsocket\b/i],

  // Other
  git: [/\bgit\b/i, /\bgithub\b/i, /\bgitlab\b/i],
  agile: [/\bagile\b/i, /\bscrum\b/i],
  microservices: [/\bmicroservices?\b/i],
  testing: [/\bjest\b/i, /\bpytest\b/i, /\bjunit\b/i, /\btdd\b/i],
};

// ============================================
// DOMAIN DICTIONARY
// ============================================

const DOMAIN_PATTERNS: Record<string, RegExp[]> = {
  fintech: [
    /\bfintech\b/i,
    /\bfinancial\s*(?:tech|technology|services)\b/i,
    /\bbanking\b/i,
    /\bpayments?\b/i,
    /\btrading\b/i,
    /\binvestment\b/i,
  ],
  healthtech: [
    /\bhealthtech\b/i,
    /\bhealthcare\b/i,
    /\bmedical\b/i,
    /\bhealth\s*tech\b/i,
    /\btelemedicine\b/i,
    /\bEHR\b/i,
  ],
  edtech: [
    /\bedtech\b/i,
    /\beducation\s*tech\b/i,
    /\be-?learning\b/i,
    /\bonline\s*learning\b/i,
  ],
  ecommerce: [
    /\be-?commerce\b/i,
    /\bonline\s*retail\b/i,
    /\bmarketplace\b/i,
    /\bretail\s*tech\b/i,
  ],
  saas: [/\bsaas\b/i, /\bb2b\b/i, /\benterprise\s*software\b/i],
  consumer: [/\bconsumer\b/i, /\bb2c\b/i, /\bmobile\s*app\b/i],
  gaming: [/\bgaming\b/i, /\bgame\s*dev\b/i, /\bvideo\s*games?\b/i],
  media: [
    /\bmedia\b/i,
    /\bstreaming\b/i,
    /\bcontent\b/i,
    /\bentertainment\b/i,
  ],
  cybersecurity: [
    /\bcybersecurity\b/i,
    /\binfosec\b/i,
    /\bsecurity\b/i,
    /\bsoc\b/i,
  ],
  ai: [
    /\bartificial\s*intelligence\b/i,
    /\bai\s*(?:company|startup|platform)\b/i,
    /\bgenai\b/i,
    /\bllm\b/i,
  ],
  devtools: [/\bdeveloper\s*tools\b/i, /\bdevtools\b/i, /\bplatform\b/i],
  logistics: [/\blogistics\b/i, /\bsupply\s*chain\b/i, /\bshipping\b/i],
  proptech: [/\bproptech\b/i, /\breal\s*estate\b/i, /\bproperty\b/i],
  insurtech: [/\binsurtech\b/i, /\binsurance\b/i],
  legaltech: [/\blegaltech\b/i, /\blegal\s*tech\b/i],
  hrtech: [/\bhrtech\b/i, /\bhr\s*tech\b/i, /\brecruiting\b/i],
  cleantech: [/\bcleantech\b/i, /\bclimate\b/i, /\bsustainability\b/i],
};

// ============================================
// EXPERIENCE LEVEL PATTERNS
// ============================================

const EXPERIENCE_PATTERNS: { level: ExperienceLevel; patterns: RegExp[] }[] = [
  {
    level: "INTERN",
    patterns: [/\bintern(?:ship)?\b/i, /\btrainee\b/i, /\bstudent\b/i],
  },
  {
    level: "ENTRY",
    patterns: [
      /\bentry[\s-]?level\b/i,
      /\bjunior\b/i,
      /\bjr\.?\b/i,
      /\b0-?2\s*years?\b/i,
      /\bfresher\b/i,
      /\bnew\s*grad\b/i,
      /\bgraduate\b/i,
    ],
  },
  {
    level: "MID",
    patterns: [
      /\bmid[\s-]?level\b/i,
      /\bintermediate\b/i,
      /\b2-?5\s*years?\b/i,
      /\b3-?5\s*years?\b/i,
      /\bmid\b/i,
    ],
  },
  {
    level: "SENIOR",
    patterns: [
      /\bsenior\b/i,
      /\bsr\.?\b/i,
      /\b5\+?\s*years?\b/i,
      /\b5-?8\s*years?\b/i,
      /\bexperienced\b/i,
    ],
  },
  {
    level: "STAFF",
    patterns: [
      /\bstaff\b/i,
      /\b8\+?\s*years?\b/i,
      /\bstaff\s*engineer\b/i,
    ],
  },
  {
    level: "PRINCIPAL",
    patterns: [
      /\bprincipal\b/i,
      /\blead\b/i,
      /\barchitect\b/i,
      /\b10\+?\s*years?\b/i,
    ],
  },
  {
    level: "EXECUTIVE",
    patterns: [
      /\bdirector\b/i,
      /\bvp\b/i,
      /\bvice\s*president\b/i,
      /\bcto\b/i,
      /\bhead\s*of\b/i,
      /\bchief\b/i,
      /\bexecutive\b/i,
      /\bc-?level\b/i,
    ],
  },
];

// ============================================
// SENIORITY TERMS
// ============================================

const SENIORITY_TERMS = [
  { term: "founding team", pattern: /\bfound(?:ing|er)\b/i },
  { term: "early stage", pattern: /\bearly[\s-]?stage\b/i },
  { term: "leadership", pattern: /\bleadership\b/i },
  { term: "management", pattern: /\bmanag(?:e|ing|ement)\s*team\b/i },
  { term: "individual contributor", pattern: /\bindividual\s*contributor\b/i },
  { term: "IC track", pattern: /\bic\s*track\b/i },
  { term: "hands-on", pattern: /\bhands[\s-]?on\b/i },
  { term: "player-coach", pattern: /\bplayer[\s-]?coach\b/i },
  { term: "tech lead", pattern: /\btech\s*lead\b/i },
  { term: "team lead", pattern: /\bteam\s*lead\b/i },
];

// ============================================
// BENEFITS PATTERNS
// ============================================

const BENEFITS_PATTERNS: { benefit: string; pattern: RegExp }[] = [
  { benefit: "remote work", pattern: /\bremote\b/i },
  { benefit: "hybrid", pattern: /\bhybrid\b/i },
  { benefit: "equity", pattern: /\bequity\b/i },
  { benefit: "stock options", pattern: /\bstock\s*options?\b/i },
  { benefit: "401k", pattern: /\b401\s*k\b/i },
  { benefit: "health insurance", pattern: /\bhealth\s*insurance\b/i },
  { benefit: "unlimited PTO", pattern: /\bunlimited\s*(?:pto|vacation)\b/i },
  { benefit: "flexible hours", pattern: /\bflexible\s*hours?\b/i },
  {
    benefit: "learning budget",
    pattern: /\blearning\s*(?:budget|allowance)\b/i,
  },
  { benefit: "parental leave", pattern: /\bparental\s*leave\b/i },
  { benefit: "visa sponsorship", pattern: /\bvisa\s*sponsor\b/i },
  { benefit: "relocation", pattern: /\brelocation\b/i },
];

// ============================================
// MAIN PARSER FUNCTION
// ============================================

export function parseJobDescription(
  title: string,
  description: string,
  _options: ParserOptions = {}
): ParsedJobTags {
  // Input validation
  if (!title || typeof title !== "string") {
    title = "";
  }
  if (!description || typeof description !== "string") {
    description = "";
  }

  // Combine and normalize text
  const fullText = `${title} ${description}`.toLowerCase();

  // Handle empty input
  if (fullText.trim().length === 0) {
    return {
      skills: [],
      domains: [],
      keywords: [],
      experienceLevel: "MID",
      seniorityTerms: [],
      techStack: [],
      benefits: [],
      confidence: 0,
    };
  }

  // Extract skills
  const skills = extractMatches(fullText, SKILL_PATTERNS);

  // Extract domains
  const domains = extractMatches(fullText, DOMAIN_PATTERNS);

  // Extract experience level
  const experienceLevel = detectExperienceLevel(fullText, title);

  // Extract seniority terms
  const seniorityTerms = extractSeniorityTerms(fullText);

  // Extract benefits
  const benefits = extractBenefits(fullText);

  // Extract keywords (words that appear frequently and aren't common)
  const keywords = extractKeywords(fullText, skills);

  // Tech stack is a subset of skills (programming languages + frameworks)
  const techStack = skills.filter((skill) =>
    [
      "javascript",
      "typescript",
      "python",
      "java",
      "golang",
      "rust",
      "react",
      "vue",
      "angular",
      "nodejs",
      "nextjs",
      "postgresql",
      "mongodb",
      "redis",
      "aws",
      "gcp",
      "docker",
      "kubernetes",
    ].includes(skill)
  );

  // Calculate confidence score based on extracted data
  const confidence = calculateConfidence(
    skills,
    domains,
    seniorityTerms,
    fullText
  );

  return {
    skills,
    domains,
    keywords,
    experienceLevel,
    seniorityTerms,
    techStack,
    benefits,
    confidence,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractMatches(
  text: string,
  patterns: Record<string, RegExp[]>
): string[] {
  const matches: string[] = [];

  for (const [name, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      if (regex.test(text)) {
        matches.push(name);
        break; // Found a match for this skill, move to next
      }
    }
  }

  return [...new Set(matches)]; // Remove duplicates
}

function detectExperienceLevel(text: string, title: string): ExperienceLevel {
  // Check title first (most reliable)
  for (const { level, patterns } of EXPERIENCE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(title)) {
        return level;
      }
    }
  }

  // Then check full text
  // Prioritize more senior levels if multiple matches
  const matchedLevels: ExperienceLevel[] = [];

  for (const { level, patterns } of EXPERIENCE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        matchedLevels.push(level);
        break;
      }
    }
  }

  if (matchedLevels.length === 0) {
    return "MID"; // Default
  }

  // Return the most senior level found
  const levelOrder: ExperienceLevel[] = [
    "INTERN",
    "ENTRY",
    "MID",
    "SENIOR",
    "STAFF",
    "PRINCIPAL",
    "EXECUTIVE",
  ];

  const sortedLevels = matchedLevels.sort(
    (a, b) => levelOrder.indexOf(b) - levelOrder.indexOf(a)
  );

  return sortedLevels[0];
}

function extractSeniorityTerms(text: string): string[] {
  const terms: string[] = [];

  for (const { term, pattern } of SENIORITY_TERMS) {
    if (pattern.test(text)) {
      terms.push(term);
    }
  }

  return terms;
}

function extractBenefits(text: string): string[] {
  const benefits: string[] = [];

  for (const { benefit, pattern } of BENEFITS_PATTERNS) {
    if (pattern.test(text)) {
      benefits.push(benefit);
    }
  }

  return benefits;
}

function extractKeywords(text: string, existingSkills: string[]): string[] {
  // Common words to filter out
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "as",
    "is",
    "was",
    "are",
    "were",
    "been",
    "be",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "shall",
    "can",
    "need",
    "dare",
    "ought",
    "used",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "what",
    "which",
    "who",
    "whom",
    "whose",
    "where",
    "when",
    "why",
    "how",
    "all",
    "each",
    "every",
    "both",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "just",
    "also",
    "now",
    "here",
    "there",
    "job",
    "work",
    "team",
    "company",
    "role",
    "position",
    "experience",
    "years",
    "looking",
    "join",
    "about",
    "our",
    "your",
    "their",
    "ability",
    "strong",
    "good",
    "best",
    "great",
  ]);

  // Tokenize and count
  const words = text
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const wordCount: Record<string, number> = {};
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
  }

  // Filter out already identified skills
  const skillSet = new Set(existingSkills.map((s) => s.toLowerCase()));

  return Object.entries(wordCount)
    .filter(([word, count]) => count >= 2 && !skillSet.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

function calculateConfidence(
  skills: string[],
  domains: string[],
  seniorityTerms: string[],
  text: string
): number {
  let score = 0;

  // Skills contribute most
  score += Math.min(skills.length * 0.1, 0.4);

  // Domains
  score += Math.min(domains.length * 0.15, 0.3);

  // Seniority terms
  score += Math.min(seniorityTerms.length * 0.1, 0.2);

  // Text length (longer = more confident)
  if (text.length > 500) score += 0.05;
  if (text.length > 1000) score += 0.05;

  return Math.min(score, 1);
}

// ============================================
// GENAI EXTENSION POINT (Optional - NOT auto-executed)
// ============================================

export interface GenAIParserResult {
  skills: string[];
  domains: string[];
  experienceLevel: ExperienceLevel;
  confidence: number;
  reasoning?: string;
}

/**
 * Hook for GenAI-based parsing fallback.
 * This is NOT auto-executed - only called explicitly when needed.
 * Always has rule-based fallback.
 */
export async function parseWithGenAI(
  _title: string,
  _description: string,
  _apiKey?: string
): Promise<GenAIParserResult | null> {
  // TODO: Implement GenAI parsing when needed
  // This should:
  // 1. Call an LLM API with structured output
  // 2. Validate the response against our enums
  // 3. Return null if parsing fails (fallback to rule-based)
  // 4. Log usage for cost tracking

  // For now, return null to use rule-based fallback
  return null;
}

/**
 * Enhanced parsing with optional GenAI fallback
 */
export async function parseJobDescriptionEnhanced(
  title: string,
  description: string,
  options: ParserOptions = {}
): Promise<ParsedJobTags> {
  // Always start with rule-based parsing
  const ruleBasedResult = parseJobDescription(title, description, options);

  // If confidence is low and GenAI is enabled, try GenAI
  if (
    options.useGenAI &&
    ruleBasedResult.confidence < (options.minConfidence ?? 0.5)
  ) {
    const genAIResult = await parseWithGenAI(title, description);

    if (genAIResult && genAIResult.confidence > ruleBasedResult.confidence) {
      return {
        ...ruleBasedResult,
        skills: genAIResult.skills,
        domains: genAIResult.domains,
        experienceLevel: genAIResult.experienceLevel,
        confidence: genAIResult.confidence,
      };
    }
  }

  return ruleBasedResult;
}