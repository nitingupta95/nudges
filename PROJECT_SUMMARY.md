# Nudges Platform - Project Summary

## Executive Overview

**Nudges** is a sophisticated AI-powered employee referral platform that transforms how companies leverage their employees' professional networks for talent acquisition. The platform uses machine learning, intelligent matching algorithms, and personalized nudges to encourage high-quality referrals while providing comprehensive tracking and analytics.

## Core Value Proposition

1. **For Companies**: Tap into employees' networks to find pre-vetted, high-quality candidates
2. **For Recruiters**: Streamline referral management with AI-powered tools and analytics
3. **For Employees**: Easily refer qualified contacts with personalized guidance and tracking

## Technical Architecture

### Stack Overview
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui component library
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL 15+ with Prisma ORM
- **AI**: OpenAI GPT-4 for parsing, insights, and message generation
- **State Management**: TanStack Query (React Query), Context API
- **Authentication**: Custom JWT-based with PBKDF2 password hashing
- **Deployment**: Vercel-optimized serverless architecture

### Architecture Patterns
- **Service Layer**: Clean separation between API routes and business logic
- **Repository Pattern**: Prisma ORM for database abstraction
- **Component-Based UI**: Modular, reusable React components
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **API-First Design**: RESTful endpoints with consistent response formats

## Key Features & Functionality

### 1. AI-Powered Job Parsing
- Extracts skills (required vs. preferred)
- Identifies domains, industries, and tech stack
- Determines seniority levels and experience requirements
- Parses benefits, certifications, and education requirements
- Confidence scoring and manual override capability

### 2. Smart Matching System
Multi-factor scoring algorithm (0-100 scale):
- **Skill Overlap** (40%): Technical and soft skills alignment
- **Company Overlap** (20%): Past employer connections
- **Industry Overlap** (15%): Domain expertise match
- **Seniority Match** (15%): Experience level compatibility
- **Location Proximity** (10%): Geographic considerations

Match tiers: HIGH (70-100), MEDIUM (40-69), LOW (0-39)

### 3. Personalized Nudge Engine
- Analyzes member profiles against job requirements
- Generates contextual nudge messages
- Tracks engagement (views, clicks, dismissals)
- A/B testing support for optimization
- Multiple nudge types: personalized, company-based, skill-based, industry-based

### 4. Referral Lifecycle Management
11-stage workflow:
DRAFT → PENDING → SUBMITTED → VIEWED → UNDER_REVIEW → SHORTLISTED → INTERVIEWING → OFFERED → HIRED → REJECTED → WITHDRAWN

Features:
- Duplicate prevention (job + email unique constraint)
- Relationship context tracking
- Resume parsing and fit scoring
- Status history and activity logs
- Email notifications at key stages

### 5. AI Message Generation
- Platform-specific formats (WhatsApp, LinkedIn, Email)
- Tone customization (professional, casual, enthusiastic)
- Context-aware personalization
- Share link generation
- Template management with A/B testing

### 6. Analytics & Insights
- Conversion funnel tracking
- Engagement metrics (views, clicks, submissions)
- Recruiter dashboards with job performance
- Member dashboards with referral tracking
- Admin analytics with system-wide metrics

### 7. Resume Intelligence
- Automatic parsing of PDF/DOCX resumes
- Candidate information extraction
- Job fit score calculation
- Skills and experience matching
- Structured data storage for search

## Database Schema Highlights

### Core Models (20+ total)
- **User**: Authentication and identity (ADMIN, RECRUITER, MEMBER roles)
- **MemberProfile**: Professional data, skills, experience, preferences
- **Job**: Job postings with metadata and tracking
- **JobTag**: AI-parsed job attributes
- **Referral**: Referral submissions with relationship context
- **MatchScore**: Pre-computed member-job match scores
- **NudgeLog**: Nudge delivery and interaction tracking
- **Event**: Comprehensive analytics event tracking
- **MessageTemplate**: Reusable message templates
- **CronJobLog**: Automated task execution tracking

### Advanced Features
- Vector embeddings for similarity matching
- Composite unique indexes for data integrity
- Comprehensive indexing for query performance
- JSON fields for flexible metadata storage
- Audit trails for compliance

## User Roles & Permissions

### ADMIN
- Full system access
- Analytics dashboard
- User management
- System configuration
- All recruiter and member capabilities

### RECRUITER
- Create and manage job postings
- View all referrals for their jobs
- Access candidate pipeline
- Resume parsing and scoring
- Job-specific analytics
- Contact insights

### MEMBER (Employee)
- View personalized job matches
- Submit referrals with context
- Track referral status
- Generate referral messages
- Manage profile and preferences
- View personal analytics

## API Architecture

### 35+ RESTful Endpoints organized by domain:

**Authentication** (3 endpoints)
- Login, signup, logout

**Jobs** (7 endpoints)
- CRUD operations, filtering, summary generation, candidate listing

**Referrals** (5 endpoints)
- Submit, track, update status, resume upload

**AI Services** (5 endpoints)
- Job parsing, contact insights, message generation, summarization, budget tracking

**Matching** (3 endpoints)
- Score calculation, batch scoring, top member ranking

**Nudges** (3 endpoints)
- Personalized nudge generation, interaction tracking, statistics

**Users** (5 endpoints)
- Profile management, preferences, password changes

**Analytics** (2 endpoints)
- Event tracking, funnel metrics

**Email** (2 endpoints)
- Send emails, template management

## Current UI Implementation

### Design System
- **Color Scheme**: Light/dark mode support with OKLCH color space
- **Typography**: Geist Sans and Geist Mono fonts
- **Components**: 60+ shadcn/ui components
- **Animations**: Framer Motion for smooth transitions
- **Responsive**: Mobile-first design approach

