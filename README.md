# Nudges: AI-Powered Referral Platform

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)

**Nudges** is an enterprise-grade referral platform that leverages AI and professional networks to revolutionize talent acquisition. The platform intelligently matches job openings with employees' networks, generating personalized "nudges" to encourage high-quality referrals.

## 🎯 Overview

Nudges transforms employee referral programs by:
- Analyzing job descriptions using AI to extract skills, seniority, and requirements
- Matching jobs with employees based on their professional networks and expertise
- Generating personalized nudge messages to encourage relevant referrals
- Tracking the complete referral lifecycle from submission to hire
- Providing analytics and insights for recruiters and hiring managers

## 🚀 Key Features

### For Recruiters & Admins
- **Job Management**: Create and manage job postings with AI-powered parsing
- **Candidate Pipeline**: Track referrals through the entire hiring funnel
- **Analytics Dashboard**: View referral metrics, conversion rates, and engagement stats
- **Resume Parsing**: Automatic extraction of candidate information from resumes
- **Contact Insights**: AI-generated suggestions for who to contact about job openings

### For Employees (Members)
- **Smart Nudges**: Personalized job recommendations based on network and expertise
- **Match Scoring**: See how well jobs match your network (0-100 score with tier classification)
- **Easy Referral**: Streamlined referral submission with relationship context
- **Message Generation**: AI-powered referral messages for WhatsApp, LinkedIn, and email
- **Referral Tracking**: Monitor the status of submitted referrals

### AI-Powered Capabilities
- **Job Description Parsing**: Extracts skills, domains, seniority, tech stack, and requirements
- **Contact Insights**: Identifies relevant roles and departments to target
- **Message Generation**: Creates personalized outreach messages
- **Resume Analysis**: Parses resumes and calculates fit scores
- **Budget Management**: Tracks and limits AI API usage

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Frontend** | React 19, Tailwind CSS 4, shadcn/ui |
| **Database** | PostgreSQL 15+ with Prisma ORM |
| **AI/ML** | OpenAI API (GPT-4) |
| **State Management** | TanStack Query (React Query), Context API |
| **Authentication** | Custom JWT-based auth with PBKDF2 password hashing |
| **Email** | Nodemailer with SMTP |
| **Testing** | Vitest |
| **Deployment** | Vercel-ready with serverless architecture |

## 📁 Project Architecture

```
nudges/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (35 endpoints)
│   │   ├── ai/                   # AI services (parsing, insights, messages)
│   │   ├── analytics/            # Analytics and funnel tracking
│   │   ├── auth/                 # Authentication (login, signup, logout)
│   │   ├── email/                # Email sending and templates
│   │   ├── events/               # Event tracking
│   │   ├── jobs/                 # Job CRUD and related operations
│   │   ├── matching/             # Match scoring and ranking
│   │   ├── messages/             # Message generation
│   │   ├── nudges/               # Nudge generation and tracking
│   │   ├── referrals/            # Referral management
│   │   └── users/                # User profile and preferences
│   ├── dashboard/                # Dashboard pages
│   │   ├── admin/                # Admin dashboard
│   │   ├── member/               # Member dashboard and views
│   │   └── recruiter/            # Recruiter dashboard and views
│   ├── landing/                  # Landing page
│   ├── login/                    # Login page
│   ├── signup/                   # Signup page
│   └── settings/                 # User settings
├── components/                   # React components
│   ├── email/                    # Email composer
│   ├── jobs/                     # Job cards and lists
│   ├── layout/                   # Header, footer, page layout
│   ├── referrals/                # Referral forms and tracking
│   ├── resume/                   # Resume upload and ranking
│   └── ui/                       # shadcn/ui components
├── contexts/                     # React contexts
│   └── auth-contex.tsx           # Authentication context
├── lib/                          # Shared utilities
│   ├── generated/prisma/         # Generated Prisma client
│   ├── middleware/               # API middleware
│   ├── api.ts                    # Frontend API client
│   ├── auth.ts                   # Authentication utilities
│   ├── prisma.ts                 # Prisma client setup
│   └── utils.ts                  # Helper functions
├── prisma/                       # Database
│   └── schema.prisma             # Database schema (20+ models)
├── services/                     # Business logic layer
│   ├── ai/                       # AI service, caching, budget
│   ├── auth/                     # Authentication service
│   ├── email/                    # Email service
│   ├── events/                   # Event tracking service
│   ├── job/                      # Job service and parser
│   ├── matching/                 # Match scoring service
│   ├── member/                   # Member profile service
│   ├── messages/                 # Message generation service
│   ├── nudges/                   # Nudge generation service
│   ├── referrals/                # Referral service
│   ├── resume/                   # Resume parsing service
│   └── user/                     # User service
└── types/                        # TypeScript type definitions
```

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with 20+ models:

