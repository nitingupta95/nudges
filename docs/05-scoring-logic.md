# Scoring Logic & Matching Engine

## Overview

This document explains the scoring algorithms and matching logic used to determine the probability that a member knows someone suitable for a job opening.

---

## 🎯 Core Objective

**Goal:** Score the probability that a member knows someone suitable for a job.

**Key Insight:** We cannot see member connections, so we infer network relevance from:
- Work history overlap
- Skill proximity
- Industry exposure
- Seniority alignment
- Geographic patterns

---

## 📊 Matching Dimensions

### Dimension Weights

| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| Company Overlap | 0.25 | Strongest signal - ex-colleagues likely know similar professionals |
| Skill Overlap | 0.25 | Direct skill match indicates relevant network |
| Industry Overlap | 0.20 | Same industry means overlapping professional circles |
| Domain Similarity | 0.15 | Functional domain alignment |
| Seniority Match | 0.10 | Similar career stage implies peer connections |
| Location Proximity | 0.05 | Geographic networks matter but less in remote era |

**Total:** 1.00

---

## 🧮 Scoring Algorithm

### Overall Match Score

```typescript
interface MatchScore {
  overall: number;           // 0-100
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  breakdown: ScoreBreakdown;
  reasons: MatchReason[];
}

function calculateMatchScore(
  member: MemberProfile,
  job: JobWithTags
): MatchScore {
  const weights = {
    skillOverlap: 0.25,
    companyOverlap: 0.25,
    industryOverlap: 0.20,
    domainSimilarity: 0.15,
    seniorityMatch: 0.10,
    locationProximity: 0.05
  };

  const scores = {
    skillOverlap: calculateSkillOverlap(member.skills, job.skills),
    companyOverlap: calculateCompanyOverlap(member.pastCompanies, job.company, job.targetCompanies),
    industryOverlap: calculateIndustryOverlap(member.industries, job.industry),
    domainSimilarity: calculateDomainSimilarity(member.domains, job.domain),
    seniorityMatch: calculateSeniorityMatch(member.experienceLevel, job.experienceLevel),
    locationProximity: calculateLocationProximity(member.location, job.location)
  };

  const overall = Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + (scores[key] * weight * 100),
    0
  );

  return {
    overall: Math.round(overall),
    tier: getMatchTier(overall),
    breakdown: scores,
    reasons: generateReasons(member, job, scores)
  };
}

function getMatchTier(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}
```

---

## 📐 Individual Score Calculations

### 1. Skill Overlap Score

Measures how many skills match between member and job.

```typescript
function calculateSkillOverlap(
  memberSkills: string[],
  jobSkills: string[]
): number {
  if (jobSkills.length === 0) return 0.5; // Neutral if no skills specified

  const normalizedMemberSkills = memberSkills.map(s => normalizeSkill(s));
  const normalizedJobSkills = jobSkills.map(s => normalizeSkill(s));

  // Direct matches
  const directMatches = normalizedJobSkills.filter(
    skill => normalizedMemberSkills.includes(skill)
  );

  // Semantic similarity for non-matches (using skill taxonomy)
  const semanticMatches = normalizedJobSkills.filter(
    skill => !directMatches.includes(skill) && 
             hasSemanticMatch(skill, normalizedMemberSkills)
  );

  const matchCount = directMatches.length + (semanticMatches.length * 0.7);
  const maxPossible = jobSkills.length;

  // Use Jaccard-like scoring with bonus for high coverage
  const rawScore = matchCount / maxPossible;
  
  // Boost score if member has additional relevant skills
  const coverageBonus = Math.min(0.1, (memberSkills.length - matchCount) * 0.02);

  return Math.min(1.0, rawScore + coverageBonus);
}

// Skill normalization
function normalizeSkill(skill: string): string {
  const aliases: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'react.js': 'react',
    'node.js': 'nodejs',
    'postgres': 'postgresql',
    'gcp': 'google cloud',
    'aws': 'amazon web services'
  };
  
  const normalized = skill.toLowerCase().trim();
  return aliases[normalized] || normalized;
}

// Semantic skill matching using taxonomy
function hasSemanticMatch(skill: string, memberSkills: string[]): boolean {
  const skillGroups: Record<string, string[]> = {
    'frontend': ['react', 'vue', 'angular', 'svelte', 'javascript', 'typescript'],
    'backend': ['nodejs', 'python', 'golang', 'java', 'ruby', 'rust'],
    'database': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch'],
    'cloud': ['aws', 'gcp', 'azure', 'kubernetes', 'docker'],
    'ml': ['tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy']
  };

  for (const [group, skills] of Object.entries(skillGroups)) {
    if (skills.includes(skill) && skills.some(s => memberSkills.includes(s))) {
      return true;
    }
  }
  return false;
}
```

