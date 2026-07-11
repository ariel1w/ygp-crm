import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Parsed from the parallel Sunday-meeting event in Ariel's calendar (7.12).
const ADDED = new Date("2026-07-09T09:00:00.000Z");

const YOAV_ITEMS = [
  "טובת הילד - לא יסעו לברלין",
  "פולוול חברים",
  "ג'ים אמיליו",
  "jv",
  "דה בוקס",
  "מקלט",
  "המשפחה",
];

async function main() {
  const existing = await prisma.task.count({ where: { list: "yoav" } });
  if (existing > 0) {
    console.log(`Yoav list already seeded (${existing} rows). Skipping.`);
    return;
  }

  await prisma.task.createMany({
    data: YOAV_ITEMS.map((content) => ({
      content,
      list: "yoav",
      category: "admin",
      addedAt: ADDED,
      createdAt: ADDED,
      done: false,
    })),
  });

  const count = await prisma.task.count({ where: { list: "yoav" } });
  console.log(`Seeded Yoav list. Rows: ${count}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
