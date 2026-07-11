import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// keyword found in content -> topic tag to apply. Cross-cutting subjects that
// span more than one category. Ariel refines the rest by hand.
const RULES: { match: string; tag: string }[] = [
  { match: "אות קין", tag: "אות קין" },
  { match: "חצ'קונים", tag: "חצ'קונים" },
  { match: "יואב", tag: "יואב" },
  { match: "ליואב", tag: "יואב" },
  { match: "רועי עידן", tag: "רועי עידן" },
];

async function main() {
  const tasks = await prisma.task.findMany();
  let updated = 0;
  for (const t of tasks) {
    const tags = new Set(
      t.tags.split(",").map((s) => s.trim()).filter(Boolean)
    );
    for (const r of RULES) {
      if (t.content.includes(r.match)) tags.add(r.tag);
    }
    const joined = [...tags].join(", ");
    if (joined !== t.tags) {
      await prisma.task.update({ where: { id: t.id }, data: { tags: joined } });
      updated++;
    }
  }
  console.log(`Tagged ${updated} tasks.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
