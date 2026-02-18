# AI Usage & Integration

## Overview

This document explains how AI/ML technologies are integrated into the Intelligent Referral Nudge Engine, including models used, prompts, and fallback strategies.

---

## 🤖 AI Components

### Component Overview

| Component | AI Technology | Purpose |
|-----------|---------------|---------|
| Job Description Parser | GPT-4o-mini | Extract structured data from JD |
| Skill Embeddings | OpenAI Embeddings | Semantic skill matching |
| Contact Insights | GPT-4o-mini | Identify who to reach out to |
| Message Generator | GPT-4o-mini | Generate referral messages |
| Nudge Personalization | GPT-4o-mini (optional) | Create contextual nudges |

---

## 1️⃣ Job Description Intelligence

### Purpose
Parse raw job descriptions to extract structured metadata for matching.

### Model Selection
- **Primary:** GPT-4o-mini (cost-effective, fast)
- **Fallback:** Static NLP rules

### Prompt Design

```typescript
const JD_PARSING_PROMPT = `You are an expert technical recruiter. Parse this job description and extract structured data.

Job Title: {title}
Job Description: {description}

Extract the following in JSON format:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill3", "skill4"],
  "experienceRange": { "min": 2, "max": 5 },
  "seniorityLevel": "mid|senior|staff|principal",
  "domain": "backend|frontend|fullstack|data|ml|devops|product|design",
  "industry": "fintech|ecommerce|saas|consumer|healthcare|edtech",
  "techStack": ["technology1", "technology2"],
  "targetCompanies": ["company1"],
  "benefits": ["benefit1", "benefit2"],
  "keywords": ["keyword1", "keyword2"]
}

Rules:
1. Normalize skill names (e.g., "React.js" → "react")
2. Infer seniority from years of experience if not explicit
3. Extract only mentioned technologies, don't infer
4. Return valid JSON only, no markdown

Parse this job description:`;
```

### Implementation

```typescript
export async function parseJobDescription(
  title: string,
  description: string
): Promise<JobParseResult> {
  if (!openai) {
    console.warn("OpenAI not configured, using static parsing");
    return staticParseJobDescription(title, description);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a technical recruiter expert. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: JD_PARSING_PROMPT.replace("{title}", title).replace("{description}", description)
        }
      ],
      temperature: 0.1,  // Low temperature for consistency
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return {
      ...parsed,
      source: "ai",
      confidence: 0.9,
      parsedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("AI parsing failed, falling back to static:", error);
    return staticParseJobDescription(title, description);
  }
}
```

### Static Fallback

```typescript
function staticParseJobDescription(
  title: string,
  description: string
): JobParseResult {
  const fullText = `${title} ${description}`.toLowerCase();
  
  return {
    requiredSkills: extractSkillsFromText(fullText, SKILL_PATTERNS),
    preferredSkills: [],
    experienceRange: extractExperienceRange(fullText),
    seniorityLevel: inferSeniorityFromTitle(title),
    domain: inferDomainFromText(fullText, DOMAIN_PATTERNS),
    industry: inferIndustryFromText(fullText, INDUSTRY_PATTERNS),
    techStack: extractTechStack(fullText),
    targetCompanies: [],
    benefits: [],
    keywords: extractKeywords(fullText),
    source: "static",
    confidence: 0.6,
    parsedAt: new Date().toISOString()
  };
}
```

---

## 2️⃣ Semantic Embeddings

### Purpose
Generate vector embeddings for semantic similarity matching between profiles and jobs.

### Model
- **OpenAI:** text-embedding-3-small (1536 dimensions)
- **Cost:** $0.02 per 1M tokens

### Implementation

```typescript
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float"
  });

  return response.data[0].embedding;
}

// Generate combined profile embedding
export async function generateProfileEmbedding(
  profile: MemberProfile
): Promise<ProfileEmbedding> {
  const texts = {
    skills: profile.skills.join(", "),
    experience: `${profile.currentTitle} at ${profile.currentCompany}. Previously: ${profile.pastCompanies.join(", ")}`,
    domains: profile.domains.join(", ")
  };

  const [skillVector, experienceVector, domainVector] = await Promise.all([
    generateEmbedding(texts.skills),
    generateEmbedding(texts.experience),
    generateEmbedding(texts.domains)
  ]);

  // Weighted combination
  const combinedVector = weightedAverage([
    { vector: skillVector, weight: 0.4 },
    { vector: experienceVector, weight: 0.4 },
    { vector: domainVector, weight: 0.2 }
  ]);

  return {
    skillVector,
    experienceVector,
    domainVector,
    combinedVector,
    modelVersion: "text-embedding-3-small",
    generatedAt: new Date().toISOString()
  };
}
```

### Embedding Storage

