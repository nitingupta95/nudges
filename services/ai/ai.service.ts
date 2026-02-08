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
