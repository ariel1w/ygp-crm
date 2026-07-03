import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const inProgress = await prisma.submission.findMany({ where: { inProgress: true } });

  let merged = 0;
  for (const ip of inProgress) {
    // Find matching weekly entry
    const weeklyMatch = await prisma.submission.findFirst({
      where: {
        inProgress: false,
        projectName: ip.projectName,
      },
    });

    if (weeklyMatch) {
      // Merge: update the weekly entry to also be in progress, keep the in-progress status
      await prisma.submission.update({
        where: { id: weeklyMatch.id },
        data: {
          inProgress: true,
          // Keep the in-progress status (more up to date)
          status: ip.status || weeklyMatch.status,
          // Keep the in-progress YGP contact if set
          ygpContact: ip.ygpContact || weeklyMatch.ygpContact,
        },
      });

      // Delete the separate in-progress record
      await prisma.submission.delete({ where: { id: ip.id } });

      console.log(`Merged "${ip.projectName}" — kept weekly (${weeklyMatch.week}), deleted in-progress duplicate`);
      merged++;
    } else {
      // No weekly match — this in-progress entry is standalone, give it a week based on date
      console.log(`No weekly match for "${ip.projectName}" — keeping as-is`);
    }
  }

  console.log(`\nMerged ${merged} duplicates`);

  // Verify
  const remaining = await prisma.submission.findMany({ where: { inProgress: true } });
  console.log(`In Progress now: ${remaining.length} projects`);
  for (const r of remaining) {
    console.log(`  - ${r.projectName} | week: ${r.week || "none"}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); });
