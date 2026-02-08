import { Job, MemberProfile } from "@/lib/generated/prisma/client";
import OpenAI from "openai";

/**
 * AI Service for referral nudge generation
 */
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  : null;

export interface NudgeResult {
  nudges: string[];
  source: "ai" | "dummy";
  explain?: string;
}

/**
 * Generate AI-powered referral nudges using OpenAI
 */
async function generateAINudges(
  job: Job,
  profile: MemberProfile
): Promise<string[]> {
  if (!openai) {
    throw new Error("OpenAI not configured");
  }

  const prompt = `You are a referral matching expert. Given a job posting and a user's professional profile, suggest 3-5 specific types of people they should reach out to for referrals.

Job: ${job.title}
Company: ${job.company}
Domain: ${job.domain}
Experience: ${job.experienceLevel}
Description: ${job.description.substring(0, 500)}

User Profile:
- Skills: ${profile.skills.join(", ") || "None"}
- Past Companies: ${profile.pastCompanies.join(", ") || "None"}
- Domains: ${profile.domains.join(", ") || "None"}
- Experience: ${profile.yearsOfExperience || 0} years

Return ONLY a JSON object with a "nudges" key containing an array of 3-5 short, specific suggestions (max 12 words each).
Example format: {"nudges": ["Former colleagues from Google who worked in payments", "Friends with React and Node.js experience", "College alumni in fintech industry"]}

Be specific and actionable. Focus on realistic connections the user might have.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a referral matching expert. Always return a valid JSON array of 3-5 concise suggestions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 150,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenAI");
  }

  // Parse the JSON response
  const parsed = JSON.parse(content);
  let nudges: string[] = [];

  // Handle different response formats
  if (Array.isArray(parsed)) {
    nudges = parsed;
  } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
    nudges = parsed.suggestions;
  } else if (parsed.nudges && Array.isArray(parsed.nudges)) {
    nudges = parsed.nudges;
  } else {
    throw new Error("Invalid response format from OpenAI");
  }

  // Validate and clean nudges
  nudges = nudges
    .filter((n) => typeof n === "string" && n.length > 0)
    .map((n) => n.trim())
    .slice(0, 5);

  if (nudges.length === 0) {
    throw new Error("No valid nudges generated");
  }

  return nudges;
}

/**
 * Generate dummy/fallback nudges when AI is unavailable
 */
function generateDummyNudges(job: Job, profile: MemberProfile): string[] {
  const nudges: string[] = [];

  // Match skills from the member profile with job description
  const matchingSkills = profile.skills.filter((skill) =>
    job.description.toLowerCase().includes(skill.toLowerCase())
  );

  if (matchingSkills.length > 0) {
    nudges.push(
      `People you've worked with on ${matchingSkills.slice(0, 2).join(" or ")}`
    );
  }

  // Match past companies
  if (profile.pastCompanies.length > 0) {
    nudges.push(
      `Ex-colleagues from ${profile.pastCompanies[0]}`
    );
  }

  // Match domains
  const matchingDomains = profile.domains.filter((domain) =>
    job.domain.toLowerCase().includes(domain.toLowerCase())
  );

  if (matchingDomains.length > 0) {
    nudges.push(
      `Connections in the ${matchingDomains[0]} industry`
    );
  }

  // Experience level based suggestions
  if (job.experienceLevel) {
    const expLevel = job.experienceLevel.toString().toLowerCase();
    if (expLevel.includes("senior") || expLevel.includes("staff")) {
      nudges.push("Senior professionals in your network");
    } else if (expLevel.includes("mid")) {
      nudges.push("Mid-level professionals you've worked with");
    } else {
      nudges.push("Recent graduates or early-career professionals");
    }
  }

  // General suggestions
  nudges.push("Friends or relatives interested in this opportunity");
  nudges.push("College alumni or bootcamp peers");

  // Deduplicate and return 3-5 nudges
  return Array.from(new Set(nudges)).slice(0, 5);
}

/**
 * Main function to generate referral nudges
 * Tries AI first, falls back to dummy data on error
 */
export async function generateNudges(
  job: Job,
  profile: MemberProfile
): Promise<NudgeResult> {
  // Try AI generation with timeout
  if (openai) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI request timeout")), 5000)
      );

      const nudgesPromise = generateAINudges(job, profile);
      const nudges = await Promise.race([nudgesPromise, timeoutPromise]);

      console.log(`✓ Generated ${nudges.length} AI-powered nudges for job ${job.id}`);

      return {
        nudges,
        source: "ai",
      };
    } catch (error) {
      console.warn("AI nudge generation failed, using fallback:", error);
    }
  }

  // Fallback to dummy data
  const nudges = generateDummyNudges(job, profile);

  console.log(`✓ Generated ${nudges.length} dummy nudges for job ${job.id}`);

  return {
    nudges,
    source: "dummy",
    explain: openai
      ? "AI temporarily unavailable - showing example suggestions"
      : "AI not configured - showing example suggestions",
  };
}