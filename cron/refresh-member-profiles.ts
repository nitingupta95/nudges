import { prisma } from "@/lib/prisma";

 

/**
 * Idempotent refresh.
 * Safe to re-run.
 * No external data.
 */
export async function refreshMemberProfiles() {
  const profiles = await prisma.memberProfile.findMany();

  for (const profile of profiles) {
    await prisma.memberProfile.update({
      where: { id: profile.id },
      data: {
        updatedAt: new Date(),
      },
    });
  }
}
