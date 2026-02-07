import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Job } from '@prisma/client';

export async function GET(request: Request, { params }: { params: { jobId: string } }) {
    const { jobId } = params;

    try {
        const job: Job | null = await prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            return NextResponse.json({ message: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json(job);
    } catch (error) {
        return NextResponse.json({ message: 'Error retrieving job', error }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: { jobId: string } }) {
    const { jobId } = params;
    const data = await request.json();

    try {
        const updatedJob = await prisma.job.update({
            where: { id: jobId },
            data,
        });

        return NextResponse.json(updatedJob);
    } catch (error) {
        return NextResponse.json({ message: 'Error updating job', error }, { status: 500 });
    }
}