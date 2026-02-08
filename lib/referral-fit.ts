/**
 * Referral Fit Calculation System
 * 
 * Calculates how well a job matches a member's profile/network
 * Uses explainable logic (NOT AI-based) for transparency
 */

import type { Job, MemberProfile } from "@/types";

export type FitLevel = "good" | "medium" | "low";

export interface FitScore {
    score: number; // 0-100
    level: FitLevel;
    breakdown: {
        skillMatch: number; // 0-100
        domainMatch: number; // 0-100
        experienceMatch: number; // 0-100
    };
}

export interface SmartNudge {
    message: string;
    reason: "skill_match" | "domain_match" | "experience_match" | "company_match";
}

/**
 * Calculate fit score between a job and member profile
 */
export function calculateFitScore(
    job: Job,
    memberProfile: MemberProfile | null
): FitScore {
    // Default score if no profile
    if (!memberProfile) {
        return {
            score: 0,
            level: "low",
            breakdown: {
                skillMatch: 0,
                domainMatch: 0,
                experienceMatch: 0,
            },
        };
    }

    // Calculate skill overlap
    const jobSkills = job.skills || [];
    const memberSkills = memberProfile.skills || [];
    const skillOverlap = jobSkills.filter((skill) =>
        memberSkills.some((ms) => ms.toLowerCase() === skill.toLowerCase())
    ).length;
    const skillMatch = jobSkills.length > 0
        ? (skillOverlap / jobSkills.length) * 100
        : 0;

    // Calculate domain overlap
    const jobDomains = job.domains || (job.domain ? [job.domain] : []);
    const memberDomains = memberProfile.domains || [];
    const domainOverlap = jobDomains.filter((domain) =>
        memberDomains.some((md) => md.toLowerCase() === domain.toLowerCase())
    ).length;
    const domainMatch = jobDomains.length > 0
        ? (domainOverlap / jobDomains.length) * 100
        : 0;

    // Calculate experience level match
    const experienceMatch =
        job.experienceLevel === memberProfile.experienceLevel ? 100 : 0;

    // Weighted score calculation
    // Skills: 50%, Domain: 30%, Experience: 20%
    const totalScore =
        skillMatch * 0.5 +
        domainMatch * 0.3 +
        experienceMatch * 0.2;

    return {
        score: Math.round(totalScore),
        level: getFitLevel(totalScore),
        breakdown: {
            skillMatch: Math.round(skillMatch),
            domainMatch: Math.round(domainMatch),
            experienceMatch: Math.round(experienceMatch),
        },
    };
}

/**
 * Map score to fit level
 */
export function getFitLevel(score: number): FitLevel {
    if (score >= 70) return "good";
    if (score >= 40) return "medium";
    return "low";
}

/**
 * Generate smart nudge based on job and profile match
 */
export function generateSmartNudge(
    job: Job,
    memberProfile: MemberProfile | null,
    fitScore: FitScore
): SmartNudge | null {
    if (!memberProfile || fitScore.level === "low") {
        return null;
    }

    const { breakdown } = fitScore;

    // Skill-based nudge
    if (breakdown.skillMatch >= 50) {
        const matchingSkills = (job.skills || []).filter((skill) =>
            (memberProfile.skills || []).some(
                (ms) => ms.toLowerCase() === skill.toLowerCase()
            )
        );

        if (matchingSkills.length > 0) {
            const skillList = matchingSkills.slice(0, 2).join(", ");
            return {
                message: `You might know ${skillList} engineers from your network`,
                reason: "skill_match",
            };
        }
    }

    // Domain-based nudge
    if (breakdown.domainMatch >= 50) {
        const jobDomains = job.domains || (job.domain ? [job.domain] : []);
        const matchingDomains = jobDomains.filter((domain) =>
            (memberProfile.domains || []).some(
                (md) => md.toLowerCase() === domain.toLowerCase()
            )
        );

        if (matchingDomains.length > 0) {
            return {
                message: `Your ${matchingDomains[0]} experience could help find great candidates`,
                reason: "domain_match",
            };
        }
    }

    // Company-based nudge
    const jobCompany = typeof job.company === "string" ? job.company : job.company.name;
    if (memberProfile.pastCompanies?.includes(jobCompany)) {
        return {
            message: `You worked at ${jobCompany} - perfect for referrals!`,
            reason: "company_match",
        };
    }

    // Experience level nudge
    if (breakdown.experienceMatch === 100) {
        return {
            message: `This ${job.experienceLevel} role matches your network level`,
            reason: "experience_match",
        };
    }

    return null;
}

/**
 * Get fit badge color classes
 */
export function getFitBadgeVariant(level: FitLevel): "default" | "secondary" | "outline" {
    switch (level) {
        case "good":
            return "default"; // Green/primary color
        case "medium":
            return "secondary"; // Yellow/warning color
        case "low":
            return "outline"; // Gray/muted color
    }
}

/**
 * Get fit badge label
 */
export function getFitBadgeLabel(level: FitLevel): string {
    switch (level) {
        case "good":
            return "Good fit for your network";
        case "medium":
            return "Medium fit";
        case "low":
            return "Low fit";
    }
}
