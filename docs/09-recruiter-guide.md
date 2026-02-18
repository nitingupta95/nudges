# Recruiter Guide for Pieworks

## Overview

This document outlines the recruiter functionality in Pieworks - a referral-driven hiring platform. Recruiters can post jobs, track referrals, and leverage the intelligent nudge engine to source candidates through member networks.

---

## 🎯 Recruiter Role

### How to Become a Recruiter

Users select their role during signup:
- **MEMBER** - Default role (can refer candidates and get referred)
- **RECRUITER** - Can create and manage job postings
- **ADMIN** - Full access (database assignment only)

### Recruiter Capabilities

| Feature | Description | Status |
|---------|-------------|--------|
| Create Jobs | Post new job openings | ✅ Available |
| Update Jobs | Edit job details and status | ✅ Available |
| Delete Jobs | Remove job postings | ✅ Available |
| View Referrals | See referrals for their jobs | ✅ Available |
| Update Referral Status | Progress candidates through pipeline | ✅ Available |
| View Analytics | Dashboard stats and metrics | ✅ Available |

---

## 🔧 Job Management

### Creating a Job

**Endpoint:** `POST /api/jobs`

**Required Fields:**
| Field | Type | Constraints |
|-------|------|-------------|
| `title` | string | Max 200 characters |
| `company` | string | Max 200 characters |
| `description` | string | Min 50, Max 50,000 characters |

**Optional Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `location` | string | Job location |
| `isRemote` | boolean | Remote work option (default: false) |
| `salaryMin` | number | Minimum salary |
| `salaryMax` | number | Maximum salary |
| `experienceLevel` | enum | INTERN, ENTRY, MID, SENIOR, STAFF, PRINCIPAL, EXECUTIVE |
| `closingDate` | ISO date | Application deadline |

**Example Request:**
```json
{
  "title": "Senior Frontend Engineer",
  "company": "Acme Inc",
  "description": "We are looking for a Senior Frontend Engineer with 5+ years of experience in React, TypeScript, and modern web technologies...",
  "location": "San Francisco, CA",
  "isRemote": true,
  "salaryMin": 150000,
  "salaryMax": 200000,
  "experienceLevel": "SENIOR",
  "closingDate": "2026-04-01"
}
```

### Auto-Parsed Job Data

When a job is created, the system automatically extracts:
- **Skills** - Technical skills from description
- **Tech Stack** - Frameworks, languages, tools
- **Domains** - Industry/domain classification
- **Soft Skills** - Communication, leadership, etc.
- **Experience Level** - Inferred seniority
- **Seniority Terms** - Lead, Senior, Principal, etc.
- **Keywords** - Important terms for matching

This data powers the intelligent matching and nudge engine.

### Updating a Job

**Endpoint:** `PATCH /api/jobs/{jobId}`

Only the job creator, recruiters, or admins can update jobs.

**Updatable Fields:**
```json
{
  "title": "Updated Title",
  "description": "Updated description...",
  "location": "New location",
  "isRemote": true,
  "salaryMin": 160000,
  "salaryMax": 220000,
  "experienceLevel": "STAFF",
  "closingDate": "2026-05-01",
  "isActive": false,
  "reParseTags": true
}
```

Set `reParseTags: true` to re-analyze the description with the parsing engine.

### Deleting a Job

**Endpoint:** `DELETE /api/jobs/{jobId}`

Only the job creator, recruiters, or admins can delete jobs.

---

## 📊 Job Dashboard

### Dashboard Stats

The recruiter dashboard shows:
- **Total Jobs** - All active job postings
- **Closing Soon** - Jobs closing in next 7 days
- **Good Fit** - Jobs with high match scores for members

### Job Listing

**Endpoint:** `GET /api/jobs`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search |
| `company` | string | Filter by company |
| `domain` | string | Filter by domain |
| `experienceLevel` | enum | Filter by experience |
| `skills` | string | Comma-separated skills |
| `isActive` | boolean | Active jobs only |
| `isRemote` | boolean | Remote jobs only |
| `closingSoon` | boolean | Jobs closing in 7 days |
| `limit` | number | Results per page (default: 20) |
| `offset` | number | Pagination offset |

---

## 👥 Referral Management

### How Referrals Work

1. **Job Posted** - Recruiter creates a job posting
2. **Members Notified** - Matching engine identifies relevant members
3. **Nudges Shown** - Personalized prompts encourage referrals
4. **Referral Submitted** - Member refers a candidate
5. **Recruiter Reviews** - Recruiter manages referral pipeline

### Referral Status Flow