**Example:**
- Member skills: `[react, typescript, nodejs, postgresql]`
- Job skills: `[react, typescript, graphql, redis]`
- Direct matches: 2 (react, typescript)
- Semantic matches: 0.7 (redis ≈ postgresql in database group)
- Score: (2 + 0.7) / 4 = 0.675 (67.5%)

---

### 2. Company Overlap Score

Measures connection potential based on shared company experience.

```typescript
function calculateCompanyOverlap(
  memberCompanies: string[],
  jobCompany: string,
  targetCompanies: string[] = []
): number {
  const normalizedMemberCompanies = memberCompanies.map(c => normalizeCompany(c));
  const normalizedJobCompany = normalizeCompany(jobCompany);
  
  // Highest signal: Member worked at the hiring company
  if (normalizedMemberCompanies.includes(normalizedJobCompany)) {
    return 1.0; // Perfect match
  }

  // High signal: Member worked at a target company
  const targetMatches = targetCompanies.filter(
    tc => normalizedMemberCompanies.includes(normalizeCompany(tc))
  );
  if (targetMatches.length > 0) {
    return 0.8 + (0.1 * Math.min(targetMatches.length, 2));
  }

  // Medium signal: Member worked at companies in same category
  const companyCategory = getCompanyCategory(jobCompany);
  const categoryMatches = normalizedMemberCompanies.filter(
    mc => getCompanyCategory(mc) === companyCategory
  );
  if (categoryMatches.length > 0) {
    return 0.5 + (0.1 * Math.min(categoryMatches.length, 3));
  }

  // Low signal: No direct overlap
  return 0.2;
}

function normalizeCompany(company: string): string {
  return company.toLowerCase()
    .replace(/\s*(inc|llc|ltd|pvt|private|limited|corporation|corp)\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCompanyCategory(company: string): string {
  const categories: Record<string, string[]> = {
    'faang': ['google', 'meta', 'facebook', 'amazon', 'apple', 'netflix', 'microsoft'],
    'indian_unicorn': ['flipkart', 'razorpay', 'swiggy', 'zomato', 'cred', 'phonepe', 'paytm'],
    'fintech': ['stripe', 'razorpay', 'paytm', 'phonepe', 'cred', 'groww'],
    'ecommerce': ['amazon', 'flipkart', 'myntra', 'meesho', 'shopify'],
    'consulting': ['mckinsey', 'bcg', 'bain', 'deloitte', 'accenture']
  };

  const normalized = normalizeCompany(company);
  for (const [category, companies] of Object.entries(categories)) {
    if (companies.some(c => normalized.includes(c))) {
      return category;
    }
  }
  return 'other';
}
```

**Example:**
- Member worked at: `[Razorpay, Flipkart]`
- Job company: `Razorpay`
- Score: 1.0 (direct match - highest confidence)

---

### 3. Industry Overlap Score

Measures industry alignment between member experience and job.

```typescript
function calculateIndustryOverlap(
  memberIndustries: string[],
  jobIndustry: string
): number {
  if (!jobIndustry) return 0.5; // Neutral

  const normalizedJobIndustry = normalizeIndustry(jobIndustry);
  const normalizedMemberIndustries = memberIndustries.map(i => normalizeIndustry(i));

  // Direct match
  if (normalizedMemberIndustries.includes(normalizedJobIndustry)) {
    return 1.0;
  }

  // Related industries
  const relatedScore = getRelatedIndustryScore(normalizedJobIndustry, normalizedMemberIndustries);
  if (relatedScore > 0) {
    return relatedScore;
  }

  return 0.2; // Base score for any professional
}

function getRelatedIndustryScore(
  jobIndustry: string,
  memberIndustries: string[]
): number {
  const relatedGroups: Record<string, string[]> = {
    'tech': ['software', 'fintech', 'edtech', 'healthtech', 'saas', 'consumer_tech'],
    'finance': ['fintech', 'banking', 'insurance', 'investment', 'payments'],
    'commerce': ['ecommerce', 'retail', 'marketplace', 'logistics'],
    'health': ['healthtech', 'pharma', 'biotech', 'healthcare']
  };

  for (const [group, industries] of Object.entries(relatedGroups)) {
    if (industries.includes(jobIndustry)) {
      const memberMatches = memberIndustries.filter(mi => industries.includes(mi));
      if (memberMatches.length > 0) {
        return 0.6 + (0.1 * Math.min(memberMatches.length, 2));
      }
    }
  }

  return 0;
}
```

