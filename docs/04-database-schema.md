# Database Schema

## Overview

This document defines the data models and relationships for the Intelligent Referral Nudge Engine. The database uses PostgreSQL with Prisma ORM.

---

## 📊 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │   MemberProfile │       │  MemberEmbedding│
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │──────▶│ userId          │──────▶│ memberId        │
│ email           │       │ skills          │       │ skillVector     │
│ name            │       │ pastCompanies   │       │ industryVector  │
│ passwordHash    │       │ domains         │       │ experienceVector│
│ role            │       │ experienceLevel │       │ updatedAt       │
│ createdAt       │       │ yearsOfExp      │       └─────────────────┘
│ updatedAt       │       │ currentCompany  │
└─────────────────┘       │ location        │
         │                │ isOpenToRefer   │
         │                └─────────────────┘
         │
         │                ┌─────────────────┐       ┌─────────────────┐
         │                │      Job        │       │     JobTag      │
         │                ├─────────────────┤       ├─────────────────┤
         │                │ id              │◀──────│ jobId           │
         │                │ title           │       │ skills          │
         │                │ company         │       │ domain          │
         │                │ description     │       │ industry        │
         │                │ location        │       │ techStack       │
         │                │ closingDate     │       │ benefits        │
         │                │ isActive        │       └─────────────────┘
         │                │ createdBy       │◀──────┐
         │                │ createdAt       │       │
         │                └─────────────────┘       │
         │                         │                │
         │                         │                │
         ▼                         ▼                │
┌─────────────────┐       ┌─────────────────┐       │
│    Referral     │       │   MatchScore    │       │
├─────────────────┤       ├─────────────────┤       │
│ id              │       │ id              │       │
│ jobId           │◀──────│ memberId        │───────┘
│ userId          │──────▶│ jobId           │
│ candidateName   │       │ overallScore    │
│ candidateEmail  │       │ scoreBreakdown  │
│ relationType    │       │ tier            │
│ status          │       │ reasons         │
│ note            │       │ calculatedAt    │
│ createdAt       │       └─────────────────┘
└─────────────────┘
         │
         │                ┌─────────────────┐       ┌─────────────────┐
         │                │    NudgeLog     │       │ InteractionLog  │
         │                ├─────────────────┤       ├─────────────────┤
         │                │ id              │       │ id              │
         └───────────────▶│ memberId        │       │ nudgeLogId      │◀──┐
                          │ jobId           │◀──────│ action          │   │
                          │ nudgeType       │       │ metadata        │   │
                          │ nudgeContent    │       │ timestamp       │   │
                          │ matchScore      │       └─────────────────┘   │
                          │ shownAt         │                             │
                          │ clickedAt       │─────────────────────────────┘
                          └─────────────────┘
```

---

## 📋 Schema Definitions

### User

Core user entity for authentication and identity.

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  role         UserRole @default(MEMBER)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  memberProfile MemberProfile?
  referrals     Referral[]
  events        Event[]
  createdJobs   Job[]          @relation("JobCreator")

  @@index([email])
  @@index([role])
}

enum UserRole {
  MEMBER
  RECRUITER
  ADMIN
}
```

---

### MemberProfile

Extended profile data for members (from LinkedIn).

```prisma
model MemberProfile {
  id               String   @id @default(cuid())
  userId           String   @unique
  
  // Skills & Expertise
  skills           String[]
  primarySkills    String[]
  
  // Work History
  pastCompanies    String[]
  currentCompany   String?
  currentTitle     String?
  yearsOfExperience Int     @default(0)
  
  // Classification
  domains          String[]
  industries       String[]
  experienceLevel  ExperienceLevel @default(MID)
  seniorityScore   Float    @default(0)
  
  // Location
  location         String?
  timezone         String?
  
  // Network Preferences
  preferredDomains String[]
  preferredRoles   String[]
  isOpenToRefer    Boolean  @default(true)
  networkPrefs     Json?    // { relativesInTech, collegeJuniors, bootcampGrads }
  
  // Metadata
  linkedinUrl      String?
  profileCompleteness Float @default(0)
  lastSynced       DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  user             User     @relation(fields: [userId], references: [id])
  matchScores      MatchScore[]
  nudgeLogs        NudgeLog[]
  embedding        MemberEmbedding?

  @@index([experienceLevel])
  @@index([skills])
  @@index([domains])
}

enum ExperienceLevel {
  INTERN
  ENTRY
  MID
  SENIOR
  STAFF
  PRINCIPAL
  EXECUTIVE
}
```

---

### MemberEmbedding

Vector embeddings for similarity matching.