### Core Models
- **User**: Authentication and user identity (ADMIN, RECRUITER, MEMBER roles)
- **MemberProfile**: Professional information, skills, experience, preferences
- **Job**: Job postings with metadata and tracking
- **JobTag**: AI-parsed job attributes (skills, domains, tech stack)
- **Referral**: Referral submissions with relationship context and status tracking

### Matching & Scoring
- **MatchScore**: Pre-computed match scores between members and jobs
- **MemberEmbedding**: Vector embeddings for similarity matching
- **JobEmbedding**: Vector embeddings for job similarity

### Nudge System
- **NudgeLog**: Track nudges shown to members
- **NudgeInteraction**: Granular interaction tracking (viewed, clicked, dismissed)
- **NudgeTemplate**: Configurable nudge message templates

### Analytics & Tracking
- **Event**: Comprehensive event tracking (views, clicks, submissions)
- **ReferralActivity**: Audit log for referral status changes
- **CronJobLog**: Automated task execution tracking

### Templates & Communication
- **MessageTemplate**: Reusable message templates with A/B testing support
- **EmailTemplate**: Email templates for various scenarios

## 🔌 API Endpoints

The platform provides 35+ RESTful API endpoints organized by domain:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Jobs
- `GET /api/jobs` - List jobs with filters
- `GET /api/jobs/[jobId]` - Get job details
- `POST /api/jobs` - Create new job (Recruiter/Admin)
- `PUT /api/jobs/[jobId]` - Update job
- `GET /api/jobs/[jobId]/summary` - AI-generated job summary
- `GET /api/jobs/[jobId]/candidates` - List candidates for job
- `GET /api/jobs/stats` - Job statistics

### Referrals
- `GET /api/referrals` - List user's referrals
- `POST /api/referrals` - Submit new referral
- `GET /api/referrals/[id]` - Get referral details
- `PUT /api/referrals/[id]/status` - Update referral status
- `POST /api/referrals/[id]/resume` - Upload candidate resume

### AI Services
- `POST /api/ai/parse-job` - Parse job description
- `POST /api/ai/contact-insights` - Generate contact insights
- `POST /api/ai/generate-message` - Generate referral message
- `POST /api/ai/summarize` - Summarize job description
- `GET /api/ai/budget` - Check AI usage budget

### Matching & Nudges
- `GET /api/matching/score` - Calculate match score
- `POST /api/matching/batch-score` - Batch score multiple members
- `GET /api/matching/top-members/[jobId]` - Get top matches for job
- `GET /api/nudges/personalized` - Get personalized nudge
- `POST /api/nudges/interactions` - Track nudge interaction
- `GET /api/nudges/stats` - Nudge statistics

### User Management
- `GET /api/users/me` - Get current user
- `GET /api/users/me/profile` - Get user profile
- `PUT /api/users/me/profile` - Update user profile
- `PUT /api/users/password` - Change password
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update preferences

### Analytics
- `POST /api/events` - Track event
- `GET /api/analytics/funnel` - Get conversion funnel data

### Email
- `POST /api/email/send` - Send email
- `GET /api/email/template` - Get email template

## 🎨 UI Components

Built with shadcn/ui and custom components:

### Job Components
- `JobCard` - Display job with match score and actions
- `JobList` - Filterable job listing with pagination
- `JobCardSkeleton` - Loading state for job cards

### Referral Components
- `ReferralComposer` - Multi-step referral submission form
- `ReferralSubmission` - Referral form with validation
- `ReferralNudges` - Display personalized nudges
- `ReferralStatus` - Track referral progress
- `ContactInsightsPanel` - Show AI-generated contact suggestions

### Resume Components
- `ResumeUpload` - Drag-and-drop resume upload
- `CandidateRanking` - Display ranked candidates

### Email Components
- `EmailComposerDialog` - Compose and send emails

### Layout Components
- `Header` - Navigation with role-based menu
- `Footer` - Site footer
- `PageLayout` - Consistent page wrapper

## 📊 Key Features Deep Dive

### Smart Matching Algorithm
The platform uses a multi-factor scoring system:
- **Skill Overlap** (40%): Matches required skills with member expertise
- **Company Overlap** (20%): Considers past companies and network
- **Industry Overlap** (15%): Domain and industry alignment
- **Seniority Match** (15%): Experience level compatibility
- **Location Proximity** (10%): Geographic considerations

Match scores are classified into tiers:
- **HIGH**: 70-100 (Strong match)
- **MEDIUM**: 40-69 (Moderate match)
- **LOW**: 0-39 (Weak match)

### Nudge Generation System
Nudges are personalized messages that encourage referrals:

1. **Matching**: System identifies high-scoring job-member pairs
2. **Template Selection**: Chooses appropriate nudge template based on match type
3. **Personalization**: Fills template with specific match reasons
4. **Delivery**: Shows nudge in member dashboard
5. **Tracking**: Monitors views, clicks, and conversions

Nudge types:
- `PERSONALIZED`: Based on specific skills/experience
- `COMPANY_BASED`: Former colleagues at target company
- `SKILL_BASED`: Technical skill alignment
- `INDUSTRY_BASED`: Industry experience match
- `GENERIC`: General referral opportunity

### Referral Lifecycle
Referrals progress through defined statuses:
1. `DRAFT` - Started but not submitted
2. `PENDING` - Awaiting initial review
3. `SUBMITTED` - Formally submitted to recruiter
4. `VIEWED` - Recruiter has viewed
5. `UNDER_REVIEW` - Being evaluated
6. `SHORTLISTED` - Selected for interview
7. `INTERVIEWING` - In interview process
8. `OFFERED` - Job offer extended
9. `HIRED` - Successfully hired
10. `REJECTED` - Not selected
11. `WITHDRAWN` - Referrer withdrew

### AI Integration
The platform uses OpenAI's GPT-4 for:

**Job Parsing**:
- Extracts skills (required vs. preferred)
- Identifies domains and industries
- Determines seniority level
- Parses tech stack and tools
- Extracts benefits and requirements

**Contact Insights**:
- Suggests relevant roles to contact
- Identifies key departments
- Generates outreach strategy

**Message Generation**:
- Creates personalized referral messages
- Adapts tone (professional, casual, enthusiastic)
- Generates platform-specific formats (WhatsApp, LinkedIn, Email)

**Resume Parsing**:
- Extracts candidate information
- Calculates job fit score
- Identifies key qualifications

**Budget Management**:
- Tracks API usage per user/day
- Enforces spending limits
- Provides usage analytics

## 🚦 Getting Started

### Prerequisites

- Node.js v20+
- PostgreSQL v15+
- OpenAI API Key
- SMTP credentials (for email)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nitingupta95/nudges.git
   cd nudges
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/nudges_db"
   
   # OpenAI
   OPENAI_API_KEY="sk-..."
   
   # Authentication
   AUTH_SECRET="your-super-secret-key-change-in-production"
   
   # Email (SMTP)
   SMTP_HOST="smtp.gmail.com"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   
   # Application
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

4. **Database Setup**
   ```bash
   # Run migrations
   npx prisma migrate dev --name init
   
   # Generate Prisma client
   npx prisma generate
   
   # (Optional) Seed database with sample data
   npx prisma db seed
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   Access the application at `http://localhost:3000`

### Default User Roles

After setup, you can create users with different roles:
- **ADMIN**: Full system access
- **RECRUITER**: Manage jobs and view all referrals
- **MEMBER**: Submit referrals and view personal dashboard

## 🚢 Deployment

### Vercel Deployment (Recommended)

This project is optimized for [Vercel](https://vercel.com):

1. **Database Setup**
   - Use a cloud PostgreSQL provider:
     - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
     - [Neon](https://neon.tech/)
     - [Supabase](https://supabase.com/)
   - Get your connection string (use pooling URL for serverless)

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `DATABASE_URL`
     - `OPENAI_API_KEY`
     - `AUTH_SECRET`
     - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
     - `NEXT_PUBLIC_APP_URL`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

5. **Run Database Migrations**
   ```bash
   # Using Vercel CLI
   vercel env pull .env.production
   DATABASE_URL="your-prod-url" npx prisma migrate deploy
   ```

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t nudges .
docker run -p 3000:3000 --env-file .env nudges
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📈 Performance Optimizations

- **Database Indexing**: Strategic indexes on frequently queried fields
- **Connection Pooling**: Prisma with pg adapter for efficient connections
- **Caching**: AI response caching to reduce API costs
- **Lazy Loading**: Components and routes loaded on demand
- **Image Optimization**: Next.js automatic image optimization
- **API Route Optimization**: Efficient queries with Prisma select/include

## 🔒 Security Features

- **Password Hashing**: PBKDF2 with salt (10,000 iterations)
- **JWT Authentication**: Secure token-based auth with expiration
- **Role-Based Access Control**: Granular permissions per endpoint
- **Input Validation**: Zod schemas for request validation
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: React's built-in escaping
- **CSRF Protection**: SameSite cookies
- **Rate Limiting**: API budget management for AI calls

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style
- Ensure all tests pass before submitting PR

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👥 Authors

- **Nitin Gupta** - Initial work - [nitingupta95](https://github.com/nitingupta95)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [OpenAI](https://openai.com/) - AI capabilities
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vercel](https://vercel.com/) - Hosting platform

## 📞 Support

For support, email ng61315@gmail.com or open an issue in the repository.

---

Built with ❤️ using Next.js, TypeScript, and AI