### Page Structure
1. **Landing Page**: Hero section, how it works, CTA
2. **Login/Signup**: Glassmorphic cards with animations
3. **Member Dashboard**: Stats cards, job list, profile completeness
4. **Recruiter Dashboard**: Job management, referral tracking, analytics
5. **Admin Dashboard**: Funnel visualization, conversion metrics
6. **Job Details**: Full description, match score, referral form
7. **Profile Pages**: Skills, experience, preferences management

### Current UI Strengths
- Clean, modern aesthetic
- Consistent component usage
- Good accessibility foundations
- Responsive layouts
- Loading states and skeletons

### Current UI Limitations
- Basic visual hierarchy
- Limited use of animations
- Minimal data visualization
- Generic card layouts
- Underutilized white space
- Limited micro-interactions
- Basic color usage
- No advanced filtering UI
- Simple table displays
- Limited empty states

## Performance Considerations

### Optimizations in Place
- Database connection pooling (Prisma + pg)
- Strategic database indexing
- AI response caching
- Next.js automatic code splitting
- Image optimization
- Lazy loading for components

### Areas for Improvement
- Implement Redis for caching
- Add CDN for static assets
- Optimize bundle size
- Implement virtual scrolling for large lists
- Add service worker for offline support

## Security Features

- PBKDF2 password hashing (10,000 iterations)
- JWT token authentication with expiration
- Role-based access control (RBAC)
- Input validation with Zod schemas
- SQL injection prevention (Prisma ORM)
- XSS protection (React escaping)
- CSRF protection (SameSite cookies)
- Rate limiting for AI API calls

## Business Metrics & KPIs

### Tracked Metrics
- Job view count
- Nudge show/click rates
- Referral start/submit rates
- Conversion funnel stages
- Time-to-hire
- Referral quality scores
- User engagement rates
- AI API usage and costs

### Success Indicators
- View → Nudge: 40% target
- Nudge → Click: 8% target
- Click → Start: 50% target
- Start → Submit: 70% target
- Overall conversion: 2-3% target

## Integration Points

### Current Integrations
- OpenAI API for AI capabilities
- SMTP for email notifications
- PostgreSQL for data persistence

### Potential Future Integrations
- LinkedIn API for profile import
- ATS systems (Greenhouse, Lever, Workday)
- Slack/Teams for notifications
- Calendar APIs for interview scheduling
- Background check services
- Video interview platforms

## Deployment & DevOps

### Current Setup
- Vercel serverless deployment
- Neon/Supabase PostgreSQL hosting
- Environment-based configuration
- Automatic Prisma client generation

### CI/CD Opportunities
- Automated testing pipeline
- Staging environment
- Database migration automation
- Performance monitoring
- Error tracking (Sentry)
- Analytics (Mixpanel, Amplitude)

## Code Quality & Maintainability

### Strengths
- TypeScript for type safety
- Consistent code organization
- Service layer separation
- Reusable components
- Clear naming conventions

### Areas for Improvement
- Add comprehensive test coverage
- Implement E2E testing
- Add API documentation (Swagger)
- Create component storybook
- Add code quality tools (ESLint, Prettier)
- Implement pre-commit hooks

## Scalability Considerations

### Current Capacity
- Serverless architecture scales automatically
- Database connection pooling
- Stateless API design

### Future Scaling Needs
- Implement caching layer (Redis)
- Add read replicas for database
- Implement job queues for async tasks
- Add CDN for global distribution
- Consider microservices for AI processing
- Implement rate limiting at API gateway

## User Experience Flow

### Member Journey
1. Sign up / Login
2. Complete profile (skills, experience, companies)
3. View personalized job matches on dashboard
4. See nudges for high-match jobs
5. Click nudge → View job details
6. Generate referral message
7. Submit referral with candidate info
8. Track referral status
9. Receive notifications on status changes

### Recruiter Journey
1. Sign up / Login
2. Create job posting
3. AI parses job description
4. System generates matches
5. View candidate referrals
6. Review resumes and fit scores
7. Update referral status
8. Track conversion metrics
9. Analyze job performance

## Competitive Advantages

1. **AI-First Approach**: Deep integration of AI for parsing, matching, and generation
2. **Explainable Matching**: Transparent scoring with detailed breakdowns
3. **Relationship Context**: Captures how referrer knows candidate
4. **Comprehensive Analytics**: Full funnel tracking and optimization
5. **Developer-Friendly**: Clean API, good documentation, extensible architecture
6. **Modern Tech Stack**: Latest frameworks and best practices

## Future Roadmap Opportunities

### Short-term (1-3 months)
- Enhanced UI/UX with modern design patterns
- Advanced filtering and search
- Mobile app (React Native)
- Email template builder
- Bulk job import

### Medium-term (3-6 months)
- LinkedIn integration
- ATS integrations
- Advanced analytics dashboard
- Referral leaderboards and gamification
- Multi-language support

### Long-term (6-12 months)
- AI-powered candidate sourcing
- Video interview integration
- Blockchain-based referral rewards
- Predictive analytics for hiring success
- White-label solution for enterprises

## Success Metrics

### Platform Health
- 95%+ uptime
- <500ms API response time
- <2s page load time
- Zero critical security vulnerabilities

### User Engagement
- 60%+ weekly active users
- 3+ referrals per active member per month
- 70%+ referral submission completion rate
- 4.5+ star user satisfaction rating

### Business Impact
- 30%+ reduction in time-to-hire
- 50%+ increase in referral volume
- 2x improvement in referral quality
- 40%+ cost savings vs. traditional recruiting

---

**Last Updated**: February 2026
**Version**: 1.0
**Status**: Production-ready with enhancement opportunities
