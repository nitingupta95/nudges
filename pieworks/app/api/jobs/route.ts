import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Job } from '@prisma/client';

// Handler for GET and POST requests to /api/jobs
export async function GET() {
    try {
        const jobs = await prisma.job.findMany();
        return NextResponse.json(jobs);
    } catch (error) {
        return NextResponse.error();
    }
}

export async function POST(request: Request) {
    const data = await request.json();
    
    try {
        const newJob = await prisma.job.create({
            data: {
                title: data.title,
                description: data.description,
                company: data.company,
                location: data.location,
                // Additional fields can be added here
            },
        });
        return NextResponse.json(newJob, { status: 201 });
    } catch (error) {
        return NextResponse.error();
    }
}