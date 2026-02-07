import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { NudgeService } from '@/app/services/nudges/nudge.service';

export async function GET(request: Request, { params }: { params: { jobId: string } }) {
    const jobId = params.jobId;

    // Fetch job details
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { tags: true },
    });

    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fetch member profile data (assuming user is authenticated and we have userId)
    const userId = request.headers.get('user-id'); // Replace with actual user ID retrieval logic
    const memberProfile = await prisma.memberProfile.findUnique({
        where: { userId: userId },
    });

    if (!memberProfile) {
        return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
    }

    // Generate referral nudges
    const nudges = NudgeService.generateNudges(job.tags, memberProfile);

    return NextResponse.json(nudges);
}