```typescript
// Store embeddings efficiently in PostgreSQL
// Using pgvector extension for vector operations

model MemberEmbedding {
  id              String   @id @default(cuid())
  memberId        String   @unique
  skillVector     Float[]  @db.Vector(1536)
  combinedVector  Float[]  @db.Vector(1536)
  modelVersion    String
  generatedAt     DateTime
}

// Similarity query using pgvector
async function findSimilarMembers(
  jobEmbedding: number[],
  limit: number = 50
): Promise<{ memberId: string; similarity: number }[]> {
  return prisma.$queryRaw`
    SELECT member_id, 1 - (combined_vector <=> ${jobEmbedding}::vector) as similarity
    FROM member_embeddings
    ORDER BY combined_vector <=> ${jobEmbedding}::vector
    LIMIT ${limit}
  `;
}
```

---

## 3️⃣ Contact Insights Extraction

### Purpose
Identify key roles and departments to reach out to for a job referral.

### Prompt Design

```typescript
const CONTACT_INSIGHTS_PROMPT = `You are an expert recruiter. Given a job posting, identify key people to reach out to for a referral.

Job Title: {jobTitle}
Company: {company}
Job Description: {jobDescription}

Analyze the job and provide:
1. A list of 2-3 key roles/titles of people you should reach out to (e.g., "Hiring Manager", "Team Lead", "Engineering Manager")
2. A list of 2-3 relevant departments they likely belong to (e.g., "Engineering", "Product", "HR")
3. A brief 1-sentence explanation of the best approach to reach out

Format your response EXACTLY as JSON:
{
  "roles": ["role1", "role2", "role3"],
  "departments": ["dept1", "dept2", "dept3"],
  "description": "Brief explanation about reaching out"
}`;
```

### Implementation

```typescript
export async function extractContactInsights(
  jobTitle: string,
  jobDescription: string,
  company?: string
): Promise<ContactInsights> {
  if (!openai) {
    return generateStaticContactInsights(jobTitle, jobDescription, company);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a recruiting expert. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: CONTACT_INSIGHTS_PROMPT
            .replace("{jobTitle}", jobTitle)
            .replace("{company}", company || "Unknown")
            .replace("{jobDescription}", jobDescription.slice(0, 2000))
        }
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return {
      ...parsed,
      source: "ai",
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Contact insights extraction failed:", error);
    return generateStaticContactInsights(jobTitle, jobDescription, company);
  }
}
```

---

## 4️⃣ AI Message Generation

### Purpose
Generate personalized referral outreach messages.

### Prompt Design

```typescript
const MESSAGE_GENERATION_PROMPT = `Generate a friendly, concise referral message for someone to share with their network.

Context:
- Member Name: {memberName}
- Job Role: {jobTitle}
- Company: {company}
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
```

### Message Templates (Fallback)

```typescript
const MESSAGE_TEMPLATES = {
  company_match: {
    subject: "Know anyone for this {role} role?",
    body: `Hey, I came across this {role} opening at {company}. Since you worked at {matchedCompany}, I thought you might know someone who'd be a great fit. Let me know if anyone comes to mind!`
  },
  skill_match: {
    subject: "Thought of your network for this role",
    body: `Hey, there's this {role} role at {company} that needs someone strong in {skills}. Given your background in this area, do you know anyone who might be interested?`
  },
  industry_match: {
    subject: "{industry} opportunity that might interest your network",
    body: `Hey, I found this {role} position at {company}. Since you've been in the {industry} space, I thought someone in your network might be a good fit. Anyone come to mind?`
  },
  generic: {
    subject: "Know anyone for this {role} role?",
    body: `Hey, there's an interesting {role} opportunity at {company}. If you know anyone who might be interested, I'd appreciate a referral!`
  }
};

