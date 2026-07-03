import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateWeeks } from "../src/lib/weeks";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const subs = await prisma.submission.findMany({
    select: { projectName: true, week: true, dateReceived: true, inProgress: true },
    orderBy: { dateReceived: "asc" },
  });

  console.log("=== All submissions with weeks ===");
  const weekCounts = new Map<string, number>();
  for (const s of subs) {
    if (s.inProgress) continue;
    const key = s.week || "NO_WEEK";
    weekCounts.set(key, (weekCounts.get(key) || 0) + 1);
  }
  for (const [week, count] of Array.from(weekCounts.entries()).sort()) {
    console.log(`${week}: ${count} submissions`);
  }

  console.log("\n=== Week labels ===");
  const allWeeks = generateWeeks(2026, 2027);
  const usedWeeks = new Set(subs.map(s => s.week).filter(Boolean));
  for (const key of usedWeeks) {
    const w = allWeeks.find(w => w.key === key);
    console.log(`${key} -> ${w ? w.label + " (month " + w.month + ")" : "NOT FOUND"}`);
  }

  console.log("\n=== Sample submissions ===");
  for (const s of subs.filter(s => !s.inProgress).slice(0, 20)) {
    console.log(`${s.week} | ${s.dateReceived?.toISOString().split("T")[0]} | ${s.projectName}`);
  }
}

main().then(() => prisma.$disconnect());
