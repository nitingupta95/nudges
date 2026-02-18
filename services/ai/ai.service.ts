/**
 * AI Service
 * Handles all AI/ML integrations including:
 * - Job Description Parsing
 * - Semantic Embeddings
 * - Contact Insights
 * - Message Generation
 * - Job Summaries
 */

import OpenAI from "openai";

// ============================================
// OPENAI CLIENT INITIALIZATION
// ============================================

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ============================================
// TYPES & INTERFACES
// ============================================

export interface JobSummary {
  bullets: string[];
  source: "ai" | "static";
  generatedAt: string;
}

export interface ContactInsights {
  roles: string[];
  departments: string[];
  description: string;
  source: "ai" | "static";
  generatedAt: string;
}

export interface JobParseResult {
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRange: { min: number; max: number };
  seniorityLevel: string;
  domain: string;
  industry: string;
  techStack: string[];
  targetCompanies: string[];
  benefits: string[];
  keywords: string[];
  source: "ai" | "static";
  confidence: number;
  parsedAt: string;
}

export interface ProfileEmbedding {
  skillVector: number[];
  experienceVector: number[];
  domainVector: number[];
  combinedVector: number[];
  modelVersion: string;
  generatedAt: string;
}

export interface GeneratedMessage {
  subject: string;
  body: string;
  source: "ai" | "static";
  generatedAt: string;
}

export interface AICallOptions {
  timeout?: number;
  retries?: number;
  maxInputTokens?: number;
}

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

const AI_LIMITS = {
  maxInputTokens: 2000,
  maxOutputTokens: 500,
  dailyBudget: 10.0,
  rateLimitPerHour: 1000,
  fallbackThreshold: 0.9,
};

const DEFAULT_OPTIONS: AICallOptions = {
  timeout: 10000,
  retries: 2,
  maxInputTokens: 2000,
};

// ============================================
// PROMPTS
// ============================================

const JD_PARSING_PROMPT = `You are an expert technical recruiter. Parse this job description and extract structured data.

Job Title: {title}
Job Description: {description}

Extract the following in JSON format:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill3", "skill4"],
  "experienceRange": { "min": 2, "max": 5 },
  "seniorityLevel": "intern|entry|mid|senior|staff|principal|executive",
  "domain": "backend|frontend|fullstack|data|ml|devops|product|design|mobile",
  "industry": "fintech|ecommerce|saas|consumer|healthcare|edtech|enterprise",
  "techStack": ["technology1", "technology2"],
  "targetCompanies": ["company1"],
  "benefits": ["benefit1", "benefit2"],
  "keywords": ["keyword1", "keyword2"]
}

Rules:
1. Normalize skill names (e.g., "React.js" → "react", "Node.JS" → "nodejs")
2. Infer seniority from years of experience if not explicit
3. Extract only mentioned technologies, don't infer
4. Return valid JSON only, no markdown`;

const CONTACT_INSIGHTS_PROMPT = `You are an expert recruiter. Given a job posting, identify key people to reach out to for a referral.

Job Title: {jobTitle}
Company: {company}
Job Description: {jobDescription}

Analyze the job and provide:
1. A list of 2-3 key roles/titles of people you should reach out to (e.g., "Hiring Manager", "Team Lead", "Engineering Manager")
2. A list of 2-3 relevant departments they likely belong to (e.g., "Engineering", "Product", "HR")
3. A brief 1-sentence explanation of the best approach to reach out

Format your response EXACTLY as JSON (no markdown, no code blocks):
{
  "roles": ["role1", "role2", "role3"],
  "departments": ["dept1", "dept2", "dept3"],
  "description": "Brief explanation about reaching out"
}`;

const JOB_SUMMARY_PROMPT = `Summarize this job in exactly 3 bullet points. Each bullet should be:
- Under 15 words
- Action-oriented
- Highlight key aspects (tech, impact, team)

Job Title: {title}
Description: {description}

Format as JSON:
{
  "bullets": ["bullet1", "bullet2", "bullet3"]
}`;

const MESSAGE_GENERATION_PROMPT = `Generate a friendly, concise referral message for someone to share with their network.

Context:
- Member Name: {memberName}
- Job Role: {jobTitle}
- Company: {company}
- Key Skills: {skills}
- Why this matches: {matchReason}

Requirements:
1. Keep it under 100 words
2. Be conversational and genuine
3. Mention the specific match reason naturally
4. Include a soft ask, not pushy
5. Don't include emojis

Format as JSON:
{
  "subject": "Subject line for email",
  "body": "Message body"
}`;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function truncateText(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + "...";
}