```
DRAFT → SUBMITTED → VIEWED → UNDER_REVIEW → SHORTLISTED → INTERVIEWING → OFFERED → HIRED
                         ↓            ↓              ↓            ↓           ↓
                    REJECTED      REJECTED        REJECTED    WITHDRAWN   REJECTED
```

| Status | Description |
|--------|-------------|
| `DRAFT` | Member started but not submitted |
| `SUBMITTED` | Referral submitted for review |
| `VIEWED` | Recruiter viewed the referral |
| `UNDER_REVIEW` | Being evaluated |
| `SHORTLISTED` | Candidate shortlisted |
| `INTERVIEWING` | Interview process started |
| `OFFERED` | Offer extended |
| `HIRED` | Successfully hired |
| `REJECTED` | Not moving forward |
| `WITHDRAWN` | Candidate withdrew |

### Viewing Referrals

**Endpoint:** `GET /api/referrals`

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `status` | Filter by status |
| `jobId` | Filter by job |
| `limit` | Results per page |
| `offset` | Pagination offset |

### Updating Referral Status

**Endpoint:** `PATCH /api/referrals`

```json
{
  "referralId": "referral-123",
  "status": "SHORTLISTED",
  "reviewNotes": "Strong technical background, schedule interview"
}
```

---

## 🧠 Intelligent Matching & Nudges

### How Matching Works

The platform scores members based on their likelihood of knowing suitable candidates:

1. **Skill Overlap** - Member skills vs job requirements
2. **Company Network** - Past companies that might have relevant talent
3. **Domain Expertise** - Industry/domain alignment
4. **Seniority Fit** - Experience level matching
5. **Network Inference** - Probability of knowing suitable candidates

### Contact Insights

**Endpoint:** `GET /api/jobs/contact-insights`

Get AI-generated insights about key people to reach out to for referrals:

```json
{
  "jobId": "job-123"
}
```

Returns:
- Suggested job titles to target
- Companies to source from
- Key decision makers
- Referral talking points

---

## 📈 Analytics & Metrics

### Job Stats

**Endpoint:** `GET /api/jobs/stats`

Get analytics for your job postings:
- View counts
- Referral counts
- Conversion rates
- Time to first referral

### Tracking Events

The platform tracks key events:
- `JOB_VIEW` - When a member views the job
- `JOB_SHARE` - When a member shares the job
- `NUDGE_SHOWN` - Nudge displayed to member
- `NUDGE_CLICKED` - Member clicked the nudge
- `REFERRAL_START` - Member started a referral
- `REFERRAL_SUBMIT` - Referral completed
---

## 🛠 Best Practices for Recruiters

### Writing Effective Job Descriptions

1. **Be Specific** - Include exact skills, tech stack, and requirements
2. **Clear Seniority** - Use explicit seniority terms (Senior, Lead, Staff)
3. **Salary Range** - Include compensation for better matching
4. **Company Context** - Describe team, culture, and projects
5. **Keywords** - Include industry-specific terms

### Maximizing Referral Quality

1. **Quick Response** - Review referrals promptly
2. **Status Updates** - Keep referral statuses current
3. **Feedback** - Provide notes on why candidates pass/fail
4. **Relationship Context** - Value referrer's relationship notes

### Job Optimization Tips

- Use the `closingDate` to create urgency
- Re-parse job tags after major description updates
- Monitor which jobs get the most referrals
- Analyze member engagement with nudges

---

## 🔌 API Reference Summary

### Authentication
All recruiter endpoints require authentication via HTTP-only cookie.

### Base URL
```
/api
```

### Recruiter Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/jobs` | List all jobs |
| `POST` | `/jobs` | Create new job |
| `GET` | `/jobs/{jobId}` | Get job details |
| `PATCH` | `/jobs/{jobId}` | Update job |
| `DELETE` | `/jobs/{jobId}` | Delete job |
| `GET` | `/jobs/stats` | Job statistics |
| `GET` | `/jobs/contact-insights` | AI contact insights |
| `GET` | `/referrals` | List referrals |
| `PATCH` | `/referrals` | Update referral status |

---

## 🚀 Future Enhancements

Planned features for recruiters:
- [ ] Recruiter-specific dashboard view
- [ ] Bulk job import (CSV/ATS integration)
- [ ] Referral email notifications
- [ ] Candidate pipeline visualization
- [ ] Team collaboration features
- [ ] Custom referral forms per job
- [ ] Interview scheduling integration
- [ ] AI-powered candidate screening
- [ ] Referral bonus tracking
- [ ] Analytics export/reporting
