# Metrics Framework

## Overview

This document defines the KPIs, tracking mechanisms, and analytics framework for measuring the success of the Intelligent Referral Nudge Engine.

---

## 🎯 Success Metrics Hierarchy

### North Star Metric
**Referral Submission Rate** — Percentage of members who submit at least one referral

### Primary KPIs

| Metric | Definition | Target | Measurement Frequency |
|--------|------------|--------|----------------------|
| **Referral Rate** | Referrals / Active Members | 15%+ | Weekly |
| **Nudge-to-Referral Conversion** | Referrals / Nudges Clicked | 20%+ | Weekly |
| **Time-to-First-Referral** | Time from job posting to first referral | < 48 hours | Per Job |
| **Hire Conversion Rate** | Hires / Referrals Submitted | 10%+ | Monthly |

### Secondary KPIs

| Metric | Definition | Target |
|--------|------------|--------|
| Member Engagement Rate | Members viewing jobs / Total members | 60%+ |
| Nudge Click-Through Rate (CTR) | Nudge clicks / Nudge impressions | 8%+ |
| Repeat Referral Rate | Members with 2+ referrals / Members with 1+ referrals | 30%+ |
| Profile Completeness | Avg % of profile fields filled | 75%+ |

---

## 📊 Referral Funnel Metrics

### The Referral Funnel

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWARENESS STAGE                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Job Posted                                    100%       │   │
│  │  ↓                                                        │   │
│  │  Job Viewed by Members                         45%        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ACTIVATION STAGE                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Nudge Shown                                   40%        │   │
│  │  ↓                                                        │   │
│  │  Nudge Engaged (hover/click)                   12%        │   │
│  │  ↓                                                        │   │
│  │  Referral Started                              6%         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CONVERSION STAGE                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Referral Submitted                            4%         │   │
│  │  ↓                                                        │   │
│  │  Candidate Shortlisted                         1.5%       │   │
│  │  ↓                                                        │   │
│  │  Hire Made                                     0.5%       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Funnel Metrics Definition

```typescript
interface FunnelMetrics {
  // Awareness
  jobsPosted: number;
  uniqueJobViews: number;
  viewRate: number;  // uniqueJobViews / (activeMembers * jobsPosted)

  // Activation
  nudgesShown: number;
  nudgesClicked: number;
  clickThroughRate: number;  // nudgesClicked / nudgesShown
  referralsStarted: number;
  startRate: number;  // referralsStarted / nudgesClicked

  // Conversion
  referralsSubmitted: number;
  submitRate: number;  // referralsSubmitted / referralsStarted
  candidatesShortlisted: number;
  hiresMade: number;
  hireRate: number;  // hiresMade / referralsSubmitted
}
```

---

## 📈 Event Tracking

### Event Schema

```typescript
interface TrackingEvent {
  type: EventType;
  timestamp: Date;
  userId: string;
  sessionId: string;
  
  // Contextual data
  jobId?: string;
  referralId?: string;
  nudgeId?: string;
  
  // Event-specific metadata
  metadata: Record<string, any>;
}

enum EventType {
  // Page Events
  JOB_VIEWED = "job_viewed",
  JOB_LIST_VIEWED = "job_list_viewed",
  DASHBOARD_VIEWED = "dashboard_viewed",
  
  // Nudge Events
  NUDGE_SHOWN = "nudge_shown",
  NUDGE_HOVERED = "nudge_hovered",
  NUDGE_CLICKED = "nudge_clicked",
  NUDGE_DISMISSED = "nudge_dismissed",
  
  // Referral Events
  REFERRAL_STARTED = "referral_started",
  REFERRAL_FORM_FIELD_FILLED = "referral_form_field_filled",
  REFERRAL_SUBMITTED = "referral_submitted",
  REFERRAL_WITHDRAWN = "referral_withdrawn",
  
  // Share Events
  MESSAGE_GENERATED = "message_generated",
  MESSAGE_COPIED = "message_copied",
  SHARE_WHATSAPP_CLICKED = "share_whatsapp_clicked",
  SHARE_LINKEDIN_CLICKED = "share_linkedin_clicked",
  SHARE_EMAIL_CLICKED = "share_email_clicked",
  
  // Profile Events
  PROFILE_UPDATED = "profile_updated",
  PREFERENCES_UPDATED = "preferences_updated"
}
```

### Event Tracking Implementation

```typescript
// Client-side tracking
function trackEvent(event: TrackingEvent): void {
  // Send to analytics endpoint
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      userId: getCurrentUserId()
    })
  }).catch(console.error);

  // Also send to third-party analytics (optional)
  if (window.analytics) {
    window.analytics.track(event.type, event.metadata);
  }
}

// Usage examples
trackEvent({
  type: EventType.NUDGE_CLICKED,
  jobId: "job_123",
  nudgeId: "nudge_456",
  metadata: {
    nudgeType: "company_based",
    position: 1,
    matchScore: 85,
    variant: "A"
  }
});
```

---

## 📊 Dashboard Analytics

### Admin Dashboard Metrics

#### Overview Section

