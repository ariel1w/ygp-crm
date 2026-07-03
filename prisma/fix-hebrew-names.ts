import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const NAME_MAP: Record<string, string> = {
  "שני": "Shani",
  "שני ": "Shani",
  "אריאל": "Ariel",
  "יואב": "Yoav",
  "יואב ואושר": "Yoav",
  "מעין": "Maayan",
  "מעיין": "Maayan",
  "אושר": "Osher",
  "נטשה": "Natasha",
  "עדי": "Adi",
};

async function main() {
  const submissions = await prisma.submission.findMany();
  let updated = 0;

  for (const s of submissions) {
    const patch: Record<string, string> = {};

    if (s.ygpContact) {
      const mapped = NAME_MAP[s.ygpContact.trim()];
      if (mapped) patch.ygpContact = mapped;
    }

    if (s.updatedBy) {
      const mapped = NAME_MAP[s.updatedBy.trim()];
      if (mapped) patch.updatedBy = mapped;
    }

    if (Object.keys(patch).length > 0) {
      await prisma.submission.update({ where: { id: s.id }, data: patch });
      console.log(`${s.projectName}: ${JSON.stringify(patch)}`);
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} submissions`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
