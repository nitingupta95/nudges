# API Design

## Overview

This document defines the RESTful API endpoints for the Intelligent Referral Nudge Engine. All endpoints follow REST conventions and return JSON responses.

---

## 🔐 Authentication

All API endpoints require authentication via JWT Bearer token.

```
Authorization: Bearer <token>
```

---

## 📍 Base URL

```
Production: https://api.pieworks.com/v1
Development: http://localhost:3000/api
```

---

## 🔧 API Endpoints

### Jobs API

#### Create Job
```http
POST /api/jobs
```

**Request Body:**
```json
{
  "title": "Senior Backend Engineer",
  "company": "Razorpay",
  "description": "Join our payments team to build scalable systems...",
  "location": "Bengaluru, India",
  "closingDate": "2026-03-15T23:59:59Z"
}
```

**Response:** `201 Created`
```json
{
  "job": {
    "id": "job_123",
    "title": "Senior Backend Engineer",
    "company": "Razorpay",
    "description": "...",
    "location": "Bengaluru, India",
    "closingDate": "2026-03-15T23:59:59Z",
    "createdAt": "2026-02-17T10:00:00Z",
    "isActive": true,
    "parsedData": {
      "skills": ["golang", "distributed-systems", "postgresql"],
      "experienceLevel": "SENIOR",
      "domain": "fintech",
      "industry": "Financial Services"
    }
  }
}
```

---

#### Get Job Details
```http
GET /api/jobs/:jobId
```

**Response:** `200 OK`
```json
{
  "job": {
    "id": "job_123",
    "title": "Senior Backend Engineer",
    "company": "Razorpay",
    "description": "...",
    "skills": ["golang", "distributed-systems"],
    "experienceLevel": "SENIOR",
    "domain": "fintech",
    "location": "Bengaluru, India",
    "closingDate": "2026-03-15T23:59:59Z",
    "createdAt": "2026-02-17T10:00:00Z"
  }
}
```

---

