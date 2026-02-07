import { prisma } from '../lib/prisma';
import { JobStatus } from '@prisma/client';

const JOB_CLOSING_SOON_THRESHOLD = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

async function checkClosingJobs() {
    const now = new Date();
    const closingSoon = new Date(now.getTime() + JOB_CLOSING_SOON_THRESHOLD);

    // Fetch jobs that are closing soon
    const jobs = await prisma.job.findMany({
        where: {
            closingDate: {
                gte: now,
                lte: closingSoon,
            },
            status: JobStatus.ACTIVE,
        },
        include: {
            views: true, // Assuming there's a relation to track views
        },
    });

    for (const job of jobs) {
        const viewedMembers = job.views.map(view => view.memberId); // Assuming views have memberId

        // Logic to emit internal event for members who viewed but did not refer
        for (const memberId of viewedMembers) {
            const referralExists = await prisma.referral.findFirst({
                where: {
                    jobId: job.id,
                    memberId: memberId,
                },
            });

            if (!referralExists) {
                // Emit internal event (this could be a function call or logging)
                console.log(`Member ${memberId} viewed job ${job.id} but did not refer.`);
                // Here you can call a function to log this event
            }
        }
    }
}

// Export the function to be called by a cron job or similar mechanism
export default checkClosingJobs;