const translations: Record<string, string> = {
  // Navigation
  "nav.dashboard": "Dashboard",
  "nav.referrals": "My Referrals",
  "nav.profile": "Profile",
  "nav.settings": "Settings",
  "nav.login": "Log in",
  "nav.signup": "Sign up",
  "nav.logout": "Log out",

  // Landing
  "landing.headline": "Refer people you trust to roles that matter",
  "landing.subheadline":
    "Nudges helps you remember who in your network to reach out to — and makes referring them effortless.",
  "landing.cta.start": "Get started",
  "landing.cta.post": "Post a job",
  "landing.step1.title": "Browse open roles",
  "landing.step1.desc": "See curated jobs from companies that value referrals.",
  "landing.step2.title": "Get personalized nudges",
  "landing.step2.desc":
    "We help you think about who in your network might be a great fit — no contact scraping, ever.",
  "landing.step3.title": "Refer with one click",
  "landing.step3.desc":
    "Copy a message, send it your way, and track the referral status in real time.",
  "landing.privacy": "We only use your profile info — we do NOT access your contacts.",

  // Dashboard
  "dashboard.title": "Open Roles",
  "dashboard.empty": "No roles match your filters right now. Try broadening your search.",
  "dashboard.closingSoon": "Closing soon",
  "dashboard.filters.domain": "Domain",
  "dashboard.filters.experience": "Experience",
  "dashboard.filters.location": "Location",
  "dashboard.filters.closingSoon": "Closing soon",
  "dashboard.filters.clear": "Clear filters",

  // Job Detail
  "job.backToJobs": "Back to jobs",
  "job.postedOn": "Posted {date}",
  "job.closesOn": "Closes {date}",
  "job.description": "About this role",
  "job.responsibilities": "Responsibilities",
  "job.requirements": "Requirements",
  "job.skills": "Skills",
  "job.noSkills": "No explicit skills listed — think broadly about relevant people.",
  "job.readMore": "Read more",
  "job.readLess": "Show less",
  "job.copyMessage": "Copy a message",
  "job.referSomeone": "Refer someone",

  // Nudges
  "nudge.title": "Who should you reach out to?",
  "nudge.empty": "No strong suggestions — you might still know someone.",
  "nudge.error": "We couldn't load suggestions. Try again in a moment.",
  "nudge.retry": "Retry",
  "nudge.whyThis": "Why this suggestion?",

  // Referral Composer
  "composer.title": "Draft your referral message",
  "composer.template": "Template",
  "composer.copy": "Copy message",
  "composer.copied": "Copied to clipboard",
  "composer.openLinkedIn": "Open LinkedIn",
  "composer.markContacted": "Mark as contacted",
  "composer.submitReferral": "Submit referral",
  "composer.charLimit": "{count} / {max} characters",

  // Referral Submission
  "submit.title": "Refer someone for this role",
  "submit.candidateName": "Candidate name",
  "submit.profileUrl": "Profile URL (optional)",
  "submit.relation": "How do you know them?",
  "submit.note": "Short note (optional)",
  "submit.submit": "Submit referral",
  "submit.success": "Referral submitted — we'll update you when the company responds.",
  "submit.duplicate":
    "Looks like you already submitted a similar referral. Confirm to proceed.",
  "submit.confirmDuplicate": "Submit anyway",
  "submit.validation": "Please provide at least a name or profile URL, and select a relation.",

  // Referrals Page
  "referrals.title": "My Referrals",
  "referrals.empty": "You haven't submitted any referrals yet. Browse open roles to get started.",
  "referrals.viewJob": "View job",
  "referrals.activity": "Activity",

  // Statuses
  "status.pending": "Pending",
  "status.viewed": "Viewed",
  "status.shortlisted": "Shortlisted",
  "status.hired": "Hired",
  "status.rejected": "Rejected",

  // Profile
  "profile.title": "Your Profile",
  "profile.skills": "Skills",
  "profile.companies": "Past Companies",
  "profile.experience": "Experience",
  "profile.years": "{count} years",
  "profile.preferences": "Network Preferences",
  "profile.prefExplain":
    "These optional flags help us suggest better referral prompts. No contacts are accessed.",
  "profile.relativesInTech": "I know relatives in tech",
  "profile.collegeJuniors": "I'm in touch with college juniors",
  "profile.bootcampGrads": "I know bootcamp graduates",

  // Settings
  "settings.title": "Settings",
  "settings.privacy": "Privacy",
  "settings.privacyNote":
    "Nudges never accesses your contacts, email, or social accounts. Nudges are generated from your self-reported skills and preferences only.",
  "settings.dataUsed": "Data used to generate nudges",
  "settings.policyLink": "Read our full privacy policy",

  // Auth
  "auth.login": "Log in to Nudges",
  "auth.signup": "Create your account",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.name": "Full name",
  "auth.loginButton": "Log in",
  "auth.signupButton": "Create account",
  "auth.noAccount": "Don't have an account?",
  "auth.hasAccount": "Already have an account?",
  "auth.oauthComingSoon": "Coming soon",
  "auth.privacyNotice":
    "We only use your profile info — we do NOT access your contacts.",

  // Errors
  "error.network": "Network error — please retry.",
  "error.generic": "Something went wrong. Please try again.",
  "error.notFound": "Page not found",
};

export function t(key: string, params?: Record<string, string>): string {
  let text = translations[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
}
