# Intelligent Referral Nudge Engine for Pieworks

## Project Overview

### 🎯 Objective

Design and implement a production-ready feature for a referral-driven hiring platform that:

- **Identifies** which members are most likely to know suitable candidates for a job
- **Nudges** them intelligently with personalized triggers
- **Increases** referral conversion rate
- **Improves** time-to-referral

### 🔒 Constraints

The system must work **without access to member connection data**, only using:
- Member LinkedIn profile data
- Job description data

---

## 🧠 Core Problem Statement

### Why Members Hesitate to Refer

| Problem | Impact |
|---------|--------|
| They don't know who in their network fits a job | Low recall activation |
| The platform cannot see their connections | No direct targeting possible |
| There is no structured recall trigger | Passive browsing behavior |

### Our Solution

The system must **infer probable network relevance** and **activate recall** through intelligent nudging.

---

## 🏗 System Components

### 1️⃣ Job Description Intelligence Engine
Parses raw job descriptions to extract structured data including role title, skills, experience range, industry, and more.

### 2️⃣ Member Profile Analyzer
Transforms LinkedIn profile data into a structured representation with skill vectors, industry classification, and company clusters.

### 3️⃣ Matching & Scoring Engine
The core intelligence layer that scores the probability a member knows someone suitable for a role.

### 4️⃣ Network Inference Engine
Builds inference logic to generate psychological recall triggers without direct connection data.

### 5️⃣ Intelligent Nudge System (UX Layer)
Replaces generic CTAs with contextual, personalized nudges.

### 6️⃣ AI-Powered Message Generator
Generates personalized outreach messages for referrals.

### 7️⃣ Referral Tracking System
Tracks the entire referral funnel from nudge shown to hire conversion.

### 8️⃣ Dashboard Analytics
Admin dashboard for monitoring referral effectiveness.

---

## 📈 Success Metrics

### Primary KPI
- **Increase referral submission rate**

### Secondary Metrics
- Reduce time to first referral
- Increase member engagement
- Improve hire conversion rate

---

## 🔥 What Makes This Impressive

When built well, this becomes:

| Capability | Description |
|------------|-------------|
| **Recommendation Engine** | Smart job-to-member matching |
| **Behavioral Activation System** | Psychological triggers for action |
| **Smart Referral Conversion Optimizer** | Data-driven nudge optimization |
| **Production-Grade Intelligent Workflow** | Scalable, real-time system |

---

## 📁 Documentation Index

| Document | Description |
|----------|-------------|
| [System Architecture](./02-system-architecture.md) | Backend services, frontend components, data flow |
| [API Design](./03-api-design.md) | RESTful API endpoints and contracts |
| [Database Schema](./04-database-schema.md) | Data models and relationships |
| [Scoring Logic](./05-scoring-logic.md) | Matching and scoring algorithms |
| [AI Usage](./06-ai-usage.md) | AI/ML integration and models |
| [Metrics Framework](./07-metrics-framework.md) | KPIs, tracking, and analytics |
| [Future Roadmap](./08-future-roadmap.md) | Advanced extensions and enhancements |
