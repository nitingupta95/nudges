import OpenAI from "openai";

/**
 * AI Service for GenAI-powered features
 * Uses OpenAI for job description summarization
 */

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })
    : null;

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

/**
 * Generate AI-powered job description summary
 * Returns 3 bullet points highlighting key aspects
 */
export async function summarizeJobDescription(
    title: string,
    description: string
): Promise<JobSummary> {
    // Fallback to static parsing if OpenAI is not configured
    if (!openai) {
        console.warn("OpenAI API key not configured, using static parsing");
        return generateStaticSummary(title, description);
    }

    try {
        const prompt = `You are a job description summarizer. Given a job title and description, create exactly 3 concise bullet points (max 15 words each) that highlight:
1. The main responsibility or focus area
2. Key technical skills or requirements
3. Team/impact or unique aspect

Job Title: ${title}
Job Description: ${description}

Return ONLY the 3 bullet points, one per line, starting with a dash (-). Be specific and actionable.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a concise job description summarizer. Always return exactly 3 bullet points.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.3,
            max_tokens: 200,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content returned from OpenAI");
        }

        // Parse bullet points from response
        const bullets = content
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.startsWith("-") || line.match(/^\d+\./))
            .map((line) => line.replace(/^[-\d.]\s*/, "").trim())
            .filter((line) => line.length > 0)
            .slice(0, 3);

        // Ensure we have exactly 3 bullets
        if (bullets.length < 3) {
            console.warn("AI returned fewer than 3 bullets, using static fallback");
            return generateStaticSummary(title, description);
        }

        return {
            bullets,
            source: "ai",
            generatedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error("Error generating AI summary:", error);
        // Fallback to static parsing on error
        return generateStaticSummary(title, description);
    }
}

/**
 * Static fallback parser for job descriptions
 * Extracts key information without AI
 */
function generateStaticSummary(
    title: string,
    description: string
): JobSummary {
    const bullets: string[] = [];

    // Extract first sentence or first 100 chars as main responsibility
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

    // Look for skills/requirements section
    const skillsMatch = description.match(
        /(?:skills?|requirements?|qualifications?)[:\s]+([^.]+)/i
    );
    if (skillsMatch && skillsMatch[1]) {
        const skillsText = skillsMatch[1].trim();
        bullets.push(
            skillsText.length > 80
                ? skillsText.substring(0, 77) + "..."
                : skillsText
        );
    } else {
        bullets.push("Strong technical skills and problem-solving abilities required");
    }

    // Look for experience or impact
    const experienceMatch = description.match(
        /(?:experience|years?|impact)[:\s]+([^.]+)/i
    );
    if (experienceMatch && experienceMatch[1]) {
        const expText = experienceMatch[1].trim();
        bullets.push(
            expText.length > 80 ? expText.substring(0, 77) + "..." : expText
        );
    } else {
        bullets.push("Opportunity to make significant impact on product and users");
    }

    return {
        bullets: bullets.slice(0, 3),
        source: "static",
        generatedAt: new Date().toISOString(),
    };
}

/**
 * Batch summarize multiple jobs
 * Useful for dashboard loading
 */
export async function batchSummarizeJobs(
    jobs: Array<{ id: string; title: string; description: string }>
): Promise<Map<string, JobSummary>> {
    const summaries = new Map<string, JobSummary>();

    // Process jobs in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize);
        const results = await Promise.all(
            batch.map(async (job) => ({
                id: job.id,
                summary: await summarizeJobDescription(job.title, job.description),
            }))
        );

        results.forEach(({ id, summary }) => {
            summaries.set(id, summary);
        });
    }

    return summaries;
}
/**
 * Extract contact insights from job description
 * Identifies key roles and departments to reach out to
 */
export async function extractContactInsights(
    jobTitle: string,
    jobDescription: string,
    company?: string
): Promise<ContactInsights> {
    if (!openai) {
        console.warn("OpenAI API key not configured, using static parsing");
        return generateStaticContactInsights(jobTitle, jobDescription, company);
    }

    try {
        const prompt = `You are an expert recruiter. Given a job posting, identify key people to reach out to for a referral.

Job Title: ${jobTitle}
Company: ${company || "Unknown"}
Job Description: ${jobDescription}

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

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a recruiting expert. Always respond with valid JSON only, no markdown or extra text.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.3,
            max_tokens: 300,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content returned from OpenAI");
        }

        // Parse JSON response
        const parsed = JSON.parse(content);

        return {
            roles: (parsed.roles || []).slice(0, 3),
            departments: (parsed.departments || []).slice(0, 3),
            description: parsed.description || "Reach out to the hiring manager or team lead.",
            source: "ai",
            generatedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error("Error extracting contact insights:", error);
        return generateStaticContactInsights(jobTitle, jobDescription, company);
    }
}

/**
 * Static fallback for contact insights
 */
function generateStaticContactInsights(
    jobTitle: string,
    jobDescription: string,
    company?: string
): ContactInsights {
    // Determine roles based on job title and description
    const roles: string[] = [];
    const departments: string[] = [];

    // Common hiring roles
    if (
        jobTitle.toLowerCase().includes("manager") ||
        jobTitle.toLowerCase().includes("lead")
    ) {
        roles.push("Engineering Manager");
        roles.push("Director of Engineering");
    } else if (jobTitle.toLowerCase().includes("designer")) {
        roles.push("Design Lead");
        roles.push("Product Manager");
    } else if (jobTitle.toLowerCase().includes("product")) {
        roles.push("Product Manager");
        roles.push("Head of Product");
    } else {
        roles.push("Hiring Manager");
        roles.push("Team Lead");
    }

    // Determine departments
    if (
        jobDescription.toLowerCase().includes("engineer") ||
        jobDescription.toLowerCase().includes("developer")
    ) {
        departments.push("Engineering");
    }
    if (jobDescription.toLowerCase().includes("product")) {
        departments.push("Product");
    }
    if (jobDescription.toLowerCase().includes("design")) {
        departments.push("Design");
    }
    if (departments.length === 0) {
        departments.push("Hiring Team");
    }

    departments.push("HR/People Ops");

    return {
        roles: roles.slice(0, 3),
        departments: departments.slice(0, 3),
        description: `Reach out to the ${roles[0]} or ${roles[1] || "team lead"} at ${company || "the company"} to discuss this opportunity.`,
        source: "static",
        generatedAt: new Date().toISOString(),
    };
}