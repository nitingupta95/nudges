/**
 * Resume Service
 * Handles resume parsing, skill extraction, and candidate matching
 */

import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
// Note: pdf-parse and mammoth are dynamically imported to avoid module init issues

// ============================================
// OPENAI CLIENT
// ============================================

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ============================================
// TYPES
// ============================================

export interface ParsedResume {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  summary?: string;
  skills: string[];
  primarySkills: string[];
  technicalSkills: string[];
  softSkills: string[];
  experience: WorkExperience[];
  education: Education[];
  certifications: string[];
  totalYearsOfExperience: number;
  currentTitle?: string;
  currentCompany?: string;
  industries: string[];
  domains: string[];
  experienceLevel: "INTERN" | "ENTRY" | "MID" | "SENIOR" | "STAFF" | "PRINCIPAL" | "EXECUTIVE";
  languages?: string[];
  source: "ai" | "static";
  confidence: number;
  parsedAt: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  duration?: string;
  description?: string;
  skills: string[];
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  graduationYear?: string;
  gpa?: string;
}

export interface ResumeMatchScore {
  overall: number;
  breakdown: {
    skillMatch: number;
    experienceMatch: number;
    industryMatch: number;
    domainMatch: number;
    seniorityMatch: number;
    educationMatch: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  concerns: string[];
  recommendation: "STRONG_FIT" | "GOOD_FIT" | "POTENTIAL_FIT" | "NOT_RECOMMENDED";
  source: "ai" | "calculated";
}

export interface CandidateRanking {
  referralId: string;
  candidateName: string;
  candidateEmail: string;
  resumeMatchScore: number;
  fitScore?: number;
  combinedScore: number;
  rank: number;
  status: string;
  parsedResume?: ParsedResume;
  matchDetails: ResumeMatchScore;
  submittedAt?: string;
  referrerName: string;
}

// ============================================
// PROMPTS
// ============================================

const RESUME_PARSING_PROMPT = `You are an expert HR professional and resume parser. Analyze this resume text that was extracted from a PDF/Word document and extract structured data.

IMPORTANT: The text may have formatting issues from PDF extraction. Look for patterns, keywords, and context clues to extract information accurately. Common sections include Contact Info, Summary/Objective, Experience/Work History, Education, Skills, Certifications.

Resume Content:
{resumeText}

Extract the following information in JSON format. ALWAYS provide the best extraction possible, even from poorly formatted text:
{
  "personalInfo": {
    "name": "Full Name (look for name at top or after 'Name:')",
    "email": "email@example.com (look for @ symbol)",
    "phone": "+1234567890 (look for phone patterns like XXX-XXX-XXXX)",
    "location": "City, Country (look near name/contact info)",
    "linkedinUrl": "linkedin.com/in/... (look for linkedin URLs)",
    "portfolioUrl": "website.com (look for personal sites, github)"
  },
  "summary": "Brief professional summary if present (look for Summary, Objective, About sections)",
  "skills": ["all", "skills", "mentioned", "throughout", "the", "resume"],
  "primarySkills": ["top", "3-5", "core", "skills", "based", "on", "experience"],
  "technicalSkills": ["programming", "languages", "frameworks", "tools", "databases"],
  "softSkills": ["leadership", "communication", "problem-solving", "teamwork"],
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "isCurrent": true,
      "duration": "X years Y months",
      "description": "Brief role description",
      "skills": ["skills", "used", "here"],
      "achievements": ["key", "achievements", "metrics"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor's/Master's/PhD",
      "field": "Computer Science",
      "graduationYear": "2020",
      "gpa": "3.8/4.0"
    }
  ],
  "certifications": ["AWS Certified", "PMP", "etc"],
  "totalYearsOfExperience": 5,
  "currentTitle": "Most Recent Job Title",
  "currentCompany": "Most Recent Company",
  "industries": ["fintech", "ecommerce", "healthcare", "etc"],
  "domains": ["backend", "fullstack", "mobile", "devops", "data"],
  "experienceLevel": "INTERN|ENTRY|MID|SENIOR|STAFF|PRINCIPAL|EXECUTIVE",
  "languages": ["English", "Spanish"]
}

Rules:
1. Extract ALL skills mentioned anywhere in the resume - look throughout the entire text
2. Normalize skill names (e.g., "React.js" → "React", "Node.JS" → "Node.js")
3. Calculate totalYearsOfExperience from work history dates
4. Infer experienceLevel: 0-1 years=ENTRY, 2-4=MID, 5-8=SENIOR, 8+=STAFF/PRINCIPAL
5. Look for email patterns (contains @), phone patterns (digits with dashes/dots)
6. If a section is unclear, make reasonable inferences from context
7. Return valid JSON only, no markdown code blocks
8. NEVER return empty arrays for skills if ANY skills are mentioned in the text
9. For experience, extract company names and job titles even if dates are unclear`;

const RESUME_MATCH_PROMPT = `You are an expert recruiter. Analyze how well this candidate's resume matches the job requirements.

Job Requirements:
Title: {jobTitle}
Required Skills: {requiredSkills}
Preferred Skills: {preferredSkills}
Experience Level: {experienceLevel}
Domain: {domain}
Industry: {industry}
Description: {jobDescription}

Candidate Resume:
{resumeSummary}
Skills: {candidateSkills}
Experience: {candidateExperience} years
Current Role: {currentTitle} at {currentCompany}

Provide a detailed match analysis in JSON format:
{
  "overall": 0-100,
  "breakdown": {
    "skillMatch": 0-100,
    "experienceMatch": 0-100,
    "industryMatch": 0-100,
    "domainMatch": 0-100,
    "seniorityMatch": 0-100,
    "educationMatch": 0-100
  },
  "matchedSkills": ["skills that match"],
  "missingSkills": ["required skills missing"],
  "strengths": ["candidate strengths for this role"],
  "concerns": ["potential concerns or gaps"],
  "recommendation": "STRONG_FIT|GOOD_FIT|POTENTIAL_FIT|NOT_RECOMMENDED"
}

Rules:
1. Be objective and thorough
2. Consider transferable skills
3. Weight required skills higher than preferred
4. Consider career trajectory
5. Return valid JSON only`;

// ============================================
// RESUME PARSING
// ============================================

/**
 * Parse resume text using AI
 */
export async function parseResume(resumeText: string): Promise<ParsedResume> {
  console.log(`[Resume Parser] Starting parse, text length: ${resumeText.length} chars`);
  console.log(`[Resume Parser] First 500 chars: ${resumeText.slice(0, 500)}`);
  
  if (!resumeText || resumeText.trim().length < 50) {
    console.warn("[Resume Parser] Resume text too short, using empty result");
    return createEmptyParsedResume();
  }
  
  if (!openai) {
    console.warn("[Resume Parser] OpenAI not configured, using static parsing");
    return staticParseResume(resumeText);
  }

  try {
    console.log("[Resume Parser] Calling OpenAI GPT-4o-mini...");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional and resume parser. Always respond with valid JSON only, no markdown code blocks. Extract as much information as possible from the resume text, even if the formatting is messy from PDF extraction.",
        },
        {
          role: "user",
          content: RESUME_PARSING_PROMPT.replace("{resumeText}", resumeText.slice(0, 10000)),
        },
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0].message.content || "{}";
    console.log(`[Resume Parser] OpenAI response length: ${rawContent.length} chars`);
    
