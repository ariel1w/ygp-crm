import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as XLSX from "xlsx";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function parseExcelDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    return new Date(d.y, d.m - 1, d.d);
  }
  const s = String(val).trim();
  // Try DD/MM/YY or DD.MM.YY
  const match = s.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    let year = parseInt(match[3]);
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day);
  }
  return null;
}

const IN_PROGRESS_TAB = "פרויקטים בהתקדמות";

async function main() {
  const wb = XLSX.readFile("C:/Users/ariel/Downloads/Incoming Projects.xlsx");
  let created = 0;

  for (const sheetName of wb.SheetNames) {
    if (sheetName === "גיליון7") continue; // empty sheet
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    const isProgress = sheetName === IN_PROGRESS_TAB;

    for (const row of rows) {
      const projectName = String(
        row["שם הפרויקט"] || ""
      ).trim();
      if (!projectName) continue;

      const senderName = row["שם השולח"] ? String(row["שם השולח"]).trim() : null;
      const dateReceived = parseExcelDate(row["תאריך קבלה"]);
      const ygpContact = row["איש קשר אצלנו"] ? String(row["איש קשר אצלנו"]).trim() : null;
      const senderEmail = row["מייל/טלפון של השולח"] ? String(row["מייל/טלפון של השולח"]).trim() : null;
      const status = row["סטטוס"] ? String(row["סטטוס"]).trim() : null;
      const updatedBy = (row["מי מעדכן"] || row["עמודה 1"]) ? String(row["מי מעדכן"] || row["עמודה 1"]).trim() : null;
      const wasUpdated = (row["האם עודכן"] || row["עמודה 2"]) ? String(row["האם עודכן"] || row["עמודה 2"]).trim() : null;

      await prisma.submission.create({
        data: {
          projectName,
          senderName,
          dateReceived,
          ygpContact,
          senderEmail,
          status,
          updatedBy,
          wasUpdated,
          week: isProgress ? null : sheetName,
          inProgress: isProgress,
        },
      });
      created++;
    }
    console.log(`Imported ${sheetName}: ${rows.length} rows`);
  }

  console.log(`\nTotal imported: ${created}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
