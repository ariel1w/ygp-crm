import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as XLSX from "xlsx";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const STAGE_MAP: Record<string, string> = {
  "בפיתוח": "development",
  "בהפקה": "production",
  "במכירה": "sales",
  "ריאליטידוקו-ריאליטי": "reality",
  "ספריה": "library",
};

async function main() {
  const wb = XLSX.readFile("C:/Users/ariel/Downloads/Project Management Hebrew.xlsx");
  let total = 0;

  for (const sheetName of wb.SheetNames) {
    if (sheetName === "Sheet6") continue;
    const stage = STAGE_MAP[sheetName];
    if (!stage) {
      console.log(`Skipping unknown tab: ${sheetName}`);
      continue;
    }

    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });

    // Row 9 is headers, data starts at row 10
    for (let i = 10; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r.some((c: string) => c !== "")) continue;

      const name = String(r[0] || "").trim();
      if (!name) continue;

      let data: Record<string, string | null> = { name, stage };

      if (stage === "development") {
        data.creator = r[2] || null;
        data.format = r[3] || null;
        data.episodeLength = r[4] || null;
        data.genre = r[5] || null;
        data.keyPeople = r[6] || null;
        data.broadcaster = r[8] ? String(r[8]) : null;
        data.status = r[10] || null;
      } else if (stage === "production") {
        data.creator = r[2] || null;
        data.format = r[3] || null;
        data.broadcaster = r[4] || null;
        data.shootingDates = r[5] || null;
        data.locations = r[6] || null;
        data.budget = r[8] || null;
        data.status = r[9] || null;
        data.nextStep = r[10] || null;
        data.priority = r[11] || null;
      } else if (stage === "sales") {
        data.broadcaster = r[2] || null;
        data.contact = r[3] || null;
        data.status = r[4] || null;
        data.whereAired = r[5] || null;
        data.distributor = r[6] || null;
        data.nextStep = r[7] || null;
        data.priority = r[8] || null;
      } else if (stage === "reality") {
        data.creator = r[2] || null;
        data.format = r[3] || null;
        data.broadcaster = r[4] || null;
        data.shootingDates = r[5] || null;
        data.locations = r[6] || null;
        data.budget = r[8] || null;
        data.status = r[9] || null;
        data.nextStep = r[10] || null;
        data.priority = r[11] || null;
      } else if (stage === "library") {
        data.creator = r[2] || null;
        data.broadcaster = r[3] || null;
        data.status = r[4] || null;
        data.whereAired = r[5] || null;
        data.distributor = r[6] || null;
        data.nextStep = r[7] || null;
        data.airDate = r[8] || null;
        data.ip = r[9] || null;
      }

      // Clean null-ish values
      for (const k of Object.keys(data)) {
        if (data[k] === "" || data[k] === "0") data[k] = null;
      }
      data.name = name; // never null

      await prisma.slateProject.create({ data: data as any });
      total++;
    }

    console.log(`Imported ${sheetName} (${stage})`);
  }

  console.log(`\nTotal imported: ${total}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
