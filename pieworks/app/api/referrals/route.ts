import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { ReferralStatus } from '@prisma/client';

export async function POST(request: Request) {
    const { userId, jobId, relationType } = await request.json();

    // Check for existing referral to prevent duplicates
    const existingReferral = await prisma.referral.findUnique({
        where: {
            userId_jobId_relationType: {
                userId,
                jobId,
                relationType,
            },
        },
    });

    if (existingReferral) {
        return NextResponse.json({ message: 'Referral already exists' }, { status: 400 });
    }

    // Create a new referral
    const referral = await prisma.referral.create({
        data: {
            userId,
            jobId,
            relationType,
            status: ReferralStatus.PENDING,
        },
    });

    return NextResponse.json(referral, { status: 201 });
}

export async function GET() {
    const referrals = await prisma.referral.findMany();
    return NextResponse.json(referrals);
}