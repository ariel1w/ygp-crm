import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const contacts = await prisma.contact.findMany({
    where: { nextAction: { not: null } },
    select: { id: true, name: true, nextAction: true },
  });
  console.log("Contacts with nextAction to move:", contacts.length);

  for (const c of contacts) {
    await prisma.contact.update({
      where: { id: c.id },
      data: { lastAction: c.nextAction, nextAction: null },
    });
  }

  const check = await prisma.contact.count({ where: { lastAction: { not: null } } });
  console.log("Contacts with lastAction now:", check);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); });
