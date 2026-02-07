# Pieworks - Referral-Driven Hiring Platform

## Overview
Pieworks is a referral-driven hiring platform designed to facilitate job referrals among members. The platform enables users to create job postings, manage their profiles, and generate referral nudges based on job descriptions and member profiles.

## Tech Stack
- **Next.js**: A React framework for building server-rendered applications.
- **TypeScript**: A superset of JavaScript that adds static types.
- **Prisma ORM**: A modern database toolkit for TypeScript and Node.js.
- **PostgreSQL**: A powerful, open-source relational database.

## Features
1. **User Authentication**: Basic login and signup functionality with mock implementations.
2. **Job Management**: Create, retrieve, and manage job postings with automatic parsing of job descriptions.
3. **Member Profiles**: Store and manage member profile data, including skills and preferences.
4. **Referral Nudges**: Generate human-readable nudges to encourage referrals based on job tags and member profiles.
5. **Referral Management**: Create and track referrals while preventing duplicates.
6. **Event Tracking**: Log user actions for analytics purposes, such as job views and referral submissions.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- PostgreSQL database

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd pieworks
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the database:
   - Create a PostgreSQL database and update the connection string in the `.env` file.

4. Run Prisma migrations:
   ```
   npx prisma migrate dev --name init
   ```

5. Start the development server:
   ```
   npm run dev
   ```

### API Endpoints
- **Authentication**
  - `POST /api/auth/login`: User login
  - `POST /api/auth/signup`: User signup

- **Jobs**
  - `GET /api/jobs`: Retrieve all jobs
  - `GET /api/jobs/:jobId`: Retrieve a specific job
  - `GET /api/jobs/:jobId/referral-nudges`: Get referral nudges for a job

- **Referrals**
  - `POST /api/referrals`: Create a referral
  - `GET /api/referrals`: Retrieve all referrals

- **User Profile**
  - `GET /api/users/me`: Get current user profile
  - `PATCH /api/users/preferences`: Update user preferences

- **Events**
  - `POST /api/events`: Track user events

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.