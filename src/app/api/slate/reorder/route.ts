import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Saves a manual order for one stage. Body: { stage, ids: [...] }
// `ids` is the full list of that stage's projects, top to bottom.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const stage: unknown = body.stage;
  const ids: unknown = body.ids;

  if (typeof stage !== "string" || !stage) {
    return NextResponse.json({ error: "stage is required" }, { status: 400 });
  }
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json(
      { error: "ids must be an array of project ids" },
      { status: 400 }
    );
  }

  // Only reorder projects that really are in this stage, so a stale tab
  // cannot drag a project out of a stage it no longer belongs to.
  const existing = await prisma.slateProject.findMany({
    where: { stage, id: { in: ids as string[] } },
    select: { id: true },
  });
  const valid = new Set(existing.map((p) => p.id));
  const ordered = (ids as string[]).filter((id) => valid.has(id));

  await prisma.$transaction(
    ordered.map((id, index) =>
      prisma.slateProject.update({
        where: { id },
        data: { sortOrder: index + 1 },
      })
    )
  );

  const projects = await prisma.slateProject.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(projects);
}