    const parsed = JSON.parse(rawContent);
    
    // Log what was extracted
    console.log(`[Resume Parser] Extracted name: ${parsed.personalInfo?.name || "N/A"}`);
    console.log(`[Resume Parser] Extracted skills count: ${parsed.skills?.length || 0}`);
    console.log(`[Resume Parser] Extracted experience count: ${parsed.experience?.length || 0}`);
    
    // Ensure all required fields have defaults
    const result: ParsedResume = {
      personalInfo: {
        name: parsed.personalInfo?.name || null,
        email: parsed.personalInfo?.email || null,
        phone: parsed.personalInfo?.phone || null,
        location: parsed.personalInfo?.location || null,
        linkedinUrl: parsed.personalInfo?.linkedinUrl || null,
        portfolioUrl: parsed.personalInfo?.portfolioUrl || null,
      },
      summary: parsed.summary || null,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      primarySkills: Array.isArray(parsed.primarySkills) ? parsed.primarySkills : [],
      technicalSkills: Array.isArray(parsed.technicalSkills) ? parsed.technicalSkills : [],
      softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      totalYearsOfExperience: typeof parsed.totalYearsOfExperience === "number" ? parsed.totalYearsOfExperience : 0,
      currentTitle: parsed.currentTitle || null,
      currentCompany: parsed.currentCompany || null,
      industries: Array.isArray(parsed.industries) ? parsed.industries : [],
      domains: Array.isArray(parsed.domains) ? parsed.domains : [],
      experienceLevel: parsed.experienceLevel || "ENTRY",
      languages: Array.isArray(parsed.languages) ? parsed.languages : [],
      source: "ai",
      confidence: 0.9,
      parsedAt: new Date().toISOString(),
    };
    