async function timeout<T>(ms: number): Promise<T> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("AI call timeout")), ms)
  );
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("rate_limit") ||
      error.message.includes("429") ||
      error.message.includes("Too Many Requests")
    );
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logAICall(
  operation: string,
  success: boolean,
  latencyMs: number,
  source: "ai" | "static",
  error?: string
): void {
  console.log(
    JSON.stringify({
      type: "ai_call",
      operation,
      success,
      latencyMs,
      source,
      error,
      timestamp: new Date().toISOString(),
    })
  );
}

// ============================================
// ROBUST AI CALL WRAPPER
// ============================================

async function robustAICall<T>(
  operation: string,
  aiFunction: () => Promise<T>,
  staticFallback: () => T,
  options: AICallOptions = DEFAULT_OPTIONS
): Promise<T & { source: "ai" | "static" }> {
  const startTime = Date.now();

  if (!openai) {
    logAICall(operation, true, Date.now() - startTime, "static", "OpenAI not configured");
    return { ...staticFallback(), source: "static" as const };
  }

  const retries = options.retries ?? DEFAULT_OPTIONS.retries!;
  const timeoutMs = options.timeout ?? DEFAULT_OPTIONS.timeout!;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await Promise.race([
        aiFunction(),
        timeout<T>(timeoutMs),
      ]);
      
      logAICall(operation, true, Date.now() - startTime, "ai");
      return { ...result, source: "ai" as const };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (isRateLimitError(error)) {
        console.warn(`Rate limit hit, attempt ${attempt + 1}/${retries}`);
        await sleep(1000 * (attempt + 1));
        continue;
      }
      
      console.error(`AI call failed (attempt ${attempt + 1}):`, errorMessage);
    }
  }

  logAICall(operation, false, Date.now() - startTime, "static", "All retries failed");
  return { ...staticFallback(), source: "static" as const };
}

// ============================================
// 1. JOB DESCRIPTION PARSING
// ============================================

export async function parseJobDescriptionAI(
  title: string,
  description: string
): Promise<JobParseResult> {
  return robustAICall(
    "parseJobDescription",
    async () => {
      const truncatedDesc = truncateText(description, AI_LIMITS.maxInputTokens);
      
      const completion = await openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a technical recruiter expert. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: JD_PARSING_PROMPT.replace("{title}", title).replace(
              "{description}",
              truncatedDesc
            ),
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("Empty response from OpenAI");

      const parsed = JSON.parse(content);
      return {
        requiredSkills: parsed.requiredSkills || [],
        preferredSkills: parsed.preferredSkills || [],
        experienceRange: parsed.experienceRange || { min: 0, max: 10 },
        seniorityLevel: parsed.seniorityLevel || "mid",
        domain: parsed.domain || "general",
        industry: parsed.industry || "technology",
        techStack: parsed.techStack || [],
        targetCompanies: parsed.targetCompanies || [],
        benefits: parsed.benefits || [],
        keywords: parsed.keywords || [],
        confidence: 0.9,
        parsedAt: new Date().toISOString(),
      } as Omit<JobParseResult, "source">;
    },
    () => generateStaticJobParse(title, description)
  );
}

function generateStaticJobParse(
  title: string,
  description: string
): Omit<JobParseResult, "source"> {
  const fullText = `${title} ${description}`.toLowerCase();

  return {
    requiredSkills: extractSkillsFromText(fullText),
    preferredSkills: [],
    experienceRange: extractExperienceRange(fullText),
    seniorityLevel: inferSeniorityFromTitle(title),
    domain: inferDomainFromText(fullText),
    industry: inferIndustryFromText(fullText),
    techStack: extractSkillsFromText(fullText).slice(0, 10),
    targetCompanies: [],
    benefits: [],
    keywords: extractKeywords(fullText),
    confidence: 0.6,
    parsedAt: new Date().toISOString(),
  };
}

// ============================================
// 2. SEMANTIC EMBEDDINGS
// ============================================

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error("OpenAI API key not configured for embeddings");
  }

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: truncateText(text, 8000),
    encoding_format: "float",
  });

  return response.data[0].embedding;
}

