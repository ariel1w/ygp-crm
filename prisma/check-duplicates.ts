import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Get all in-progress projects
  const inProgress = await prisma.submission.findMany({
    where: { inProgress: true },
    select: { id: true, projectName: true, senderName: true, dateReceived: true, status: true },
  });

  console.log("Checking each in-progress project against weekly submissions:\n");

  for (const ip of inProgress) {
    // Find matching submissions in weekly tabs
    const matches = await prisma.submission.findMany({
      where: {
        inProgress: false,
        projectName: { contains: ip.projectName.substring(0, 5) },
      },
      select: { id: true, projectName: true, senderName: true, dateReceived: true, week: true, status: true },
    });

    if (matches.length > 0) {
      console.log(`IN PROGRESS: "${ip.projectName}" | ${ip.senderName} | ${ip.dateReceived?.toISOString().split("T")[0] || "no date"}`);
      for (const m of matches) {
        const nameSame = m.projectName === ip.projectName ? "OK" : "DIFF";
        const senderSame = m.senderName === ip.senderName ? "OK" : "DIFF";
        const dateSame = m.dateReceived?.toISOString().split("T")[0] === ip.dateReceived?.toISOString().split("T")[0] ? "OK" : "DIFF";
        console.log(`  WEEKLY: "${m.projectName}" [name:${nameSame}] | ${m.senderName} [sender:${senderSame}] | ${m.dateReceived?.toISOString().split("T")[0] || "no date"} [date:${dateSame}] | week: ${m.week}`);
      }
      console.log();
    } else {
      console.log(`IN PROGRESS: "${ip.projectName}" — NO MATCH in weekly tabs\n`);
    }
  }
}

main().then(() => prisma.$disconnect());