---

### 4. Domain Similarity Score

Measures functional domain alignment.

```typescript
function calculateDomainSimilarity(
  memberDomains: string[],
  jobDomain: string
): number {
  if (!jobDomain) return 0.5;

  const normalizedJobDomain = jobDomain.toLowerCase();
  const normalizedMemberDomains = memberDomains.map(d => d.toLowerCase());

  // Direct match
  if (normalizedMemberDomains.includes(normalizedJobDomain)) {
    return 1.0;
  }

  // Semantic similarity using embeddings (if available)
  const maxSimilarity = normalizedMemberDomains.reduce((max, domain) => {
    const similarity = getDomainSimilarity(domain, normalizedJobDomain);
    return Math.max(max, similarity);
  }, 0);

  return maxSimilarity;
}

function getDomainSimilarity(domain1: string, domain2: string): number {
  // Domain adjacency matrix (simplified)
  const adjacency: Record<string, Record<string, number>> = {
    'backend': { 'frontend': 0.5, 'fullstack': 0.8, 'devops': 0.6, 'platform': 0.7 },
    'frontend': { 'backend': 0.5, 'fullstack': 0.8, 'mobile': 0.6, 'design': 0.4 },
    'data': { 'ml': 0.8, 'analytics': 0.7, 'backend': 0.5 },
    'ml': { 'data': 0.8, 'research': 0.6, 'backend': 0.4 },
    'product': { 'design': 0.6, 'analytics': 0.5, 'growth': 0.7 }
  };

  return adjacency[domain1]?.[domain2] || adjacency[domain2]?.[domain1] || 0.3;
}
```

---

### 5. Seniority Match Score

Measures career stage alignment.

```typescript
function calculateSeniorityMatch(
  memberLevel: ExperienceLevel,
  jobLevel: ExperienceLevel
): number {
  const levels = ['INTERN', 'ENTRY', 'MID', 'SENIOR', 'STAFF', 'PRINCIPAL', 'EXECUTIVE'];
  
  const memberIndex = levels.indexOf(memberLevel);
  const jobIndex = levels.indexOf(jobLevel);
  
  const difference = Math.abs(memberIndex - jobIndex);
  
  // Scoring based on distance
  const scores = [1.0, 0.9, 0.7, 0.5, 0.3, 0.2, 0.1];
  return scores[difference] || 0.1;
}
```

**Rationale:** 
- Same level: Member likely has peer connections at this level
- ±1 level: Strong connection potential (mentees/mentors)
- ±2+ levels: Decreasing but non-zero probability

---

### 6. Location Proximity Score

Measures geographic relevance.

```typescript
function calculateLocationProximity(
  memberLocation: string,
  jobLocation: string
): number {
  if (!memberLocation || !jobLocation) return 0.5;

  const memberCity = normalizeLocation(memberLocation);
  const jobCity = normalizeLocation(jobLocation);

  // Same city
  if (memberCity === jobCity) return 1.0;

  // Same metro area
  if (isSameMetro(memberCity, jobCity)) return 0.9;

  // Same country
  if (isSameCountry(memberLocation, jobLocation)) return 0.6;

  // Remote-friendly adjustment
  if (isRemoteFriendly(jobLocation)) return 0.7;

  return 0.3;
}

function isSameMetro(city1: string, city2: string): boolean {
  const metros: Record<string, string[]> = {
    'sf_bay': ['san francisco', 'palo alto', 'mountain view', 'sunnyvale', 'san jose'],
    'bangalore': ['bengaluru', 'bangalore', 'whitefield', 'koramangala'],
    'delhi_ncr': ['delhi', 'gurgaon', 'gurugram', 'noida', 'new delhi']
  };

  for (const cities of Object.values(metros)) {
    if (cities.includes(city1) && cities.includes(city2)) {
      return true;
    }
  }
  return false;
}
```

---

## 🧠 Network Inference Engine

### Inference Logic

The Network Inference Engine generates human-readable explanations for why a member might know suitable candidates.

