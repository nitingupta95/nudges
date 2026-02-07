import type {
  Job,
  ReferralSubmission,
  User,
  MessageTemplate,
} from "@/types";

export const currentUser: User = {
  id: "u-1",
  name: "Arjun Mehta",
  email: "arjun@example.com",
  roles: ["member"],
  profile: {
    skills: ["react", "typescript", "node.js", "system design"],
    pastCompanies: ["Flipkart", "Razorpay"],
    experienceYears: 6,
    preferences: ["relatives_in_tech"],
  },
};

export const mockJobs: Job[] = [
  {
    id: "j-1",
    title: "Senior Frontend Engineer",
    company: { id: "c-1", name: "Zerodha", type: "Fintech" },
    location: "Bengaluru, India",
    postedAt: "2026-01-28T10:00:00Z",
    closingAt: "2026-02-14T23:59:59Z",
    description:
      "We're looking for a Senior Frontend Engineer to lead our trading dashboard rebuild. You'll work closely with product and design to ship performant, real-time interfaces used by millions of traders daily.\n\nThe ideal candidate has deep experience with React, TypeScript, and WebSocket-driven UIs. You should be comfortable owning large features end-to-end and mentoring junior engineers.\n\nThis is a high-impact role — the trading dashboard is our most-used product surface.",
    responsibilities: [
      "Own the frontend architecture for the trading dashboard",
      "Build real-time data visualization components",
      "Collaborate with backend engineers on API contracts",
      "Mentor junior frontend engineers",
      "Drive performance optimization across the platform",
    ],
    requirements: [
      "5+ years of frontend development experience",
      "Strong proficiency in React and TypeScript",
      "Experience with WebSocket or real-time data systems",
      "Understanding of financial markets is a plus",
    ],
    skills: ["react", "typescript", "websocket", "performance", "system design"],
    experienceLevel: "senior",
    domain: "Fintech",
  },
  {
    id: "j-2",
    title: "Backend Engineer — Payments",
    company: { id: "c-2", name: "Razorpay", type: "Fintech" },
    location: "Bengaluru, India",
    postedAt: "2026-01-30T10:00:00Z",
    closingAt: "2026-02-20T23:59:59Z",
    description:
      "Join the Payments team at Razorpay to build and scale payment processing systems handling millions of transactions daily. You'll design APIs, optimize database queries, and ensure five-nines uptime for critical payment flows.",
    responsibilities: [
      "Design and implement payment processing APIs",
      "Optimize database performance for high-throughput systems",
      "Build monitoring and alerting for payment flows",
      "Participate in on-call rotation for critical systems",
    ],
    requirements: [
      "3+ years backend development experience",
      "Strong in Go, Java, or Python",
      "Experience with distributed systems",
      "Understanding of payment processing is a plus",
    ],
    skills: ["go", "distributed systems", "postgresql", "api design", "payments"],
    experienceLevel: "mid",
    domain: "Fintech",
  },
  {
    id: "j-3",
    title: "Product Designer",
    company: { id: "c-3", name: "Notion", type: "Productivity" },
    location: "Remote",
    postedAt: "2026-02-01T10:00:00Z",
    closingAt: "2026-02-28T23:59:59Z",
    description:
      "We're hiring a Product Designer to shape the future of collaborative workspaces. You'll work on core editor experiences, designing interactions that feel intuitive for millions of users worldwide.\n\nWe value designers who think in systems, prototype rapidly, and communicate design decisions clearly.",
    responsibilities: [
      "Design end-to-end product experiences for the editor",
      "Create and maintain design system components",
      "Conduct user research and usability testing",
      "Partner with engineering to ship high-quality features",
    ],
    requirements: [
      "4+ years of product design experience",
      "Strong portfolio demonstrating systems thinking",
      "Proficiency with Figma",
      "Experience with complex, data-rich interfaces",
    ],
    skills: ["figma", "design systems", "user research", "prototyping"],
    experienceLevel: "mid",
    domain: "Productivity",
  },
  {
    id: "j-4",
    title: "Machine Learning Engineer",
    company: { id: "c-4", name: "Swiggy", type: "Consumer" },
    location: "Bengaluru, India",
    postedAt: "2026-02-03T10:00:00Z",
    description:
      "Build ML models that power recommendations, ETA predictions, and dynamic pricing for India's largest food delivery platform. You'll work with massive-scale data pipelines and deploy models serving real-time traffic.",
    responsibilities: [
      "Build and deploy ML models for recommendations",
      "Optimize model performance for real-time inference",
      "Design feature engineering pipelines",
      "Collaborate with product teams on experimentation",
    ],
    requirements: [
      "3+ years ML engineering experience",
      "Strong Python and ML framework skills",
      "Experience with large-scale data pipelines",
    ],
    skills: ["python", "machine learning", "tensorflow", "data pipelines", "recommendations"],
    experienceLevel: "mid",
    domain: "Consumer",
  },
  {
    id: "j-5",
    title: "DevOps Engineer",
    company: { id: "c-5", name: "Postman", type: "Developer Tools" },
    location: "Remote",
    postedAt: "2026-02-04T10:00:00Z",
    closingAt: "2026-03-01T23:59:59Z",
    description:
      "We need a DevOps Engineer to scale our cloud infrastructure and CI/CD pipelines. You'll work on Kubernetes clusters, observability, and deployment automation for a platform used by 30M+ developers.",
    skills: ["kubernetes", "terraform", "aws", "ci/cd", "observability"],
    experienceLevel: "senior",
    domain: "Developer Tools",
  },
  {
    id: "j-6",
    title: "Junior Full Stack Developer",
    company: { id: "c-6", name: "Cred", type: "Fintech" },
    location: "Bengaluru, India",
    postedAt: "2026-02-05T10:00:00Z",
    closingAt: "2026-02-25T23:59:59Z",
    description:
      "Kickstart your career at Cred. We're looking for a motivated full-stack developer to work across our React frontend and Node.js backend. You'll ship features that delight millions of users while learning from experienced engineers.",
    skills: ["react", "node.js", "typescript", "postgresql"],
    experienceLevel: "junior",
    domain: "Fintech",
  },
];

