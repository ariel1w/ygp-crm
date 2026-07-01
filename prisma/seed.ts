import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { DEFAULT_PROJECTS } from "../src/lib/seed-projects";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: "file:" + dbPath });
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
