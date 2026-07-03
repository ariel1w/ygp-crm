import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const inProgress = await prisma.submission.findMany({
    where: { inProgress: true },
    select: { projectName: true, senderName: true, status: true },
  });

  console.log(`In Progress: ${inProgress.length} projects\n`);
  for (const s of inProgress) {
    console.log(`- ${s.projectName} (${s.senderName || "?"}) — ${s.status || "no status"}`);
  }
}

main().then(() => prisma.$disconnect());
