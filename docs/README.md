# Intelligent Referral Nudge Engine - Documentation

## 🎯 Overview

This documentation covers the **Intelligent Referral Nudge Engine for Nudges** - a production-ready feature for a referral-driven hiring platform that:

- **Identifies** which members are most likely to know suitable candidates for a job
- **Nudges** them intelligently with personalized triggers
- **Increases** referral conversion rate
- **Improves** time-to-referral

The system works **without access to member connection data**, using only:
- Member LinkedIn profile data
- Job description data

---

## 📚 Documentation Index

| # | Document | Description |
|---|----------|-------------|
| 1 | [Project Overview](./01-project-overview.md) | High-level objectives, problem statement, and system components |
| 2 | [System Architecture](./02-system-architecture.md) | Backend services, frontend components, data flow diagrams |
| 3 | [API Design](./03-api-design.md) | RESTful API endpoints, request/response contracts |
| 4 | [Database Schema](./04-database-schema.md) | Data models, relationships, and entity definitions |
| 5 | [Scoring Logic](./05-scoring-logic.md) | Matching algorithms, scoring formulas, network inference |
| 6 | [AI Usage](./06-ai-usage.md) | AI/ML integration, prompts, and fallback strategies |
| 7 | [Metrics Framework](./07-metrics-framework.md) | KPIs, tracking, dashboards, and A/B testing |
| 8 | [Future Roadmap](./08-future-roadmap.md) | Advanced extensions and enhancement plans |
| 9 | [Recruiter Guide](./09-recruiter-guide.md) | Recruiter features, job management, referral tracking |
| 10 | [Implementation Status](./10-implementation-status.md) | **Audit report: gaps, recommendations, action items** |

---

## 🏗 System Components

### Core Engines

| Component | Purpose |
|-----------|---------|
| **Job Description Intelligence Engine** | Parse raw JDs to extract structured data |
| **Member Profile Analyzer** | Transform LinkedIn data into skill vectors |
| **Matching & Scoring Engine** | Score probability of knowing suitable candidates |
| **Network Inference Engine** | Generate psychological recall triggers |
| **Intelligent Nudge System** | Replace generic CTAs with contextual nudges |
| **AI Message Generator** | Create personalized outreach messages |
| **Referral Tracking System** | Track full referral funnel |
| **Dashboard Analytics** | Monitor effectiveness and KPIs |

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Data Storage** | PostgreSQL (Prisma ORM) |
| **Backend Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Frontend UI** | React 19, Tailwind CSS 4, shadcn/ui |
| **AI/ML** | OpenAI API (GPT-4o-mini, Embeddings) |
| **State Management** | React Query, Context API |
| **Testing** | Vitest |

---

## 📈 Success Metrics

### Primary KPI
**Referral Submission Rate** — Target: 15%+

### Secondary KPIs
- Nudge-to-Referral Conversion: 20%+
- Time-to-First-Referral: < 48 hours
- Hire Conversion Rate: 10%+

---

## 🚀 Quick Links

- [API Endpoints](./03-api-design.md#-api-endpoints)
- [Database Models](./04-database-schema.md#-schema-definitions)
- [Scoring Algorithm](./05-scoring-logic.md#-scoring-algorithm)
- [AI Prompts](./06-ai-usage.md#1️⃣-job-description-intelligence)
- [Experiment Framework](./07-metrics-framework.md#-ab-testing-framework)
- [Phase Roadmap](./08-future-roadmap.md#️-roadmap-phases)

---

## 📁 Project Structure

```
nudges/
├── app/                  # Next.js App Router (Pages & API Routes)
│   ├── api/              # RESTful API endpoints
│   ├── dashboard/        # Recruiter & Employee Dashboards
│   ├── jobs/             # Job Board & Details
│   └── referrals/        # Referral Management Workflows
├── components/           # Reusable UI Components
│   ├── referrals/        # Nudge panels, composer, submission forms
│   └── ui/               # shadcn/ui components
├── docs/                 # This documentation
├── lib/                  # Shared Utilities & API Clients
├── prisma/               # Database Schema & Migrations
├── services/             # Core Business Logic (Service Layer)
│   ├── ai/               # AI Integration Services
│   ├── job/              # Job parsing and management
│   ├── nudges/           # Nudge Generation Logic
│   └── referrals/        # Referral tracking
└── types/                # TypeScript type definitions
```

---

## 🔥 What Makes This Impressive

When fully implemented, this system becomes:

| Capability | Description |
|------------|-------------|
| **Recommendation Engine** | Smart job-to-member matching |
| **Behavioral Activation System** | Psychological triggers for action |
| **Smart Referral Conversion Optimizer** | Data-driven nudge optimization |
| **Production-Grade Intelligent Workflow** | Scalable, real-time system |

---

## 📝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.