import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateWeeks, matchOldWeekToKey } from "../src/lib/weeks";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const allWeeks = generateWeeks(2026, 2027);
  const submissions = await prisma.submission.findMany({
    where: { week: { not: null } },
  });

  let updated = 0;
  for (const s of submissions) {
    if (!s.week) continue;
    const newKey = matchOldWeekToKey(s.week, allWeeks);
    if (newKey && newKey !== s.week) {
      await prisma.submission.update({
        where: { id: s.id },
        data: { week: newKey },
      });
      console.log(`${s.week} -> ${newKey} (${s.projectName})`);
      updated++;
    } else if (!newKey) {
      console.log(`Could not match: "${s.week}" (${s.projectName})`);
    }
  }
  console.log(`Updated ${updated} submissions`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
