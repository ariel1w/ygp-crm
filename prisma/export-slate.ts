import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as XLSX from "xlsx";
import { STAGES, STAGE_COLUMNS } from "../src/lib/slate-constants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const OUT = process.argv[2] || "C:/Users/ariel/Downloads/YGP Project List.xlsx";

async function main() {
  const projects = await prisma.slateProject.findMany({
    orderBy: [{ stage: "asc" }, { sortOrder: "asc" }],
  });

  const wb = XLSX.utils.book_new();
  let total = 0;

  for (const stage of STAGES) {
    const columns = STAGE_COLUMNS[stage.key];
    const rows = projects.filter((p) => p.stage === stage.key);
    total += rows.length;

    const aoa = [
      columns.map((c) => c.label),
      ...rows.map((p) =>
        columns.map((c) => (p as unknown as Record<string, unknown>)[c.key] ?? "")
      ),
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Hebrew content: read the sheet right-to-left.
    ws["!views"] = [{ RTL: true }];
    ws["!cols"] = columns.map((c) => ({
      wch: Math.min(
        40,
        Math.max(c.label.length + 2, ...rows.map((p) => String((p as unknown as Record<string, unknown>)[c.key] ?? "").length + 2))
      ),
    }));
    ws["!freeze"] = "A2";

    // Excel forbids : \ / ? * [ ] in tab names (e.g. "ריאליטי/דוקו").
    const tabName = stage.labelHe.replace(/[:\\/?*[\]]/g, "-").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, tabName);
    console.log(`${stage.labelHe}: ${rows.length} projects`);
  }

  XLSX.writeFile(wb, OUT);
  console.log(`\nWrote ${total} projects to ${OUT}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
