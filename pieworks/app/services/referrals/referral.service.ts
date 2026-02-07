import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateReferralInput {
  userId: string;
  jobId: string;
  relationType: 'friend' | 'ex-colleague' | 'relative' | 'other';
  message: string;
}

export class ReferralService {
  async createReferral(input: CreateReferralInput) {
    const existingReferral = await prisma.referral.findUnique({
      where: {
        userId_jobId_relationType: {
          userId: input.userId,
          jobId: input.jobId,
          relationType: input.relationType,
        },
      },
    });

    if (existingReferral) {
      throw new Error('Referral already exists');
    }

    const referral = await prisma.referral.create({
      data: {
        userId: input.userId,
        jobId: input.jobId,
        relationType: input.relationType,
        message: input.message,
        status: 'PENDING', // Initial status
      },
    });

    return referral;
  }

  async getReferrals(userId: string) {
    return await prisma.referral.findMany({
      where: { userId },
    });
  }

  async updateReferralStatus(referralId: string, status: string) {
    return await prisma.referral.update({
      where: { id: referralId },
      data: { status },
    });
  }
}