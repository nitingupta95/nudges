import { PrismaClient } from '@prisma/client';
import { Job, JobTag } from '@prisma/client';
import { parseJobDescription } from './job.parser';

const prisma = new PrismaClient();

export class JobService {
  async createJob(jobData: Omit<Job, 'id'>): Promise<Job> {
    const parsedTags = parseJobDescription(jobData.description);
    
    const job = await prisma.job.create({
      data: {
        title: jobData.title,
        description: jobData.description,
        company: jobData.company,
        tags: {
          create: parsedTags.map(tag => ({ name: tag })),
        },
      },
    });

    return job;
  }

  async getJobById(jobId: string): Promise<Job | null> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { tags: true },
    });

    return job;
  }

  async getAllJobs(): Promise<Job[]> {
    const jobs = await prisma.job.findMany({
      include: { tags: true },
    });

    return jobs;
  }
}