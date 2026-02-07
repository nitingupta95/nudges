import { MemberProfile, JobTag } from '@prisma/client';

export interface Nudge {
  message: string;
  explanation: string;
}

export class NudgeEngine {
  static generateNudges(memberProfile: MemberProfile, jobTags: JobTag[]): Nudge[] {
    const nudges: Nudge[] = [];

    // Example rules for generating nudges based on job tags and member profile
    if (memberProfile.skills.some(skill => jobTags.some(tag => tag.name === skill))) {
      nudges.push({
        message: 'People you’ve worked with on ' + memberProfile.skills.join(', '),
        explanation: 'You have skills that match the job requirements.'
      });
    }

    if (memberProfile.pastCompanies.some(company => jobTags.some(tag => tag.name === company))) {
      nudges.push({
        message: 'Ex-colleagues from ' + memberProfile.pastCompanies.join(', '),
        explanation: 'You have worked at companies relevant to this job.'
      });
    }

    if (memberProfile.domains.some(domain => jobTags.some(tag => tag.name === domain))) {
      nudges.push({
        message: 'Connections in ' + memberProfile.domains.join(', ') + ' domain',
        explanation: 'Your experience in these domains aligns with the job.'
      });
    }

    // Additional rules can be added here

    return nudges;
  }
}