import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const all = await prisma.submission.findMany({
    select: { id: true, projectName: true, week: true, inProgress: true },
  });

  // Find ones with no week
  const noWeek = all.filter(s => !s.week);
  console.log("No week assigned:", noWeek.length);
  for (const s of noWeek) {
    console.log(`  "${s.projectName}" inProgress:${s.inProgress}`);
  }

  // Find שהידלה
  const match = all.filter(s => s.projectName.includes("שהיד"));
  console.log("\nשהידלה matches:", match.length);
  for (const s of match) {
    console.log(`  "${s.projectName}" week:${s.week} inProgress:${s.inProgress}`);
  }

  // Find all in progress
  const ip = all.filter(s => s.inProgress);
  console.log("\nAll in progress:", ip.length);
  for (const s of ip) {
    console.log(`  "${s.projectName}" week:${s.week}`);
  }
}

main().then(() => prisma.$disconnect());
