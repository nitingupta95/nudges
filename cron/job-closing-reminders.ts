import { prisma } from "@/lib/prisma";



/**
 * Finds jobs closing within 48 hours.
 * Emits internal analytics event only.
 */
export async function runJobClosingReminders() {
  const cutoff = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const jobs = await prisma.job.findMany({
    where: {
      closingDate: {
        lte: cutoff,
        gte: new Date(),
      },
    },
  });

  for (const job of jobs) {
    // TODO: Implement event tracking
    // await trackEvent("JOB_CLOSING_REMINDER", undefined, {
    //   jobId: job.id,
    //   trigger: "closing_soon",
    // });
    console.log(`Job closing soon: ${job.id} - ${job.title}`);
  }
}
