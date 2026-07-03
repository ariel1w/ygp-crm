import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const inProgress = await prisma.submission.findMany({ where: { inProgress: true } });

  for (const ip of inProgress) {
    // Find exact name match in weekly tabs
    const weeklyMatch = await prisma.submission.findFirst({
      where: {
        inProgress: false,
        projectName: ip.projectName,
      },
    });

    if (weeklyMatch) {
      // Sync: make weekly entry match in-progress entry for sender and date
      const updates: Record<string, unknown> = {};
      if (weeklyMatch.senderName !== ip.senderName) updates.senderName = ip.senderName;
      if (weeklyMatch.dateReceived?.toISOString() !== ip.dateReceived?.toISOString()) updates.dateReceived = ip.dateReceived;

      if (Object.keys(updates).length > 0) {
        await prisma.submission.update({ where: { id: weeklyMatch.id }, data: updates });
        console.log(`Synced "${ip.projectName}":`, updates);
      }
    }
  }

  console.log("Done");
}

main().then(() => prisma.$disconnect());
