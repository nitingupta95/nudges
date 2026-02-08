# Nudges: Referral-Driven Hiring Platform

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Nudges** is an enterprise-grade referral platform designed to leverage professional networks for talent acquisition. It helps companies tap into the hidden job market by proactively "nudging" employees to refer qualified candidates from their network.

## 🚀 Key Features

*   **Smart Nudge Engine**: Analyzes job descriptions and employee networks to suggest high-relevance referrals.
*   **AI-Powered Insights**: Uses LLMs (OpenAI) to extract skills, seniority, and department mapping from job descriptions.
*   **Referral Tracking**: End-to-end tracking of referrals from submission to hire, with duplicate prevention.
*   **Interactive Dashboard**: Personalized views for recruiters and employees to track active jobs and referral status.
*   **Role-Based Access**: Granular permissions for Admins, Recruiters, and Members.

## 🛠 Tech Stack

| Category | Technology |
|Data Storage| **PostgreSQL** (Prisma ORM) |
|Backend Framework| **Next.js 16** (App Router) |
|Language| **TypeScript** |
|Frontend UI| **React 19**, **Tailwind CSS 4**, **shadcn/ui** |
|AI/ML| **OpenAI API** |
|State Management| **React Query**, Context API |
|Testing| **Vitest** |

## � Project Structure

```bash
├── app/                  # Next.js App Router (Pages & API Routes)
│   ├── api/              # RESTful API endpoints
│   ├── dashboard/        # Recruiter & Employee Dashboards
│   ├── jobs/             # Job Board & Details
│   └── referrals/        # Referral Management Workflows
├── components/           # Reusable UI Components
├── lib/                  # Shared Utilities & API Clients
├── prisma/               # Database Schema & Migrations
└── services/             # Core Business Logic (Service Layer)
    ├── ai/               # AI Integration Services
    ├── nudges/           # Nudge Generation Logic
    └── ...
```

## � Getting Started

### Prerequisites

*   Node.js v20+
*   PostgreSQL v15+
*   OpenAI API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/nitingupta95/nudges.git
    cd nudges
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Configuration**
    Copy the example env file and update the variables:
    ```bash
    cp .env.example .env.local
    ```
    **Required Variables:**
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/nudges_db"
    OPENAI_API_KEY="sk-..."
    NEXTAUTH_SECRET="your-super-secret-key"
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```

4.  **Database Setup**
    ```bash
    npx prisma migrate dev --name init
    npx prisma generate
    ```

5.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:3000`.

## 🚢 Deployment (Vercel)

This project is optimized for [Vercel](https://vercel.com), the creators of Next.js.

### 1. Database Setup (Crucial Step)
Since Vercel is serverless, you need a cloud-hosted PostgreSQL database.
- **Recommended**: [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech/), or [Supabase](https://supabase.com/).
- **Connection String**: Get your `DATABASE_URL` (ensure it's the transaction pooling URL if using Supabase/Neon in serverless environments).

### 2. Project Configuration
This project includes a `postinstall` script in `package.json` to automatically generate the Prisma Client during the build process:
```json
"postinstall": "prisma generate"
```

### 3. Deploy to Vercel
1.  **Push to GitHub**: Ensure your code is pushed to a GitHub repository.
2.  **Import in Vercel**:
    - Go to your Vercel Dashboard.
    - Click **"Add New..."** -> **"Project"**.
    - Import your GitHub repository.
3.  **Configure Environment Variables**:
    - Expand the **"Environment Variables"** section.
    - Add the following:
      - `DATABASE_URL`: Your cloud database connection string.
      - `OPENAI_API_KEY`: Your OpenAI API key.
      - `NEXTAUTH_SECRET`: A random string for auth encryption.
      - `NEXT_PUBLIC_APP_URL`: Your production URL options (e.g. `https://your-project.vercel.app`).
4.  **Deploy**: Click **"Deploy"**.

### 4. Run Migrations (Post-Deploy)
After the deployment is "Ready", you need to push your database schema to the production database.
- **Option A (Vercel Console)**:
  - Go to the **Storage** tab in your Vercel project (if using Vercel Postgres).
  - Or use the **Vercel CLI**: `vercel env pull .env.production` then `npx prisma migrate deploy`.
- **Option B (Local CLI)**:
  - Create a temporary `.env.production` file with your production `DATABASE_URL`.
  - Run:
    ```bash
    DATABASE_URL="your-prod-url" npx prisma migrate deploy
    ```
  *Note: `migrate deploy` is safer for production than `migrate dev`.*

## 🧪 Testing

Run the test suite to ensure system stability:

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
