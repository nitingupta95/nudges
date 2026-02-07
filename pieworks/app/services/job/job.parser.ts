import { JobTag } from '@prisma/client';

interface ParsedJob {
  skills: string[];
  experienceLevel: string;
  domain: string;
}

const experienceLevelMap: Record<string, string> = {
  'entry': 'Entry Level',
  'mid': 'Mid Level',
  'senior': 'Senior Level',
};

const parseJobDescription = (description: string): ParsedJob => {
  const skills: string[] = [];
  let experienceLevel = '';
  let domain = '';

  // Example parsing logic (this can be extended)
  const skillRegex = /(?:skills?:?\s*|required skills?:?\s*)([\w\s,]+)/i;
  const experienceRegex = /(?:experience level?:?\s*)(entry|mid|senior)/i;
  const domainRegex = /(?:domain?:?\s*)([\w\s]+)/i;

  const skillMatch = description.match(skillRegex);
  if (skillMatch && skillMatch[1]) {
    skills.push(...skillMatch[1].split(',').map(skill => skill.trim()));
  }

  const experienceMatch = description.match(experienceRegex);
  if (experienceMatch && experienceMatch[1]) {
    experienceLevel = experienceLevelMap[experienceMatch[1]] || '';
  }

  const domainMatch = description.match(domainRegex);
  if (domainMatch && domainMatch[1]) {
    domain = domainMatch[1].trim();
  }

  return { skills, experienceLevel, domain };
};

export const parseJob = (jobDescription: string): JobTag => {
  const parsedData = parseJobDescription(jobDescription);
  return {
    skills: parsedData.skills,
    experienceLevel: parsedData.experienceLevel,
    domain: parsedData.domain,
  };
};