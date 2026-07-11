import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// The list was created on 7.7 — everything is dated to that day.
const ADDED = new Date("2026-07-07T09:00:00.000Z");

// category best-guess — Ariel will correct on the live site.
const OPEN: { content: string; category: string }[] = [
  { content: "פיצ'ים האהיל", category: "projects" },
  { content: "נהד", category: "admin" },
  { content: "חצ'קונים זכויות", category: "admin" },
  { content: "אות קין למרטין ולעדכן את שני על זה", category: "projects" },
  { content: "מרים חברות ודק חברה", category: "contacts" },
  { content: "קונקטים אלבין", category: "contacts" },
  { content: "לבדוק אם צריך לקרוא מטכליסטים", category: "admin" },
  { content: "יום שני אוטו - לדבר איתו (הסוכן) ועם ג'ף", category: "admin" },
  { content: "לוז ספיד דייטינג", category: "events" },
  { content: "לקרוא פרוייקטים", category: "projects" },
  { content: "לקרוא פרויקטים ישנים מהמייל", category: "projects" },
  { content: "המשך תיאום מיוצגים אילן", category: "clients" },
  { content: "מיוצגים גאני", category: "clients" },
  { content: "ג'יי כהן - רוזן בר", category: "contacts" },
  { content: "לעדכן את יואב על ג'ים", category: "admin" },
  { content: "לתאם אדם ביזנסקי", category: "contacts" },
  { content: "דה בוקס", category: "admin" },
  { content: "לעבוד על אות קין להגשה ולבדןק מתי עומרי חוזר", category: "projects" },
  { content: "חברות אנגליה איכות טובה", category: "contacts" },
  { content: "דוקו דרמה בריינסטורם", category: "ideas" },
  { content: "מת'יו וויינר", category: "contacts" },
  { content: "צמוד מסיבה - קיסר", category: "events" },
  { content: "טיק קטן דן מסר", category: "admin" },
  { content: "הרעיון של רועי עידן על VR", category: "ideas" },
];

const DONE: { content: string; category: string }[] = [
  { content: "אסתר אגרצו", category: "contacts" },
  { content: "אופיר ראול ומשה רוזנטל לפרוייקט נועם חורב", category: "projects" },
  { content: "להקפיץ ליואב פורמט מהצ'ט", category: "admin" },
  { content: "לשים ביומן פולו אפ ארתורו פלוס לעדכן את שני", category: "admin" },
  { content: "רוברט פראנק", category: "contacts" },
  { content: "מחר בבוקר דארן", category: "admin" },
  { content: "לבקש משני לתאם עם ג'קי", category: "admin" },
  { content: "לשים פולו אפ יבלונקה", category: "admin" },
  { content: "מי זה ליאור סורוקה.. יש לי תזכורת עליו", category: "contacts" },
  { content: "מתי נינה", category: "admin" },
  { content: "לבדוק עם מעיין ביפרים - הודעה גורלית", category: "admin" },
  { content: "תיאום טובת הילד", category: "admin" },
  { content: "שני לשלוח מייל מסודר לחברה על הcrm", category: "admin" },
];

async function main() {
  const existing = await prisma.task.count();
  if (existing > 0) {
    console.log(`Tasks already seeded (${existing} rows). Skipping.`);
    return;
  }

  await prisma.task.createMany({
    data: [
      ...OPEN.map((t) => ({
        content: t.content,
        category: t.category,
        addedAt: ADDED,
        createdAt: ADDED,
        done: false,
      })),
      ...DONE.map((t) => ({
        content: t.content,
        category: t.category,
        addedAt: ADDED,
        createdAt: ADDED,
        done: true,
        completedAt: ADDED,
      })),
    ],
  });

  const count = await prisma.task.count();
  console.log(`Seeded tasks. Total rows: ${count} (${OPEN.length} open, ${DONE.length} done).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