#### List Jobs
```http
GET /api/jobs
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `domain` | string | Filter by domain (e.g., "fintech") |
| `experienceLevel` | string | Filter by experience level |
| `skills` | string | Comma-separated skills |
| `limit` | number | Results per page (default: 20) |
| `offset` | number | Pagination offset |

**Response:** `200 OK`
```json
{
  "jobs": [...],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

### Nudges API

#### Get Referral Nudges for a Job
```http
GET /api/jobs/:jobId/referral-nudges
```

**Response:** `200 OK`
```json
{
  "nudges": [
    "You worked at Razorpay — think about backend engineers from your team who might be interested.",
    "Any connections in the payments or distributed systems space?",
    "This role matches your fintech background from the past 4 years."
  ],
  "explain": "Your experience at Razorpay makes your network especially relevant for this role.",
  "matchScore": 85,
  "matchTier": "HIGH",
  "reasons": [
    {
      "type": "company_overlap",
      "description": "You worked at Razorpay for 3 years"
    },
    {
      "type": "skill_match",
      "description": "Your skills in Golang and distributed systems match this role"
    }
  ]
}
```

---

#### Get Personalized Nudge for Member-Job Pair
```http
GET /api/nudges/personalized
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `memberId` | string | Yes | Member ID |
| `jobId` | string | Yes | Job ID |

**Response:** `200 OK`
```json
{
  "nudge": {
    "headline": "You may know the perfect candidate!",
    "body": "You worked at Flipkart in supply chain for 2 years — do you know someone suitable for this role?",
    "cta": "Refer Someone",
    "matchScore": 78,
    "matchTier": "HIGH",
    "inferences": [
      "You may know supply chain engineers from Flipkart.",
      "This role aligns with your e-commerce background."
    ]
  }
}
```

---

#### Log Nudge Interaction
```http
POST /api/nudges/interactions
```

**Request Body:**
```json
{
  "memberId": "member_456",
  "jobId": "job_123",
  "nudgeId": "nudge_789",
  "action": "CLICKED",
  "metadata": {
    "source": "job_detail_page",
    "position": 1
  }
}
```

**Response:** `201 Created`
```json
{
  "logged": true,
  "interactionId": "int_abc123"
}
```

---

### Matching API

#### Get Match Score
```http
GET /api/matching/score
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `memberId` | string | Yes | Member ID |
| `jobId` | string | Yes | Job ID |

**Response:** `200 OK`
```json
{
  "matchScore": {
    "overall": 82,
    "tier": "HIGH",
    "breakdown": {
      "skillOverlap": 75,
      "companyOverlap": 90,
      "industryOverlap": 85,
      "seniorityMatch": 80,
      "locationProximity": 70,
      "domainSimilarity": 88
    },
    "reasons": [
      {
        "type": "company_overlap",
        "weight": 0.25,
        "score": 90,
        "explanation": "You worked at Razorpay for 3 years in backend domain."
      },
      {
        "type": "skill_match",
        "weight": 0.30,
        "score": 75,
        "explanation": "Your skills overlap: Golang, PostgreSQL, Distributed Systems"
      }
    ]
  }
}
```

---

#### Batch Score Members for Job
```http
POST /api/matching/batch-score
```

**Request Body:**
```json
{
  "jobId": "job_123",
  "memberIds": ["member_1", "member_2", "member_3"],
  "options": {
    "includeReasons": true,
    "minScore": 50
  }
}
```

**Response:** `200 OK`
```json
{
  "scores": [
    {
      "memberId": "member_1",
      "score": 85,
      "tier": "HIGH",
      "reasons": [...]
    },
    {
      "memberId": "member_2",
      "score": 62,
      "tier": "MEDIUM",
      "reasons": [...]
    }
  ],
  "filtered": 1,
  "total": 3
}
```

---

#### Get Top Members for Job
```http
GET /api/matching/top-members/:jobId
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of top members |
| `minTier` | string | "MEDIUM" | Minimum tier (HIGH, MEDIUM, LOW) |

**Response:** `200 OK`
```json
{
  "topMembers": [
    {
      "memberId": "member_456",
      "name": "Rahul Sharma",
      "score": 92,
      "tier": "HIGH",
      "topReasons": [
        "Worked at same company",
        "5 matching skills"
      ]
    }
  ]
}
```

---

### Message Generator API

#### Generate Referral Message
```http
POST /api/messages/generate
```

**Request Body:**
```json
{
  "memberId": "member_456",
  "jobId": "job_123",
  "template": "friendly",
  "customContext": {
    "recipientName": "Ankit"
  }
}
```

**Response:** `200 OK`
```json
{
  "message": {
    "subject": "Know anyone for this Backend Engineer role?",
    "body": "Hey Ankit, I came across this Backend Engineer role at Razorpay. Since you've worked in fintech backend teams, I thought this might interest someone in your circle. Let me know if anyone comes to mind!",
    "shareLinks": {
      "whatsapp": "https://wa.me/?text=...",
      "linkedin": "https://www.linkedin.com/shareArticle?...",
      "email": "mailto:?subject=...&body=..."
    }
  },
  "source": "ai"
}
```

---

### Referrals API

#### Create Referral
```http
POST /api/referrals
```

**Request Body:**
```json
{
  "jobId": "job_123",
  "candidateName": "Priya Kumar",
  "candidateEmail": "priya@email.com",
  "candidateProfileUrl": "https://linkedin.com/in/priyakumar",
  "relation": "EX_COLLEAGUE",
  "note": "Worked together at Razorpay, excellent backend engineer",
  "metadata": {
    "nudgeId": "nudge_789",
    "source": "job_detail_page"
  }
}
```

**Response:** `201 Created`
```json
{
  "referral": {
    "id": "ref_abc123",
    "jobId": "job_123",
    "candidateName": "Priya Kumar",
    "status": "PENDING",
    "createdAt": "2026-02-17T10:30:00Z"
  }
}
```

---

#### Get Referrals
```http
GET /api/referrals
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Filter by referring user |
| `status` | string | Filter by status |
| `jobId` | string | Filter by job |
| `limit` | number | Results per page |
| `offset` | number | Pagination offset |

**Response:** `200 OK`
```json
{
  "referrals": [
    {
      "id": "ref_abc123",
      "jobId": "job_123",
      "jobTitle": "Senior Backend Engineer",
      "companyName": "Razorpay",
      "candidateName": "Priya Kumar",
      "status": "SHORTLISTED",
      "createdAt": "2026-02-17T10:30:00Z",
      "activity": [
        {
          "timestamp": "2026-02-18T09:00:00Z",
          "action": "Viewed by recruiter"
        }
      ]
    }
  ],
  "total": 15
}
```

---

#### Update Referral Status
```http
PATCH /api/referrals/:referralId
```

**Request Body:**
```json
{
  "status": "SHORTLISTED",
  "note": "Moving to technical interview"
}
```

**Response:** `200 OK`
```json
{
  "referral": {
    "id": "ref_abc123",
    "status": "SHORTLISTED",
    "updatedAt": "2026-02-18T09:00:00Z"
  }
}
```

---

### Contact Insights API

#### Get Contact Insights for Job
```http
POST /api/jobs/contact-insights
```

**Request Body:**
```json
{
  "jobTitle": "Senior Backend Engineer",
  "jobDescription": "Join our payments team...",
  "company": "Razorpay"
}
```

**Response:** `200 OK`
```json
{
  "insights": {
    "roles": ["Engineering Manager", "Team Lead", "Backend Lead"],
    "departments": ["Engineering", "Product", "HR"],
    "description": "Reach out to the Engineering Manager or Team Lead at Razorpay to discuss this opportunity.",
    "source": "ai",
    "generatedAt": "2026-02-17T10:00:00Z"
  }
}
```

---

### Member Profile API

#### Get Member Profile
```http
GET /api/users/me
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "member_456",
    "email": "rahul@email.com",
    "name": "Rahul Sharma"
  },
  "profile": {
    "skills": ["golang", "python", "postgresql"],
    "pastCompanies": ["Razorpay", "Flipkart"],
    "domains": ["fintech", "e-commerce"],
    "experienceLevel": "senior",
    "yearsOfExperience": 6,
    "currentCompany": "Stripe",
    "currentTitle": "Staff Engineer",
    "location": "Bengaluru, India"
  }
}
```

---

#### Update Preferences
```http
PATCH /api/users/preferences
```

**Request Body:**
```json
{
  "skills": ["golang", "python", "kubernetes"],
  "preferredDomains": ["fintech", "developer-tools"],
  "preferredRoles": ["backend", "platform"],
  "isOpenToRefer": true,
  "networkPreferences": {
    "relativesInTech": false,
    "collegeJuniors": true,
    "bootcampGrads": true
  }
}
```

**Response:** `200 OK`
```json
{
  "profile": {
    "skills": ["golang", "python", "kubernetes"],
    "preferredDomains": ["fintech", "developer-tools"],
    "updatedAt": "2026-02-17T11:00:00Z"
  }
}
```

---

### Events/Analytics API

#### Track Event
```http
POST /api/events
```

**Request Body:**
```json
{
  "type": "NUDGE_CLICKED",
  "userId": "member_456",
  "jobId": "job_123",
  "metadata": {
    "nudgeType": "personalized",
    "position": 1,
    "source": "job_detail"
  }
}
```

**Event Types:**
- `JOB_VIEWED`
- `NUDGE_SHOWN`
- `NUDGE_CLICKED`
- `REFERRAL_STARTED`
- `REFERRAL_SUBMITTED`
- `MESSAGE_COPIED`
- `SHARE_CLICKED`

**Response:** `201 Created`
```json
{
  "event": {
    "id": "evt_xyz789",
    "type": "NUDGE_CLICKED",
    "createdAt": "2026-02-17T10:45:00Z"
  }
}
```

---

#### Get Dashboard Stats
```http
GET /api/jobs/stats
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | For personalized stats |

**Response:** `200 OK`
```json
{
  "stats": {
    "totalJobs": 150,
    "closingSoon": 12,
    "goodFitJobs": 23,
    "referralConversionRate": 0.18,
    "avgTimeToReferral": "2.3 days"
  }
}
```

---

## 🚨 Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## 📊 Rate Limiting

| Endpoint Category | Limit |
|-------------------|-------|
| Read endpoints | 1000/hour |
| Write endpoints | 100/hour |
| AI endpoints | 50/hour |

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1708167600
```