```prisma
model MemberEmbedding {
  id              String   @id @default(cuid())
  memberId        String   @unique
  
  // Embedding Vectors (stored as JSON for flexibility)
  skillVector     Float[]  // 1536 dimensions (OpenAI)
  industryVector  Float[]
  experienceVector Float[]
  combinedVector  Float[]  // Weighted combination
  
  // Metadata
  modelVersion    String   @default("v1")
  generatedAt     DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  memberProfile   MemberProfile @relation(fields: [memberId], references: [id])

  @@index([memberId])
}
```

---

### Job

Job posting entity.

```prisma
model Job {
  id              String    @id @default(cuid())
  
  // Basic Info
  title           String
  company         String
  description     String
  location        String?
  
  // Requirements
  experienceLevel ExperienceLevel @default(MID)
  minExperience   Int?
  maxExperience   Int?
  
  // Domain & Industry
  domain          String?
  industry        String?
  
  // Status
  isActive        Boolean   @default(true)
  closingDate     DateTime?
  
  // Source
  sourceUrl       String?
  createdBy       String?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  creator         User?     @relation("JobCreator", fields: [createdBy], references: [id])
  jobTag          JobTag?
  jobEmbedding    JobEmbedding?
  referrals       Referral[]
  matchScores     MatchScore[]
  nudgeLogs       NudgeLog[]
  events          Event[]

  @@index([isActive])
  @@index([closingDate])
  @@index([domain])
  @@index([experienceLevel])
}
```

---

### JobTag

Parsed/extracted data from job description.

```prisma
model JobTag {
  id              String   @id @default(cuid())
  jobId           String   @unique
  
  // Extracted Skills
  skills          String[]
  requiredSkills  String[]
  preferredSkills String[]
  techStack       String[]
  
  // Domain & Industry
  domain          String?
  industry        String?
  subDomain       String?
  
  // Seniority Indicators
  seniorityLevel  String?
  seniorityIndicators String[]
  
  // Additional
  benefits        String[]
  targetCompanies String[]
  keywords        String[]
  
  // Parsing Metadata
  parseVersion    String   @default("v1")
  parseSource     ParseSource @default(NLP)
  confidence      Float    @default(0.8)
  parsedAt        DateTime @default(now())

  // Relations
  job             Job      @relation(fields: [jobId], references: [id])

  @@index([skills])
  @@index([domain])
}

enum ParseSource {
  NLP
  AI
  MANUAL
}
```

---

### JobEmbedding

Vector embeddings for job similarity.

```prisma
model JobEmbedding {
  id              String   @id @default(cuid())
  jobId           String   @unique
  
  // Embedding Vectors
  titleVector     Float[]
  descriptionVector Float[]
  skillsVector    Float[]
  combinedVector  Float[]
  
  // Metadata
  modelVersion    String   @default("v1")
  generatedAt     DateTime @default(now())

  // Relations
  job             Job      @relation(fields: [jobId], references: [id])

  @@index([jobId])
}
```

---

### MatchScore

Pre-computed match scores between members and jobs.

```prisma
model MatchScore {
  id              String   @id @default(cuid())
  memberId        String
  jobId           String
  
  // Scores
  overallScore    Float    // 0-100
  tier            MatchTier
  
  // Score Breakdown
  skillOverlap    Float    @default(0)
  companyOverlap  Float    @default(0)
  industryOverlap Float    @default(0)
  seniorityMatch  Float    @default(0)
  locationProximity Float  @default(0)
  domainSimilarity Float   @default(0)
  
  // Explanation
  reasons         Json[]   // Array of { type, weight, score, explanation }
  topInferences   String[]
  
  // Metadata
  calculatedAt    DateTime @default(now())
  expiresAt       DateTime?
  version         String   @default("v1")

  // Relations
  member          MemberProfile @relation(fields: [memberId], references: [id])
  job             Job           @relation(fields: [jobId], references: [id])

  @@unique([memberId, jobId])
  @@index([memberId])
  @@index([jobId])
  @@index([overallScore])
  @@index([tier])
}

enum MatchTier {
  HIGH    // 70-100
  MEDIUM  // 40-69
  LOW     // 0-39
}
```

---

### Referral

Referral submissions tracking.

```prisma
model Referral {
  id                  String   @id @default(cuid())
  jobId               String
  userId              String   // Referring member
  
  // Candidate Info
  candidateName       String?
  candidateEmail      String?
  candidatePhone      String?
  candidateProfileUrl String?
  
  // Relationship
  relationType        RelationType
  relationNote        String?
  
  // Status
  status              ReferralStatus @default(PENDING)
  
  // Notes
  referrerNote        String?
  recruiterNote       String?
  
  // Source Tracking
  sourceNudgeId       String?
  sourcePage          String?
  
  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  viewedAt            DateTime?
  shortlistedAt       DateTime?
  hiredAt             DateTime?

  // Relations
  job                 Job      @relation(fields: [jobId], references: [id])
  user                User     @relation(fields: [userId], references: [id])
  activities          ReferralActivity[]

  @@unique([userId, jobId, candidateEmail])
  @@index([jobId])
  @@index([userId])
  @@index([status])
}

enum RelationType {
  EX_COLLEAGUE
  COLLEGE_ALUMNI
  FRIEND
  FAMILY
  BOOTCAMP_CONNECTION
  LINKEDIN_CONNECTION
  OTHER
}

enum ReferralStatus {
  PENDING
  VIEWED
  SHORTLISTED
  INTERVIEWING
  HIRED
  REJECTED
  WITHDRAWN
}
```

