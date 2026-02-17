# System Architecture

## Overview

This document describes the high-level architecture of the Intelligent Referral Nudge Engine, including backend services, frontend components, and data flow.

---

## 🏛 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Job Detail  │  │   Referral   │  │   Member     │  │   Admin      │    │
│  │    Page      │  │    Modal     │  │  Dashboard   │  │  Analytics   │    │
│  │              │  │              │  │              │  │              │    │
│  │ • Smart      │  │ • Quick      │  │ • Referral   │  │ • Conversion │    │
│  │   Nudge      │  │   Share      │  │   History    │  │   Metrics    │    │
│  │   Block      │  │ • Message    │  │ • Status     │  │ • Funnel     │    │
│  │ • CTA        │  │   Editor     │  │   Tracking   │  │   Analysis   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│                    (Next.js API Routes / REST)                              │
└─────────────────────────────────────────────────────────────────────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND SERVICES                                   │
├──────────────────┬──────────────────┬──────────────────┬────────────────────┤
│  JD Parsing      │  Profile         │  Matching        │  Nudge             │
│  Service         │  Analysis        │  Service         │  Engine            │
│                  │  Service         │                  │                    │
│  • NLP Parser    │  • Skill         │  • Scoring       │  • Template        │
│  • Skill         │    Vectorizer    │    Algorithm     │    Generator       │
│  • Extraction    │  • Industry      │  • Similarity    │  • Personalization │
│  • Taxonomy      │    Classifier    │    Engine        │  • A/B Testing     │
│    Normalizer    │  • Company       │  • Ranking       │                    │
│                  │    Clusterer     │                  │                    │
├──────────────────┼──────────────────┼──────────────────┼────────────────────┤
│  Notification    │  Referral        │  Message         │  Analytics         │
│  Service         │  Tracking        │  Generator       │  Service           │
│                  │  Service         │                  │                    │
│  • Push          │  • Funnel        │  • AI Message    │  • Event           │
│  • Email         │    Tracking      │    Composer      │    Aggregation     │
│  • In-App        │  • Status        │  • Templates     │  • Reporting       │
│                  │    Updates       │                  │                    │
└──────────────────┴──────────────────┴──────────────────┴────────────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
├──────────────────┬──────────────────┬──────────────────┬────────────────────┤
│  PostgreSQL      │  Redis           │  Vector DB       │  OpenAI API        │
│  (Primary)       │  (Cache)         │  (Embeddings)    │  (AI/ML)           │
│                  │                  │                  │                    │
│  • Members       │  • Session       │  • Skill         │  • GPT-4           │
│  • Jobs          │  • Match Cache   │    Embeddings    │  • Text            │
│  • Referrals     │  • Hot Data      │  • JD            │    Embeddings      │
│  • MatchScores   │                  │    Embeddings    │                    │
│  • NudgeLogs     │                  │                  │                    │
└──────────────────┴──────────────────┴──────────────────┴────────────────────┘
```

---

## 🔄 Data Flow

### Job Creation Flow

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Job       │────▶│  JD        │────▶│  Batch     │────▶│  Store     │
│  Created   │     │  Parser    │     │  Scoring   │     │  Scores    │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                         │
                         ▼
                   Parse & Extract:
                   • Skills
                   • Experience
                   • Industry
                   • Domain
```

### Member Nudge Flow

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Member    │────▶│  Fetch     │────▶│  Generate  │────▶│  Display   │
│  Views Job │     │  Score     │     │  Nudge     │     │  Nudge     │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                         │                   │
                         ▼                   ▼
                   Match Score:         Personalized:
                   • 0-100             • Context
                   • Tier              • Message
                   • Reasons           • CTA
```

### Referral Tracking Flow

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Nudge     │────▶│  Nudge     │────▶│  Referral  │────▶│  Hire      │
│  Shown     │     │  Clicked   │     │  Submitted │     │  Conversion│
└────────────┘     └────────────┘     └────────────┘     └────────────┘
      │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼
   Log Event         Log Event         Log Event          Log Event
```

---

## 🔧 Backend Services Detail

### 1. JD Parsing Service

**Responsibilities:**
- Parse raw job description text
- Extract structured data (role, skills, experience, etc.)
- Normalize skill taxonomy
- Generate job embeddings

**Technology:**
- OpenAI GPT-4 for extraction
- Custom NLP rules for fallback
- Embedding models for similarity

### 2. Profile Analysis Service

**Responsibilities:**
- Process LinkedIn profile data
- Generate skill vectors
- Classify industry and domain
- Calculate seniority score
- Identify company clusters

**Technology:**
- Skill taxonomy mapping
- Industry classification model
- Company graph analysis

### 3. Matching Service

**Responsibilities:**
- Calculate match scores between members and jobs
- Multi-dimensional matching (skills, company, industry, etc.)
- Generate match explanations
- Rank members for a job

**Technology:**
- Cosine similarity on embeddings
- Weighted scoring algorithm
- Configurable matching rules

### 4. Nudge Engine

**Responsibilities:**
- Generate personalized nudge messages
- Select appropriate nudge templates
- A/B test nudge variants
- Optimize nudge timing

**Technology:**
- Template engine with variables
- AI-powered message generation
- Experimentation framework

### 5. Notification Service

**Responsibilities:**
- Send notifications across channels
- Manage notification preferences
- Handle delivery and retries

**Channels:**
- In-app notifications
- Email
- Push notifications

### 6. Referral Tracking Service

**Responsibilities:**
- Track referral funnel events
- Update referral status
- Calculate conversion metrics
- Provide audit trail

**Events Tracked:**
- Nudge shown
- Nudge clicked
- Referral started
- Referral submitted
- Candidate status updates
- Hire conversion

### 7. Message Generator Service

**Responsibilities:**
- Generate AI-powered outreach messages
- Customize based on context
- Support multiple templates
- Allow member editing

**Technology:**
- OpenAI GPT-4 for generation
- Template-based fallbacks

### 8. Analytics Service

**Responsibilities:**
- Aggregate event data
- Calculate KPIs
- Generate reports
- Power dashboards

**Metrics:**
- Referral rate by segment
- Conversion rates
- Time-to-referral
- Nudge effectiveness

---

## ⚙️ Scalability Considerations

### Performance Requirements

| Metric | Target |
|--------|--------|
| Jobs supported | 10,000+ |
| Members supported | 100,000+ |
| Match score latency | < 100ms (cached) |
| Batch scoring throughput | 1,000 jobs/minute |
| Real-time scoring | < 500ms |

### Scaling Strategies

**Horizontal Scaling:**
- Stateless services behind load balancer
- Database read replicas
- Distributed caching

**Batch Processing:**
- Background job scoring on job creation
- Periodic re-scoring for profile updates
- Queue-based processing

**Caching:**
- Redis for hot match scores
- CDN for static assets
- Query result caching

**Database Optimization:**
- Proper indexing on frequently queried columns
- Partitioning for event logs
- Connection pooling

---

## 🔐 Security Considerations

- JWT-based authentication
- Role-based access control
- Rate limiting on API endpoints
- Input validation and sanitization
- Encrypted data at rest
- HTTPS for all communications