export const mockNudges: Record<string, { nudges: string[]; explain?: string }> = {
  "j-1": {
    nudges: [
      "Think about frontend engineers you worked with at Flipkart or Razorpay — someone with React and real-time UI experience.",
      "Consider college batchmates who moved into fintech or trading platforms.",
      "Any ex-colleagues who specialize in performance optimization or WebSocket-based systems?",
    ],
    explain:
      "These suggestions are based on your past companies and overlapping skill areas with this role.",
  },
  "j-2": {
    nudges: [
      "You worked at Razorpay — think about backend engineers from your team who might be interested in returning or referring others.",
      "Any connections in the payments or distributed systems space?",
    ],
    explain:
      "Your experience at Razorpay makes your network especially relevant for this role.",
  },
  "j-3": {
    nudges: [
      "Know any product designers who work with design systems or complex editors?",
    ],
  },
  "j-4": {
    nudges: [],
  },
  "j-5": {
    nudges: [
      "Think about DevOps or SRE engineers from your past companies — anyone who works with Kubernetes at scale?",
    ],
  },
  "j-6": {
    nudges: [
      "Any college juniors or bootcamp graduates looking for their first full-stack role?",
      "Consider relatives or family friends who recently completed a CS degree.",
    ],
    explain:
      "You indicated you know relatives in tech — this junior role could be a good fit for someone starting out.",
  },
};

export const mockReferrals: ReferralSubmission[] = [
  {
    id: "r-1",
    jobId: "j-1",
    jobTitle: "Senior Frontend Engineer",
    companyName: "Zerodha",
    candidateName: "Priya Sharma",
    relation: "ex-colleague",
    note: "Priya and I worked together at Flipkart on the checkout redesign. She's excellent with React and performance work.",
    status: "shortlisted",
    createdAt: "2026-02-01T14:30:00Z",
    createdBy: "u-1",
    activity: [
      { timestamp: "2026-02-01T14:30:00Z", action: "Referral submitted" },
      { timestamp: "2026-02-02T09:00:00Z", action: "Viewed by recruiter" },
      { timestamp: "2026-02-04T11:00:00Z", action: "Candidate shortlisted for phone screen" },
    ],
  },
  {
    id: "r-2",
    jobId: "j-2",
    jobTitle: "Backend Engineer — Payments",
    companyName: "Razorpay",
    candidateName: "Vikram Reddy",
    candidateProfileUrl: "https://linkedin.com/in/vikramreddy",
    relation: "friend",
    note: "Vikram has 4 years of backend experience in Go and knows payment systems well.",
    status: "viewed",
    createdAt: "2026-02-03T10:00:00Z",
    createdBy: "u-1",
    activity: [
      { timestamp: "2026-02-03T10:00:00Z", action: "Referral submitted" },
      { timestamp: "2026-02-04T15:00:00Z", action: "Viewed by hiring manager" },
    ],
  },
  {
    id: "r-3",
    jobId: "j-6",
    jobTitle: "Junior Full Stack Developer",
    companyName: "Cred",
    candidateName: "Ananya Mehta",
    relation: "relative",
    note: "My cousin — just graduated with a CS degree and has been building side projects in React.",
    status: "pending",
    createdAt: "2026-02-05T16:00:00Z",
    createdBy: "u-1",
    activity: [
      { timestamp: "2026-02-05T16:00:00Z", action: "Referral submitted" },
    ],
  },
];

export const messageTemplates: MessageTemplate[] = [
  {
    id: "t-short",
    label: "Quick message",
    tone: "casual",
    body: "Hey — a company I trust is hiring a {role} with experience in {skills}. Thought of you — would you be open to a quick chat? If yes, I can introduce.",
  },
  {
    id: "t-neutral",
    label: "Professional",
    tone: "neutral",
    body: "Hi, hope you're well. I'm referring for a {role} at {company}; your experience with {skills} stood out. Would you like an intro?",
  },
  {
    id: "t-family",
    label: "Friends & family",
    tone: "warm",
    body: "Hey! Sharing a role that might interest someone you know — a {role} working with {skills}. If you or a family member are open, happy to connect.",
  },
];

export const domains = ["Fintech", "Productivity", "Consumer", "Developer Tools"];
export const experienceLevels = ["junior", "mid", "senior"];
export const locations = ["Bengaluru, India", "Remote"];
