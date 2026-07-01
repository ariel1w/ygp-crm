import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_PROJECTS } from "../src/lib/seed-projects";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const name of DEFAULT_PROJECTS) {
    await prisma.project.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Seeded default projects:", DEFAULT_PROJECTS);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