| Metric | Visualization | Timeframe |
|--------|---------------|-----------|
| Total Referrals | Big Number + Trend | Last 7 days |
| Conversion Rate | Gauge | Last 30 days |
| Active Jobs | Big Number | Current |
| Active Members | Big Number | Current |

#### Funnel Analysis

```typescript
interface FunnelAnalytics {
  period: string;  // "daily" | "weekly" | "monthly"
  stages: {
    name: string;
    count: number;
    conversionRate: number;  // From previous stage
    dropoffRate: number;
  }[];
}

// Example response
{
  "period": "weekly",
  "stages": [
    { "name": "Job Views", "count": 5420, "conversionRate": null, "dropoffRate": null },
    { "name": "Nudge Shown", "count": 4800, "conversionRate": 88.5, "dropoffRate": 11.5 },
    { "name": "Nudge Clicked", "count": 576, "conversionRate": 12.0, "dropoffRate": 88.0 },
    { "name": "Referral Started", "count": 288, "conversionRate": 50.0, "dropoffRate": 50.0 },
    { "name": "Referral Submitted", "count": 202, "conversionRate": 70.1, "dropoffRate": 29.9 },
    { "name": "Hired", "count": 18, "conversionRate": 8.9, "dropoffRate": 91.1 }
  ]
}
```

### Segment Analysis

#### By Industry

```sql
SELECT 
  j.industry,
  COUNT(DISTINCT r.id) as referrals,
  COUNT(DISTINCT CASE WHEN r.status = 'HIRED' THEN r.id END) as hires,
  AVG(EXTRACT(EPOCH FROM (r.created_at - j.created_at)) / 3600) as avg_hours_to_referral
FROM referrals r
JOIN jobs j ON r.job_id = j.id
WHERE r.created_at >= NOW() - INTERVAL '30 days'
GROUP BY j.industry
ORDER BY referrals DESC;
```

| Industry | Referrals | Hires | Hire Rate | Avg Hours to Referral |
|----------|-----------|-------|-----------|----------------------|
| Fintech | 45 | 6 | 13.3% | 18.4 |
| E-commerce | 38 | 4 | 10.5% | 24.2 |
| SaaS | 32 | 3 | 9.4% | 32.1 |
| Consumer | 28 | 2 | 7.1% | 28.8 |

#### By Role Type

```sql
SELECT 
  j.domain as role_type,
  COUNT(DISTINCT r.id) as referrals,
  COUNT(DISTINCT r.user_id) as unique_referrers,
  ROUND(AVG(ms.overall_score), 1) as avg_match_score
FROM referrals r
JOIN jobs j ON r.job_id = j.id
LEFT JOIN match_scores ms ON r.user_id = ms.member_id AND r.job_id = ms.job_id
WHERE r.created_at >= NOW() - INTERVAL '30 days'
GROUP BY j.domain
ORDER BY referrals DESC;
```

#### By Match Tier

```sql
SELECT 
  ms.tier,
  COUNT(DISTINCT n.id) as nudges_shown,
  COUNT(DISTINCT CASE WHEN n.clicked_at IS NOT NULL THEN n.id END) as nudges_clicked,
  COUNT(DISTINCT r.id) as referrals,
  ROUND(100.0 * COUNT(DISTINCT r.id) / NULLIF(COUNT(DISTINCT n.id), 0), 2) as referral_rate
FROM nudge_logs n
LEFT JOIN match_scores ms ON n.member_id = ms.member_id AND n.job_id = ms.job_id
LEFT JOIN referrals r ON n.member_id = r.user_id AND n.job_id = r.job_id
WHERE n.shown_at >= NOW() - INTERVAL '30 days'
GROUP BY ms.tier
ORDER BY ms.tier;
```

| Match Tier | Nudges Shown | CTR | Referrals | Referral Rate |
|------------|--------------|-----|-----------|---------------|
| HIGH | 1,200 | 18.5% | 89 | 7.4% |
| MEDIUM | 2,800 | 9.2% | 98 | 3.5% |
| LOW | 1,600 | 4.1% | 15 | 0.9% |

---

## 🔬 A/B Testing Framework

### Experiment Setup

```typescript
interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "completed" | "paused";
  
  // Targeting
  targetMetric: string;
  sampleSize: number;
  confidence: number;  // e.g., 0.95 for 95%
  
  // Variants
  variants: {
    id: string;
    name: string;
    weight: number;  // Traffic allocation
    config: Record<string, any>;
  }[];
  
  // Timeline
  startedAt: Date;
  endedAt?: Date;
}

// Example: Nudge copy experiment
{
  "id": "exp_nudge_copy_v2",
  "name": "Nudge Copy - Question vs Statement",
  "targetMetric": "nudge_ctr",
  "variants": [
    {
      "id": "control",
      "name": "Statement (Control)",
      "weight": 0.5,
      "config": {
        "nudgeTemplate": "You may know someone perfect for this role."
      }
    },
    {
      "id": "question",
      "name": "Question (Treatment)",
      "weight": 0.5,
      "config": {
        "nudgeTemplate": "Know anyone who'd be great for this?"
      }
    }
  ]
}
```

