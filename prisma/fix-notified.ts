import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const updated1 = await prisma.submission.updateMany({
    where: { wasUpdated: "כן" },
    data: { wasUpdated: "Yes" },
  });
  console.log(`כן -> Yes: ${updated1.count}`);

  const updated2 = await prisma.submission.updateMany({
    where: { wasUpdated: "עודכן" },
    data: { wasUpdated: "Yes" },
  });
  console.log(`עודכן -> Yes: ${updated2.count}`);

  const updated3 = await prisma.submission.updateMany({
    where: { wasUpdated: "לא" },
    data: { wasUpdated: "No" },
  });
  console.log(`לא -> No: ${updated3.count}`);

  // Also fix with trailing spaces
  const updated4 = await prisma.submission.updateMany({
    where: { wasUpdated: "לא " },
    data: { wasUpdated: "No" },
  });
  console.log(`לא (space) -> No: ${updated4.count}`);
}

main().then(() => prisma.$disconnect());
