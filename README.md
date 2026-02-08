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

## 🚢 Deployment

### Vercel (Recommended)

This project is optimized for deployment on [Vercel](https://vercel.com).
1.  Connect your GitHub repository to Vercel.
2.  Configure the build settings (Framework Preset: Next.js).
3.  Add the environment variables from your `.env.local` file.
4.  Deploy.

### Docker
(Coming Soon)

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