function selectTemplate(matchType: string): MessageTemplate {
  return MESSAGE_TEMPLATES[matchType] || MESSAGE_TEMPLATES.generic;
}
```

### Implementation

```typescript
export async function generateReferralMessage(
  memberName: string,
  job: Job,
  matchReason: string
): Promise<GeneratedMessage> {
  if (!openai) {
    return generateTemplateMessage(memberName, job, matchReason);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a friendly professional helping people write referral messages."
        },
        {
          role: "user",
          content: MESSAGE_GENERATION_PROMPT
            .replace("{memberName}", memberName)
            .replace("{jobTitle}", job.title)
            .replace("{company}", job.company)
            .replace("{matchReason}", matchReason)
        }
      ],
      temperature: 0.7,  // Higher for creative variation
      max_tokens: 200
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return {
      ...parsed,
      source: "ai",
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    return generateTemplateMessage(memberName, job, matchReason);
  }
}
```

---

## 5️⃣ Job Summary Generation

### Purpose
Generate concise 3-bullet summaries of job descriptions for quick scanning.

### Prompt Design

```typescript
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
```

### Implementation

```typescript
export async function summarizeJobDescription(
  title: string,
  description: string
): Promise<JobSummary> {
  if (!openai) {
    return generateStaticSummary(title, description);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise technical writer." },
        {
          role: "user",
          content: JOB_SUMMARY_PROMPT
            .replace("{title}", title)
            .replace("{description}", description.slice(0, 1500))
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return {
      bullets: parsed.bullets,
      source: "ai",
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    return generateStaticSummary(title, description);
  }
}
```

---

## 🔄 AI Service Architecture

### Request Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│  API Route   │────▶│  AI Service  │
│   Request    │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                           ┌─────────────────────┼─────────────────────┐
                           ▼                     ▼                     ▼
                    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                    │   OpenAI     │     │   Cache      │     │   Fallback   │
                    │   API        │     │   Layer      │     │   Static     │
                    └──────────────┘     └──────────────┘     └──────────────┘
```

### Caching Strategy

```typescript
interface AICacheConfig {
  jobParsing: {
    ttl: 86400 * 7,  // 7 days - JD doesn't change
    key: (jobId: string) => `ai:jd:${jobId}`
  },
  embeddings: {
    ttl: 86400 * 30, // 30 days - profile is stable
    key: (memberId: string) => `ai:emb:${memberId}`
  },
  messages: {
    ttl: 3600,       // 1 hour - allow variation
    key: (memberId: string, jobId: string) => `ai:msg:${memberId}:${jobId}`
  },
  insights: {
    ttl: 86400,      // 1 day
    key: (jobId: string) => `ai:ins:${jobId}`
  }
}

async function cachedAICall<T>(
  cacheKey: string,
  ttl: number,
  generator: () => Promise<T>
): Promise<T> {
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Generate
  const result = await generator();

  // Cache result
  await redis.setex(cacheKey, ttl, JSON.stringify(result));

  return result;
}
```

---

## 💰 Cost Management

### Token Estimation

| Operation | Avg Input Tokens | Avg Output Tokens | Cost per Call |
|-----------|------------------|-------------------|---------------|
| JD Parsing | 500 | 200 | $0.00035 |
| Embeddings | 100 | - | $0.000002 |
| Contact Insights | 300 | 100 | $0.0002 |
| Message Generation | 100 | 80 | $0.00009 |
| Job Summary | 400 | 60 | $0.00023 |

### Cost Controls

```typescript
const AI_LIMITS = {
  maxInputTokens: 2000,      // Truncate longer inputs
  maxOutputTokens: 500,      // Cap response length
  dailyBudget: 10.00,        // $10/day max
  rateLimitPerHour: 1000,    // Max API calls per hour
  fallbackThreshold: 0.9     // Fallback if 90% budget used
};

class AIBudgetManager {
  async checkBudget(): Promise<boolean> {
    const todaySpend = await this.getTodaySpend();
    return todaySpend < AI_LIMITS.dailyBudget * AI_LIMITS.fallbackThreshold;
  }

  async recordUsage(tokens: number, cost: number): Promise<void> {
    await redis.incrby('ai:daily:tokens', tokens);
    await redis.incrbyfloat('ai:daily:cost', cost);
  }
}
```

---

## 🛡️ Error Handling & Fallbacks

### Fallback Hierarchy

```typescript
async function robustAICall<T>(
  aiFunction: () => Promise<T>,
  staticFallback: () => T,
  options: { timeout: number; retries: number }
): Promise<T & { source: 'ai' | 'static' }> {
  // Check if AI is available and within budget
  if (!openai || !await budgetManager.checkBudget()) {
    return { ...staticFallback(), source: 'static' };
  }

  for (let attempt = 0; attempt < options.retries; attempt++) {
    try {
      const result = await Promise.race([
        aiFunction(),
        timeout(options.timeout)
      ]);
      return { ...result, source: 'ai' };
    } catch (error) {
      if (isRateLimitError(error)) {
        await sleep(1000 * (attempt + 1));  // Exponential backoff
        continue;
      }
      console.error(`AI call failed (attempt ${attempt + 1}):`, error);
    }
  }

  // All retries failed
  return { ...staticFallback(), source: 'static' };
}
```

### Quality Assurance

```typescript
function validateAIResponse(response: unknown, schema: JSONSchema): boolean {
  // Validate JSON structure
  if (!isValidJSON(response)) return false;

  // Validate against schema
  const valid = ajv.validate(schema, response);
  if (!valid) {
    console.warn("AI response validation failed:", ajv.errors);
    return false;
  }

  // Content quality checks
  if (response.bullets?.some(b => b.length > 100)) return false;
  if (response.skills?.length > 20) return false;

  return true;
}
```

---

## 📊 Monitoring & Observability

### Metrics to Track

| Metric | Purpose |
|--------|---------|
| ai_call_latency_ms | Response time monitoring |
| ai_call_success_rate | Reliability tracking |
| ai_fallback_rate | Fallback frequency |
| ai_cost_daily | Budget monitoring |
| ai_cache_hit_rate | Caching effectiveness |

### Logging

```typescript
function logAICall(
  operation: string,
  success: boolean,
  latencyMs: number,
  tokens: number,
  source: 'ai' | 'static'
): void {
  console.log(JSON.stringify({
    type: 'ai_call',
    operation,
    success,
    latencyMs,
    tokens,
    source,
    timestamp: new Date().toISOString()
  }));
}
```