---

### ReferralActivity

Activity log for referral status changes.

```prisma
model ReferralActivity {
  id          String   @id @default(cuid())
  referralId  String
  
  action      String
  details     String?
  performedBy String?
  timestamp   DateTime @default(now())

  // Relations
  referral    Referral @relation(fields: [referralId], references: [id])

  @@index([referralId])
}
```

---

### NudgeLog

Track nudges shown to members.

```prisma
model NudgeLog {
  id              String   @id @default(cuid())
  memberId        String
  jobId           String
  
  // Nudge Content
  nudgeType       NudgeType
  nudgeContent    Json     // { headline, body, cta, inferences }
  templateUsed    String?
  
  // Score Context
  matchScore      Float
  matchTier       MatchTier
  reasonsSummary  String[]
  
  // Timestamps
  shownAt         DateTime @default(now())
  clickedAt       DateTime?
  dismissedAt     DateTime?
  
  // A/B Testing
  variant         String?
  experimentId    String?

  // Relations
  member          MemberProfile @relation(fields: [memberId], references: [id])
  job             Job           @relation(fields: [jobId], references: [id])
  interactions    NudgeInteraction[]

  @@index([memberId])
  @@index([jobId])
  @@index([shownAt])
  @@index([variant])
}

enum NudgeType {
  PERSONALIZED
  COMPANY_BASED
  SKILL_BASED
  INDUSTRY_BASED
  GENERIC
}
```

---

### NudgeInteraction

Granular interaction tracking for nudges.

```prisma
model NudgeInteraction {
  id          String   @id @default(cuid())
  nudgeLogId  String
  
  action      InteractionAction
  metadata    Json?    // { button, position, timeOnPage }
  timestamp   DateTime @default(now())

  // Relations
  nudgeLog    NudgeLog @relation(fields: [nudgeLogId], references: [id])

  @@index([nudgeLogId])
  @@index([action])
}

enum InteractionAction {
  VIEWED
  HOVERED
  CLICKED
  SHARE_WHATSAPP
  SHARE_LINKEDIN
  SHARE_EMAIL
  COPY_MESSAGE
  DISMISSED
  REFERRED
}
```

---

### Event

General event tracking for analytics.

```prisma
model Event {
  id          String   @id @default(cuid())
  type        EventType
  userId      String
  jobId       String?
  referralId  String?
  
  metadata    Json?
  timestamp   DateTime @default(now())

  // Relations
  user        User     @relation(fields: [userId], references: [id])
  job         Job?     @relation(fields: [jobId], references: [id])

  @@index([type])
  @@index([userId])
  @@index([jobId])
  @@index([timestamp])
}

enum EventType {
  JOB_VIEWED
  JOB_SEARCHED
  NUDGE_SHOWN
  NUDGE_CLICKED
  NUDGE_DISMISSED
  REFERRAL_STARTED
  REFERRAL_SUBMITTED
  REFERRAL_WITHDRAWN
  MESSAGE_GENERATED
  MESSAGE_COPIED
  SHARE_CLICKED
  PROFILE_UPDATED
}
```

---

## 📐 Indexes & Performance

### Recommended Indexes

```sql
-- User lookups
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);

-- Job queries
CREATE INDEX idx_job_active_closing ON "Job"(isActive, closingDate);
CREATE INDEX idx_job_domain_exp ON "Job"(domain, experienceLevel);

-- Match score queries
CREATE INDEX idx_match_member_score ON "MatchScore"(memberId, overallScore DESC);
CREATE INDEX idx_match_job_tier ON "MatchScore"(jobId, tier);

-- Event analytics
CREATE INDEX idx_event_type_time ON "Event"(type, timestamp);
CREATE INDEX idx_event_user_time ON "Event"(userId, timestamp);

-- Nudge analytics
CREATE INDEX idx_nudge_member_time ON "NudgeLog"(memberId, shownAt);
CREATE INDEX idx_nudge_variant ON "NudgeLog"(variant, shownAt);
```

---

## 🔄 Data Lifecycle

### Match Score Refresh
- Recalculate when member profile updates
- Recalculate when new job is created
- Expire scores after 7 days
- Background batch refresh daily

### Event Data Retention
- Raw events: 90 days
- Aggregated metrics: 2 years
- Anonymized data: Indefinite

### Embedding Updates
- Regenerate on profile update
- Use latest model version
- Store previous versions for comparison
