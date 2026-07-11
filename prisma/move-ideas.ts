import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.idea.count();
  if (existing > 0) {
    console.log(`Ideas already exist (${existing}). Skipping migration.`);
    return;
  }

  // Move the "ideas" category tasks into the new Idea panel.
  const ideaTasks = await prisma.task.findMany({
    where: { list: "tasks", category: "ideas", done: false },
  });

  for (const t of ideaTasks) {
    await prisma.idea.create({
      data: { title: t.content, lastWorkedAt: t.addedAt },
    });
  }
  await prisma.task.deleteMany({
    where: { id: { in: ideaTasks.map((t) => t.id) } },
  });

  console.log(`Moved ${ideaTasks.length} tasks into Ideas.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