```typescript
interface NetworkInference {
  statement: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  type: InferenceType;
}

type InferenceType = 
  | 'COMPANY_COLLEAGUES'
  | 'INDUSTRY_NETWORK'
  | 'SKILL_COMMUNITY'
  | 'ALUMNI_NETWORK'
  | 'SENIORITY_PEERS';

function generateNetworkInferences(
  member: MemberProfile,
  job: JobWithTags,
  scores: ScoreBreakdown
): NetworkInference[] {
  const inferences: NetworkInference[] = [];

  // Company-based inference (highest confidence)
  if (scores.companyOverlap >= 0.8) {
    const matchingCompany = findMatchingCompany(member.pastCompanies, job.company);
    inferences.push({
      statement: `You may know ${job.experienceLevel.toLowerCase()} engineers from ${matchingCompany}.`,
      confidence: 'HIGH',
      type: 'COMPANY_COLLEAGUES'
    });
  }

  // Industry-based inference
  if (scores.industryOverlap >= 0.6) {
    inferences.push({
      statement: `You worked in ${job.industry} for ${member.yearsOfExperience} years — this role matches that domain.`,
      confidence: 'MEDIUM',
      type: 'INDUSTRY_NETWORK'
    });
  }

  // Skill-based inference
  const matchingSkills = getMatchingSkills(member.skills, job.skills);
  if (matchingSkills.length >= 2) {
    inferences.push({
      statement: `People you've worked with on ${formatSkillList(matchingSkills)} projects.`,
      confidence: 'MEDIUM',
      type: 'SKILL_COMMUNITY'
    });
  }

  // Alumni network inference
  if (member.networkPrefs?.collegeAlumni) {
    inferences.push({
      statement: `This role aligns with professionals from your alumni network.`,
      confidence: 'LOW',
      type: 'ALUMNI_NETWORK'
    });
  }

  return inferences;
}
```

### Example Inferences

| Scenario | Generated Statement |
|----------|---------------------|
| Member worked at Razorpay, job is at Razorpay | "You may know backend engineers from Razorpay." |
| Member has 4 years in fintech | "You worked in fintech for 4 years — this role matches that domain." |
| Skills: React, TypeScript overlap | "People you've worked with on React or TypeScript projects." |
| Member opted into alumni referrals | "This role aligns with professionals from your alumni network." |

---

## ⚡ Advanced Scoring (v2)

### Embedding-Based Similarity

For more accurate matching, use vector embeddings:

```typescript
async function calculateEmbeddingSimilarity(
  memberEmbedding: MemberEmbedding,
  jobEmbedding: JobEmbedding
): number {
  // Cosine similarity between combined vectors
  const similarity = cosineSimilarity(
    memberEmbedding.combinedVector,
    jobEmbedding.combinedVector
  );

  // Scale to 0-1 range (cosine similarity is -1 to 1)
  return (similarity + 1) / 2;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

### Machine Learning Ranking (Future)

```typescript
// Training data structure for ML model
interface TrainingExample {
  features: {
    skillOverlap: number;
    companyOverlap: number;
    industryOverlap: number;
    domainSimilarity: number;
    seniorityMatch: number;
    locationProximity: number;
    embeddingSimilarity: number;
    memberReferralHistory: number;
    jobPopularity: number;
  };
  label: number; // 1 if resulted in successful referral, 0 otherwise
}

// Use gradient boosting or neural network for ranking
// Model predicts: P(successful_referral | member, job)
```

---

## 📊 Score Interpretation

### Tier Definitions

| Tier | Score Range | Interpretation | Action |
|------|-------------|----------------|--------|
| **HIGH** | 70-100 | Strong match, highly likely to know candidates | Prioritize nudging |
| **MEDIUM** | 40-69 | Moderate match, possible connections | Standard nudging |
| **LOW** | 0-39 | Weak match, unlikely to know candidates | Low-priority or skip |

### Confidence Adjustments

```typescript
function adjustForConfidence(
  score: number,
  profileCompleteness: number,
  dataFreshness: number
): number {
  // Reduce confidence for incomplete profiles
  const completenessMultiplier = 0.5 + (0.5 * profileCompleteness);
  
  // Reduce confidence for stale data (>1 year)
  const freshnessMultiplier = dataFreshness > 365 ? 0.8 : 1.0;

  return score * completenessMultiplier * freshnessMultiplier;
}
```

---

## 🔄 Batch Scoring Strategy

### When to Score

1. **Job Created:** Score all active members (background job)
2. **Profile Updated:** Re-score member against all active jobs
3. **Periodic Refresh:** Daily batch refresh of scores > 7 days old

### Performance Optimization

```typescript
async function batchScoreJobMembers(
  jobId: string,
  options: { batchSize: number; parallel: boolean }
): Promise<void> {
  const job = await getJob(jobId);
  const members = await getActiveMembers();
  
  // Process in batches
  for (let i = 0; i < members.length; i += options.batchSize) {
    const batch = members.slice(i, i + options.batchSize);
    
    if (options.parallel) {
      await Promise.all(
        batch.map(member => calculateAndStoreScore(member, job))
      );
    } else {
      for (const member of batch) {
        await calculateAndStoreScore(member, job);
      }
    }
  }
}
```
