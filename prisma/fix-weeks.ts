import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateWeeks } from "../src/lib/weeks";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const allWeeks = generateWeeks(2026, 2027);
  const subs = await prisma.submission.findMany({
    where: { inProgress: false, dateReceived: { not: null } },
  });

  let fixed = 0;
  for (const s of subs) {
    if (!s.dateReceived) continue;
    const d = new Date(s.dateReceived);

    // Find which week this date actually falls in
    const correctWeek = allWeeks.find((w) => d >= w.start && d <= w.end);
    if (correctWeek && correctWeek.key !== s.week) {
      await prisma.submission.update({
        where: { id: s.id },
        data: { week: correctWeek.key },
      });
      console.log(`${s.projectName}: ${s.week} -> ${correctWeek.key} (${correctWeek.label}) [date: ${d.toISOString().split("T")[0]}]`);
      fixed++;
    }
  }

  console.log(`\nFixed ${fixed} submissions`);

  // Show final distribution
  const updated = await prisma.submission.findMany({ where: { inProgress: false }, select: { week: true } });
  const counts = new Map<string, number>();
  for (const s of updated) {
    counts.set(s.week || "none", (counts.get(s.week || "none") || 0) + 1);
  }
  console.log("\nFinal week distribution:");
  for (const [week, count] of Array.from(counts.entries()).sort()) {
    const w = allWeeks.find((w) => w.key === week);
    console.log(`${week} (${w?.label || "?"}): ${count}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); });
