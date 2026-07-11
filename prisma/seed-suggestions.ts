import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Candidates from the live calendar scan (solo, self-created, no attendees /
// no Zoom). Real meetings and the Sunday parallel event were filtered out.
const CANDIDATES = [
  { eventId: "6hi6cd1pcor68b9h6hgj2b9k6lijabb1ckr30b9nc5hm2phg65gj8e9m6c", title: "רועי עידן חומרים", startAt: "2026-07-12T10:30:00+03:00", category: "projects" },
  { eventId: "65gjgchoc4o3ib9gcoq68b9k6pj30b9o6cojcbb571i66e3268s3id9m6s", title: "מיתר", startAt: "2026-07-12T14:00:00+03:00", category: "admin" },
  { eventId: "ccrm2c1k6goj2b9gchi38b9k6ph62bb16gomabb56dgj0chj70p34c31cg", title: "אל מונטנאו", startAt: "2026-07-12T14:00:00+03:00", category: "admin" },
  { eventId: "51ur7k1f930t6sji1c4sekb3o0", title: "לכתוב לעומרי בנוגע לאות קין", startAt: "2026-07-12T14:30:00+03:00", category: "projects" },
  { eventId: "30736iq86k9bb25rpb34r4pmb7", title: "קונטקטים אלבין", startAt: "2026-07-12T15:00:00+03:00", category: "contacts" },
  { eventId: "7be3n5tq67isn52l2mtf39coop", title: "לשאול את מוריה על תזכורות לאירוע", startAt: "2026-07-13T10:00:00+03:00", category: "events" },
  { eventId: "1gfopgks6vh0kas5d89l983dtt", title: "לעשות פולו אפ עם סימה שיין", startAt: "2026-07-13T12:30:00+03:00", category: "contacts" },
  { eventId: "6ko32cr365j62b9kc5i30b9kckq3cb9ocoqm6bb46krmccr4c4pm6phj74", title: "Followup Arturo", startAt: "2026-07-13T22:00:00+03:00", category: "contacts" },
];

async function main() {
  let added = 0;
  for (const c of CANDIDATES) {
    // upsert by eventId so re-running never duplicates
    const existing = await prisma.suggestion.findUnique({
      where: { eventId: c.eventId },
    });
    if (existing) continue;
    await prisma.suggestion.create({
      data: {
        eventId: c.eventId,
        title: c.title,
        startAt: new Date(c.startAt),
        category: c.category,
      },
    });
    added++;
  }
  const pending = await prisma.suggestion.count({ where: { status: "pending" } });
  console.log(`Added ${added} suggestions. Pending: ${pending}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