### Experiment Results

```typescript
interface ExperimentResults {
  experimentId: string;
  variants: {
    id: string;
    sampleSize: number;
    conversions: number;
    conversionRate: number;
    confidenceInterval: [number, number];
  }[];
  winner?: string;
  statisticalSignificance: number;
  uplift: number;  // Percentage improvement
}
```

### Tracked Experiments

| Experiment | Variants | Primary Metric | Status |
|------------|----------|----------------|--------|
| Nudge Copy Style | Question vs Statement | CTR | Running |
| CTA Button Color | Blue vs Green | Click Rate | Completed |
| Nudge Position | Top vs Inline | Engagement | Planned |
| Message Length | Short vs Long | Copy Rate | Running |

---

## 📉 Cohort Analysis

### Member Cohorts

Track member behavior over time based on signup/activation date.

```sql
-- Weekly cohort retention analysis
WITH cohorts AS (
  SELECT 
    user_id,
    DATE_TRUNC('week', created_at) as cohort_week
  FROM users
),
activity AS (
  SELECT 
    user_id,
    DATE_TRUNC('week', timestamp) as activity_week
  FROM events
  WHERE type IN ('JOB_VIEWED', 'NUDGE_CLICKED', 'REFERRAL_SUBMITTED')
)
SELECT 
  c.cohort_week,
  COUNT(DISTINCT c.user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week THEN c.user_id END) as week_0,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '1 week' THEN c.user_id END) as week_1,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '2 weeks' THEN c.user_id END) as week_2,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '3 weeks' THEN c.user_id END) as week_3,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '4 weeks' THEN c.user_id END) as week_4
FROM cohorts c
LEFT JOIN activity a ON c.user_id = a.user_id
GROUP BY c.cohort_week
ORDER BY c.cohort_week DESC;
```

### Cohort Visualization

```
Cohort     | Size  | Week 0 | Week 1 | Week 2 | Week 3 | Week 4
---------------------------------------------------------------
Feb 10-16  | 250   | 100%   | 45%    | 32%    | 28%    | -
Feb 3-9    | 220   | 100%   | 48%    | 35%    | 29%    | 25%
Jan 27-Feb2| 195   | 100%   | 42%    | 30%    | 26%    | 22%
```

---

## ⏱️ Time-Based Metrics

### Time-to-First-Referral

```typescript
interface TimeToReferralMetrics {
  median: number;       // Hours
  p25: number;          // 25th percentile
  p75: number;          // 75th percentile
  p90: number;          // 90th percentile
  average: number;
  byIndustry: Record<string, number>;
  byMatchTier: Record<string, number>;
}

// Query
SELECT
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hours_to_referral) as median,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY hours_to_referral) as p25,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY hours_to_referral) as p75,
  AVG(hours_to_referral) as average
FROM (
  SELECT 
    j.id as job_id,
    MIN(EXTRACT(EPOCH FROM (r.created_at - j.created_at)) / 3600) as hours_to_referral
  FROM jobs j
  JOIN referrals r ON j.id = r.job_id
  GROUP BY j.id
) first_referrals;
```

### Nudge Response Time

Track how quickly members respond to nudges:

```sql
SELECT
  DATE_TRUNC('day', n.shown_at) as date,
  AVG(EXTRACT(EPOCH FROM (n.clicked_at - n.shown_at))) as avg_seconds_to_click,
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (n.clicked_at - n.shown_at))
  ) as median_seconds_to_click
FROM nudge_logs n
WHERE n.clicked_at IS NOT NULL
  AND n.shown_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', n.shown_at);
```

---

## 📊 Reporting Cadence

### Daily Reports

- Total referrals submitted
- Nudge CTR
- New jobs posted
- Member activity rate

### Weekly Reports

- Funnel analysis
- Conversion rate trends
- Top performing jobs
- Segment performance

### Monthly Reports

- Hire conversion analysis
- Cohort retention
- Experiment results
- AI performance metrics
- Cost analysis

---

## 🔔 Alerting

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Nudge CTR | < 5% | < 2% |
| Referral Rate | < 10% | < 5% |
| AI Fallback Rate | > 20% | > 50% |
| API Latency (p95) | > 500ms | > 1000ms |
| Error Rate | > 1% | > 5% |

### Implementation

```typescript
interface Alert {
  metric: string;
  threshold: number;
  currentValue: number;
  severity: "warning" | "critical";
  timestamp: Date;
}

async function checkMetricAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  
  const ctr = await calculateNudgeCTR();
  if (ctr < 0.02) {
    alerts.push({
      metric: "nudge_ctr",
      threshold: 0.02,
      currentValue: ctr,
      severity: "critical",
      timestamp: new Date()
    });
  } else if (ctr < 0.05) {
    alerts.push({
      metric: "nudge_ctr",
      threshold: 0.05,
      currentValue: ctr,
      severity: "warning",
      timestamp: new Date()
    });
  }

  // Send alerts
  for (const alert of alerts) {
    await notifySlack(alert);
    await logAlert(alert);
  }

  return alerts;
}
```
