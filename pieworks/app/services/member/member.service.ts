import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MemberProfileData {
  skills: string[];
  pastCompanies: string[];
  domains: string[];
  preferences: Record<string, any>;
}

export class MemberService {
  async createMemberProfile(userId: string, data: MemberProfileData) {
    return await prisma.memberProfile.create({
      data: {
        userId,
        skills: data.skills,
        pastCompanies: data.pastCompanies,
        domains: data.domains,
        preferences: data.preferences,
      },
    });
  }

  async getMemberProfile(userId: string) {
    return await prisma.memberProfile.findUnique({
      where: { userId },
    });
  }

  async updateMemberProfile(userId: string, data: Partial<MemberProfileData>) {
    return await prisma.memberProfile.update({
      where: { userId },
      data: {
        ...(data.skills && { skills: data.skills }),
        ...(data.pastCompanies && { pastCompanies: data.pastCompanies }),
        ...(data.domains && { domains: data.domains }),
        ...(data.preferences && { preferences: data.preferences }),
      },
    });
  }
}