    return result;
  } catch (error) {
    console.error("[Resume Parser] AI resume parsing failed:", error);
    return staticParseResume(resumeText);
  }
}

/**
 * Create empty parsed resume with undefined values
 */
function createEmptyParsedResume(): ParsedResume {
  return {
    personalInfo: {
      name: "Unknown",
      email: undefined,
      phone: undefined,
      location: undefined,
      linkedinUrl: undefined,
      portfolioUrl: undefined,
    },
    summary: undefined,
    skills: [],
    primarySkills: [],
    technicalSkills: [],
    softSkills: [],
    experience: [],
    education: [],
    certifications: [],
    totalYearsOfExperience: 0,
    currentTitle: undefined,
    currentCompany: undefined,
    industries: [],
    domains: [],
    experienceLevel: "ENTRY",
    languages: [],
    source: "ai",
    confidence: 0,
    parsedAt: new Date().toISOString(),
  };
}

/**
 * Static fallback for resume parsing
 */
function staticParseResume(resumeText: string): ParsedResume {
  const text = resumeText.toLowerCase();
  
  // Extract email
  const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = resumeText.match(/[\+]?[(]?[0-9]{1,3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/);
  
  // Extract skills using common patterns
  const skillPatterns = [
    /javascript|typescript|python|java|golang|rust|ruby|php|c\+\+|c#/gi,
    /react|vue|angular|svelte|nextjs|nuxt/gi,
    /nodejs|express|fastify|django|flask|spring/gi,
    /postgresql|mysql|mongodb|redis|elasticsearch/gi,
    /aws|gcp|azure|docker|kubernetes/gi,
    /git|ci\/cd|jenkins|terraform/gi,
  ];
  
  const extractedSkills = new Set<string>();
  skillPatterns.forEach(pattern => {
    const matches = resumeText.match(pattern);
    if (matches) {
      matches.forEach(m => extractedSkills.add(m.toLowerCase()));
    }
  });

  // Extract years of experience
  const yearsMatch = text.match(/(\d+)\+?\s*years?\s*(of)?\s*(experience|exp)/);
  const yearsOfExperience = yearsMatch ? parseInt(yearsMatch[1]) : 0;

  // Determine experience level
  let experienceLevel: ParsedResume["experienceLevel"] = "MID";
  if (yearsOfExperience <= 1) experienceLevel = "ENTRY";
  else if (yearsOfExperience <= 3) experienceLevel = "MID";
  else if (yearsOfExperience <= 7) experienceLevel = "SENIOR";
  else if (yearsOfExperience <= 12) experienceLevel = "STAFF";
  else experienceLevel = "PRINCIPAL";

  return {
    personalInfo: {
      name: "",
      email: emailMatch?.[0],
      phone: phoneMatch?.[0],
    },
    skills: Array.from(extractedSkills),
    primarySkills: Array.from(extractedSkills).slice(0, 5),
    technicalSkills: Array.from(extractedSkills),
    softSkills: [],
    experience: [],
    education: [],
    certifications: [],
    totalYearsOfExperience: yearsOfExperience,
    industries: [],
    domains: [],
    experienceLevel,
    source: "static",
    confidence: 0.4,
    parsedAt: new Date().toISOString(),
  };
}

// ============================================
// RESUME MATCHING
// ============================================

/**
 * Calculate match score between resume and job
 */
export async function calculateResumeMatchScore(
  parsedResume: ParsedResume,
  jobId: string
): Promise<ResumeMatchScore> {
  // Get job with tags
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { jobTag: true },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  const jobTags = job.jobTag;
  const jobSkills = jobTags?.skills || [];
  const jobRequiredSkills = jobTags?.requiredSkills || [];
  const jobPreferredSkills = jobTags?.preferredSkills || [];
  const jobDomains = jobTags?.domains || [];
  const jobIndustry = jobTags?.industry;
  const jobExperienceLevel = jobTags?.experienceLevel || job.experienceLevel || "MID";

  // Try AI-based matching if available
  if (openai) {
    try {
      const matchScore = await aiCalculateMatchScore(parsedResume, job, jobTags);
      return matchScore;
    } catch (error) {
      console.error("AI match scoring failed, using calculation:", error);
    }
  }

  // Fallback to calculated matching
  return calculatedMatchScore(parsedResume, {
    skills: jobSkills,
    requiredSkills: jobRequiredSkills,
    preferredSkills: jobPreferredSkills,
    domains: jobDomains,
    industry: jobIndustry || "",
    experienceLevel: jobExperienceLevel,
  });
}

/**
 * AI-based match score calculation
 */
async function aiCalculateMatchScore(
  parsedResume: ParsedResume,
  job: { title: string; description: string },
  jobTags: {
    skills?: string[];
    requiredSkills?: string[];
    preferredSkills?: string[];
    domains?: string[];
    industry?: string | null;
    experienceLevel?: string;
  } | null
): Promise<ResumeMatchScore> {
  const prompt = RESUME_MATCH_PROMPT
    .replace("{jobTitle}", job.title)
    .replace("{requiredSkills}", (jobTags?.requiredSkills || jobTags?.skills || []).join(", "))
    .replace("{preferredSkills}", (jobTags?.preferredSkills || []).join(", "))
    .replace("{experienceLevel}", jobTags?.experienceLevel || "MID")
    .replace("{domain}", (jobTags?.domains || []).join(", "))
    .replace("{industry}", jobTags?.industry || "tech")
    .replace("{jobDescription}", job.description.slice(0, 1000))
    .replace("{resumeSummary}", parsedResume.summary || "Not provided")
    .replace("{candidateSkills}", parsedResume.skills.join(", "))
    .replace("{candidateExperience}", String(parsedResume.totalYearsOfExperience))
    .replace("{currentTitle}", parsedResume.currentTitle || "Not specified")
    .replace("{currentCompany}", parsedResume.currentCompany || "Not specified");

  const completion = await openai!.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert recruiter. Respond with valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content || "{}");
  
  return {
    ...result,
    source: "ai",
  };
}

/**
 * Calculate match score using weighted algorithm
 */
function calculatedMatchScore(
  parsedResume: ParsedResume,
  jobRequirements: {
    skills: string[];
    requiredSkills: string[];
    preferredSkills: string[];
    domains: string[];
    industry: string;
    experienceLevel: string;
  }
): ResumeMatchScore {
  const candidateSkills = parsedResume.skills.map(s => s.toLowerCase());
  const requiredSkills = jobRequirements.requiredSkills.map(s => s.toLowerCase());
  const preferredSkills = jobRequirements.preferredSkills.map(s => s.toLowerCase());
  const allJobSkills = [...new Set([...requiredSkills, ...preferredSkills])];

  // Skill matching
  const matchedRequired = requiredSkills.filter(s => candidateSkills.includes(s));
  const matchedPreferred = preferredSkills.filter(s => candidateSkills.includes(s));
  const matchedSkills = [...new Set([...matchedRequired, ...matchedPreferred])];
  const missingSkills = requiredSkills.filter(s => !candidateSkills.includes(s));

  const skillMatchScore = allJobSkills.length > 0
    ? ((matchedRequired.length / Math.max(requiredSkills.length, 1)) * 0.7 +
       (matchedPreferred.length / Math.max(preferredSkills.length, 1)) * 0.3) * 100
    : 50;

  // Experience matching
  const experienceLevels = ["INTERN", "ENTRY", "MID", "SENIOR", "STAFF", "PRINCIPAL", "EXECUTIVE"];
  const candidateLevel = experienceLevels.indexOf(parsedResume.experienceLevel);
  const jobLevel = experienceLevels.indexOf(jobRequirements.experienceLevel);
  const levelDiff = Math.abs(candidateLevel - jobLevel);
  const seniorityMatchScore = Math.max(0, 100 - levelDiff * 20);

  // Domain matching
  const candidateDomains = parsedResume.domains.map(d => d.toLowerCase());
  const jobDomains = jobRequirements.domains.map(d => d.toLowerCase());
  const domainMatch = jobDomains.some(d => candidateDomains.includes(d));
  const domainMatchScore = domainMatch ? 100 : 40;

  // Industry matching
  const candidateIndustries = parsedResume.industries.map(i => i.toLowerCase());
  const industryMatch = candidateIndustries.includes(jobRequirements.industry.toLowerCase());
  const industryMatchScore = industryMatch ? 100 : 50;

  // Education score (simplified)
  const educationScore = parsedResume.education.length > 0 ? 80 : 50;

  // Calculate overall score with weights
  const overall = Math.round(
    skillMatchScore * 0.35 +
    seniorityMatchScore * 0.20 +
    domainMatchScore * 0.15 +
    industryMatchScore * 0.15 +
    (parsedResume.totalYearsOfExperience > 0 ? 85 : 50) * 0.10 +
    educationScore * 0.05
  );

  // Generate strengths and concerns
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (matchedRequired.length / Math.max(requiredSkills.length, 1) >= 0.7) {
    strengths.push(`Strong skill match (${matchedRequired.length}/${requiredSkills.length} required skills)`);
  }
  if (levelDiff === 0) {
    strengths.push("Experience level matches job requirements");
  }
  if (domainMatch) {
    strengths.push("Relevant domain experience");
  }

  if (missingSkills.length > 0) {
    concerns.push(`Missing skills: ${missingSkills.slice(0, 3).join(", ")}`);
  }
  if (levelDiff > 2) {
    concerns.push("Experience level mismatch");
  }

  // Recommendation
  let recommendation: ResumeMatchScore["recommendation"];
  if (overall >= 80) recommendation = "STRONG_FIT";
  else if (overall >= 65) recommendation = "GOOD_FIT";
  else if (overall >= 45) recommendation = "POTENTIAL_FIT";
  else recommendation = "NOT_RECOMMENDED";

  return {
    overall,
    breakdown: {
      skillMatch: Math.round(skillMatchScore),
      experienceMatch: Math.round((parsedResume.totalYearsOfExperience > 0 ? 85 : 50)),
      industryMatch: Math.round(industryMatchScore),
      domainMatch: Math.round(domainMatchScore),
      seniorityMatch: Math.round(seniorityMatchScore),
      educationMatch: Math.round(educationScore),
    },
    matchedSkills,
    missingSkills,
    strengths,
    concerns,
    recommendation,
    source: "calculated",
  };
}

// ============================================
// CANDIDATE RANKING
// ============================================

/**
 * Get ranked candidates for a job based on resume match scores
 */
export async function getRankedCandidates(
  jobId: string,
  options?: {
    status?: string[];
    minScore?: number;
    limit?: number;
  }
): Promise<CandidateRanking[]> {
  const statusFilter = options?.status || ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEWING"];
  const minScore = options?.minScore || 0;
  const limit = options?.limit || 50;

  // Get referrals with parsed resumes
  const referrals = await prisma.referral.findMany({
    where: {
      jobId,
      status: { in: statusFilter as any[] },
    },
    include: {
      referrer: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rankings: CandidateRanking[] = [];

  for (const referral of referrals) {
    // Get or calculate match score
    let matchDetails: ResumeMatchScore;
    let parsedResume: ParsedResume | undefined;

    // Check if we have stored parsed resume data
    const storedData = (referral as any).parsedResumeData as ParsedResume | null;
    const storedScore = (referral as any).resumeMatchScore as ResumeMatchScore | null;

    if (storedData && storedScore) {
      parsedResume = storedData;
      matchDetails = storedScore;
    } else if (storedData) {
      // Have parsed data but no score - calculate it
      parsedResume = storedData;
      matchDetails = await calculateResumeMatchScore(parsedResume, jobId);
    } else {
      // No resume data - create default score
      matchDetails = {
        overall: 50,
        breakdown: {
          skillMatch: 50,
          experienceMatch: 50,
          industryMatch: 50,
          domainMatch: 50,
          seniorityMatch: 50,
          educationMatch: 50,
        },
        matchedSkills: [],
        missingSkills: [],
        strengths: ["Referred by network member"],
        concerns: ["No resume uploaded for analysis"],
        recommendation: "POTENTIAL_FIT",
        source: "calculated",
      };
    }

    // Calculate combined score (resume match + fit score if available)
    const resumeScore = matchDetails.overall;
    const fitScore = (referral as any).fitScore || null;
    const combinedScore = fitScore
      ? Math.round(resumeScore * 0.6 + fitScore * 0.4)
      : resumeScore;

    if (combinedScore >= minScore) {
      rankings.push({
        referralId: referral.id,
        candidateName: referral.candidateName,
        candidateEmail: referral.candidateEmail,
        resumeMatchScore: resumeScore,
        fitScore,
        combinedScore,
        rank: 0, // Will be set after sorting
        status: referral.status,
        parsedResume,
        matchDetails,
        submittedAt: referral.submittedAt?.toISOString(),
        referrerName: referral.referrer.name,
      });
    }
  }

  // Sort by combined score and assign ranks
  rankings.sort((a, b) => b.combinedScore - a.combinedScore);
  rankings.forEach((r, i) => {
    r.rank = i + 1;
  });

  return rankings.slice(0, limit);
}

/**
 * Store parsed resume data for a referral
 */
export async function storeResumeData(
  referralId: string,
  parsedResume: ParsedResume,
  matchScore: ResumeMatchScore
): Promise<void> {
  await prisma.referral.update({
    where: { id: referralId },
    data: {
      // Store in statusHistory as JSON since we don't have dedicated columns yet
      statusHistory: {
        // Preserve existing history and add resume data
        parsedResumeData: parsedResume,
        resumeMatchScore: matchScore,
      } as any,
    },
  });
}

// ============================================
// FILE HANDLING
// ============================================

/**
 * Extract text from PDF resume using pdf-parse
 */
export async function extractTextFromResume(
  file: File | Buffer,
  mimeType: string
): Promise<string> {
  try {
    // Convert File to Buffer if needed
    let buffer: Buffer;
    if (file instanceof Buffer) {
      buffer = file;
    } else if ("arrayBuffer" in file && typeof file.arrayBuffer === "function") {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      console.error("Invalid file input");
      return "";
    }

    // For text files
    if (mimeType === "text/plain") {
      return buffer.toString("utf-8");
    }

    // For PDF files - use unpdf (serverless-compatible)
    if (mimeType === "application/pdf") {
      try {
        const { extractText } = await import("unpdf");
        
        // Extract text from PDF buffer
        const uint8Array = new Uint8Array(buffer);
        const { text } = await extractText(uint8Array);
        // text is an array of strings (one per page), join them
        const extractedText = Array.isArray(text) ? text.join("\n\n") : String(text);
        
        if (!extractedText || extractedText.trim().length < 50) {
          console.warn("PDF extraction returned minimal text, may be image-based PDF");
          return extractedText || "";
        }
        
        // Clean up the text
        const cleanedText = extractedText
          .replace(/\r\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .replace(/[ \t]{2,}/g, " ")
          .trim();
        
        console.log(`Extracted ${cleanedText.length} characters from PDF`);
        return cleanedText;
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        return "";
      }
    }

    // For Word documents - use mammoth with dynamic import
    if (mimeType.includes("word") || mimeType.includes("docx") || mimeType.includes("msword")) {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        const extractedText = result.value;
        
        if (!extractedText || extractedText.trim().length < 50) {
          console.warn("Word doc extraction returned minimal text");
          return extractedText || "";
        }
        
        // Clean up the text
        const cleanedText = extractedText
          .replace(/\r\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .replace(/[ \t]{2,}/g, " ")
          .trim();
        
        console.log(`Extracted ${cleanedText.length} characters from Word document`);
        return cleanedText;
      } catch (docError) {
        console.error("Word document parsing error:", docError);
        return "";
      }
    }

    console.warn(`Unsupported file type: ${mimeType}`);
    return "";
  } catch (error) {
    console.error("Text extraction error:", error);
    return "";
  }
}
