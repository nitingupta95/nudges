import { Nudge } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { MemberProfile } from '@/app/services/member/member.service';
import { JobTag } from '@/app/services/job/job.service';

export class NudgeService {
  // Generate referral nudges based on job tags and member profiles
  async generateNudges(jobTags: JobTag[], memberProfile: MemberProfile): Promise<string[]> {
    const nudges: string[] = [];

    // Example logic for generating nudges
    if (memberProfile.skills.some(skill => jobTags.some(tag => tag.name === skill))) {
      nudges.push('People you’ve worked with on ' + memberProfile.skills.join(', '));
    }

    if (memberProfile.pastCompanies.some(company => jobTags.some(tag => tag.domain === company))) {
      nudges.push('Ex-colleagues from ' + memberProfile.pastCompanies.join(', '));
    }

    if (memberProfile.preferences.includes('tech')) {
      nudges.push('Relatives or close family members early in their tech career');
    }

    return nudges;
  }

  // Store a new nudge in the database
  async createNudge(nudgeData: Nudge): Promise<Nudge> {
    return await prisma.nudge.create({
      data: nudgeData,
    });
  }

  // Retrieve all nudges for a specific member
  async getNudgesForMember(memberId: string): Promise<Nudge[]> {
    return await prisma.nudge.findMany({
      where: { memberId },
    });
  }
}