export async function generateProfileEmbedding(profile: {
  skills: string[];
  currentTitle?: string;
  currentCompany?: string;
  pastCompanies: string[];
  domains: string[];
}): Promise<ProfileEmbedding> {
  if (!openai) {
    throw new Error("OpenAI API key not configured for embeddings");
  }

  const texts = {
    skills: profile.skills.join(", "),
    experience: `${profile.currentTitle || "Professional"} at ${profile.currentCompany || "Company"}. Previously: ${profile.pastCompanies.join(", ") || "Various companies"}`,
    domains: profile.domains.join(", ") || "Technology",
  };

  const [skillVector, experienceVector, domainVector] = await Promise.all([
    generateEmbedding(texts.skills || "general skills"),
    generateEmbedding(texts.experience),
    generateEmbedding(texts.domains || "technology"),
  ]);

  const combinedVector = weightedAverageVectors([
    { vector: skillVector, weight: 0.4 },
    { vector: experienceVector, weight: 0.4 },
    { vector: domainVector, weight: 0.2 },
  ]);

  return {
    skillVector,
    experienceVector,
    domainVector,
    combinedVector,
    modelVersion: "text-embedding-3-small",
    generatedAt: new Date().toISOString(),
  };
}

function weightedAverageVectors(
  inputs: { vector: number[]; weight: number }[]
): number[] {
  if (inputs.length === 0) return [];

  const dimension = inputs[0].vector.length;
  const result = new Array(dimension).fill(0);
  let totalWeight = 0;

  for (const { vector, weight } of inputs) {
    totalWeight += weight;
    for (let i = 0; i < dimension; i++) {
      result[i] += vector[i] * weight;
    }
  }

  for (let i = 0; i < dimension; i++) {
    result[i] /= totalWeight;
  }

  return result;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same dimension");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============================================
// 3. CONTACT INSIGHTS EXTRACTION
// ============================================

export async function extractContactInsights(
  jobTitle: string,
  jobDescription: string,
  company?: string
): Promise<ContactInsights> {
  return robustAICall(
    "extractContactInsights",
    async () => {
      const truncatedDesc = truncateText(jobDescription, 2000);

      const completion = await openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a recruiting expert. Always respond with valid JSON only, no markdown or extra text.",
          },
          {
            role: "user",
            content: CONTACT_INSIGHTS_PROMPT.replace("{jobTitle}", jobTitle)
              .replace("{company}", company || "Unknown")
              .replace("{jobDescription}", truncatedDesc),
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("Empty response from OpenAI");

      const parsed = JSON.parse(content);
      return {
        roles: parsed.roles || [],
        departments: parsed.departments || [],
        description: parsed.description || "Reach out to the hiring team.",
        generatedAt: new Date().toISOString(),
      } as Omit<ContactInsights, "source">;
    },
    () => generateStaticContactInsights(jobTitle, jobDescription, company)
  );
}

function generateStaticContactInsights(
  jobTitle: string,
  jobDescription: string,
  company?: string
): Omit<ContactInsights, "source"> {
  const roles: string[] = [];
  const departments: string[] = [];
  const titleLower = jobTitle.toLowerCase();
  const descLower = jobDescription.toLowerCase();

  if (titleLower.includes("manager") || titleLower.includes("lead")) {
    roles.push("Engineering Manager", "Director of Engineering");
  } else if (titleLower.includes("designer")) {
    roles.push("Design Lead", "Product Manager");
  } else if (titleLower.includes("product")) {
    roles.push("Product Manager", "Head of Product");
  } else if (titleLower.includes("data") || titleLower.includes("ml")) {
    roles.push("Data Science Manager", "ML Lead");
  } else {
    roles.push("Hiring Manager", "Team Lead");
  }
  roles.push("HR Recruiter");

  if (descLower.includes("engineer") || descLower.includes("developer")) {
    departments.push("Engineering");
  }
  if (descLower.includes("product")) {
    departments.push("Product");
  }
  if (descLower.includes("design")) {
    departments.push("Design");
  }
  if (descLower.includes("data") || descLower.includes("analytics")) {
    departments.push("Data");
  }
  if (departments.length === 0) {
    departments.push("Hiring Team");
  }
  departments.push("HR/People Ops");

  return {
    roles: roles.slice(0, 3),
    departments: departments.slice(0, 3),
    description: `Reach out to the ${roles[0]} or ${roles[1] || "team lead"} at ${company || "the company"} to discuss this opportunity.`,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// 4. AI MESSAGE GENERATION
// ============================================

export async function generateReferralMessage(
  memberName: string,
  job: { title: string; company: string; skills?: string[] },
  matchReason: string
): Promise<GeneratedMessage> {
  return robustAICall(
    "generateReferralMessage",
    async () => {
      const completion = await openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a friendly professional helping people write referral messages. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: MESSAGE_GENERATION_PROMPT.replace("{memberName}", memberName)
              .replace("{jobTitle}", job.title)
              .replace("{company}", job.company)
              .replace("{skills}", job.skills?.slice(0, 5).join(", ") || "relevant skills")
              .replace("{matchReason}", matchReason),
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("Empty response from OpenAI");

      const parsed = JSON.parse(content);
      return {
        subject: parsed.subject || `Know anyone for this ${job.title} role?`,
        body: parsed.body || `Hey, there's an interesting ${job.title} opportunity at ${job.company}. Let me know if anyone comes to mind!`,
        generatedAt: new Date().toISOString(),
      } as Omit<GeneratedMessage, "source">;
    },
    () => generateTemplateMessage(memberName, job, matchReason)
  );
}

const MESSAGE_TEMPLATES = {
  company_match: {
    subject: "Know anyone for this {role} role?",
    body: `Hey, I came across this {role} opening at {company}. Since you worked at {matchedCompany}, I thought you might know someone who'd be a great fit. Let me know if anyone comes to mind!`,
  },
  skill_match: {
    subject: "Thought of your network for this role",
    body: `Hey, there's this {role} role at {company} that needs someone strong in {skills}. Given your background in this area, do you know anyone who might be interested?`,
  },
  industry_match: {
    subject: "{industry} opportunity that might interest your network",
    body: `Hey, I found this {role} position at {company}. Since you've been in the {industry} space, I thought someone in your network might be a good fit. Anyone come to mind?`,
  },
  generic: {
    subject: "Know anyone for this {role} role?",
    body: `Hey, there's an interesting {role} opportunity at {company}. If you know anyone who might be interested, I'd appreciate a referral!`,
  },
};

function generateTemplateMessage(
  _memberName: string,
  job: { title: string; company: string; skills?: string[] },
  matchReason: string
): Omit<GeneratedMessage, "source"> {
  let templateType: keyof typeof MESSAGE_TEMPLATES = "generic";
  if (matchReason.toLowerCase().includes("company")) templateType = "company_match";
  else if (matchReason.toLowerCase().includes("skill")) templateType = "skill_match";
  else if (matchReason.toLowerCase().includes("industry")) templateType = "industry_match";

  const template = MESSAGE_TEMPLATES[templateType];

  const subject = template.subject
    .replace("{role}", job.title)
    .replace("{company}", job.company)
    .replace("{industry}", "tech");

  const body = template.body
    .replace("{role}", job.title)
    .replace("{company}", job.company)
    .replace("{skills}", job.skills?.slice(0, 3).join(", ") || "relevant skills")
    .replace("{matchedCompany}", "your previous company")
    .replace("{industry}", "tech");

  return {
    subject,
    body,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// 5. JOB SUMMARY GENERATION
// ============================================

export async function summarizeJobDescription(
  title: string,
  description: string
): Promise<JobSummary> {
  return robustAICall(
    "summarizeJobDescription",
    async () => {
      const truncatedDesc = truncateText(description, 1500);

      const completion = await openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a concise technical writer. Always respond with valid JSON." },
          {
            role: "user",
            content: JOB_SUMMARY_PROMPT.replace("{title}", title).replace(
              "{description}",
              truncatedDesc
            ),
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("Empty response from OpenAI");

      const parsed = JSON.parse(content);
      return {
        bullets: parsed.bullets || [],
        generatedAt: new Date().toISOString(),
      } as Omit<JobSummary, "source">;
    },
    () => generateStaticSummary(title, description)
  );
}

function generateStaticSummary(
  title: string,
  description: string
): Omit<JobSummary, "source"> {
  const bullets: string[] = [];

  const firstSentence = description.split(/[.!?]/)[0]?.trim();
  if (firstSentence && firstSentence.length > 10) {
    bullets.push(
      firstSentence.length > 80
        ? firstSentence.substring(0, 77) + "..."
        : firstSentence
    );
  } else {
    bullets.push(`Work as ${title} in a dynamic team environment`);
  }

  const skillsMatch = description.match(
    /(?:skills?|requirements?|qualifications?)[:\s]+([^.]+)/i
  );
  if (skillsMatch && skillsMatch[1]) {
    const skillsText = skillsMatch[1].trim();
    bullets.push(
      skillsText.length > 80
        ? `Key skills: ${skillsText.substring(0, 70)}...`
        : `Key skills: ${skillsText}`
    );
  } else {
    bullets.push(`Build and deliver high-quality solutions`);
  }

  bullets.push(`Collaborate with cross-functional teams`);

  return {
    bullets: bullets.slice(0, 3),
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// HELPER FUNCTIONS FOR STATIC PARSING
// ============================================

const SKILL_PATTERNS = [
  "react", "vue", "angular", "nextjs", "typescript", "javascript", "html", "css",
  "tailwind", "sass", "webpack", "vite",
  "node", "nodejs", "python", "java", "golang", "go", "rust", "ruby", "php",
  "express", "fastapi", "django", "spring", "nestjs",
  "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb",
  "prisma", "typeorm", "sequelize",
  "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "jenkins",
  "ci/cd", "github actions",
  "tensorflow", "pytorch", "pandas", "numpy", "spark", "airflow",
  "sql", "data science", "machine learning",
  "react native", "flutter", "swift", "kotlin", "ios", "android",
];

function extractSkillsFromText(text: string): string[] {
  const found: string[] = [];
  const lowerText = text.toLowerCase();

  for (const skill of SKILL_PATTERNS) {
    if (lowerText.includes(skill) && !found.includes(skill)) {
      found.push(skill);
    }
  }

  return found.slice(0, 15);
}

function extractExperienceRange(text: string): { min: number; max: number } {
  const patterns = [
    /(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)/i,
    /(\d+)\+\s*(?:years?|yrs?)/i,
    /(?:minimum|at least|min)\s*(\d+)\s*(?:years?|yrs?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = match[2] ? parseInt(match[2], 10) : min + 3;
      return { min, max };
    }
  }

  return { min: 0, max: 10 };
}

function inferSeniorityFromTitle(title: string): string {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("intern")) return "intern";
  if (lowerTitle.includes("junior") || lowerTitle.includes("jr")) return "entry";
  if (lowerTitle.includes("senior") || lowerTitle.includes("sr")) return "senior";
  if (lowerTitle.includes("staff")) return "staff";
  if (lowerTitle.includes("principal") || lowerTitle.includes("architect")) return "principal";
  if (lowerTitle.includes("director") || lowerTitle.includes("vp") || lowerTitle.includes("head")) return "executive";
  if (lowerTitle.includes("lead") || lowerTitle.includes("manager")) return "senior";

  return "mid";
}

function inferDomainFromText(text: string): string {
  const domains: Record<string, string[]> = {
    frontend: ["frontend", "front-end", "react", "vue", "angular", "ui", "ux"],
    backend: ["backend", "back-end", "api", "server", "microservices"],
    fullstack: ["fullstack", "full-stack", "full stack"],
    data: ["data engineer", "data science", "analytics", "etl", "pipeline"],
    ml: ["machine learning", "ml", "deep learning", "ai", "nlp"],
    devops: ["devops", "sre", "infrastructure", "platform", "cloud"],
    mobile: ["mobile", "ios", "android", "react native", "flutter"],
    product: ["product manager", "product owner", "pm"],
    design: ["designer", "ux", "ui design", "figma"],
  };

  const lowerText = text.toLowerCase();

  for (const [domain, keywords] of Object.entries(domains)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      return domain;
    }
  }

  return "general";
}

function inferIndustryFromText(text: string): string {
  const industries: Record<string, string[]> = {
    fintech: ["fintech", "financial", "banking", "payments", "trading"],
    ecommerce: ["ecommerce", "e-commerce", "retail", "marketplace"],
    saas: ["saas", "b2b", "enterprise software"],
    consumer: ["consumer", "social", "gaming", "entertainment"],
    healthcare: ["healthcare", "health", "medical", "biotech"],
    edtech: ["edtech", "education", "learning", "training"],
  };

  const lowerText = text.toLowerCase();

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      return industry;
    }
  }

  return "technology";
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .filter((w) => !["about", "their", "which", "would", "could", "should"].includes(w));

  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }

  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

// ============================================
// EXPORTS
// ============================================

export {
  openai,
  AI_LIMITS,
  generateStaticSummary,
  generateStaticContactInsights,
};