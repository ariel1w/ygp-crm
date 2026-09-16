import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { STAGES } from "@/lib/slate-constants";

// Fields the move window may fill in on the new Central Project List row.
const FIELDS = [
  "creator",
  "format",
  "episodeLength",
  "genre",
  "keyPeople",
  "broadcaster",
  "shootingDates",
  "locations",
  "budget",
  "status",
  "nextStep",
  "priority",
  "contact",
  "whereAired",
  "distributor",
  "airDate",
  "ip",
] as const;

// Moves a reading-list submission into the Central Project List: creates the
// new row at the top of its stage and deletes the submission, as one unit.
// Apart from the list's own Add button this is the only thing that inserts
// into the Central Project List, and it only runs when a user presses Move
// in the dialog and confirms.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }
  const stage = STAGES.some((s) => s.key === body.stage) ? body.stage : "development";

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const existing = await prisma.slateProject.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, name: true, stage: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: `"${existing.name}" is already in the Central Project List`, existing },
      { status: 409 }
    );
  }

  const data: Record<string, string | null> = {};
  for (const f of FIELDS) {
    const v = body[f];
    data[f] = typeof v === "string" && v.trim() ? v.trim() : null;
  }

  const project = await prisma.$transaction(async (tx) => {
    // New rows sit at the top of their stage, same as the list's own Add.
    const top = await tx.slateProject.aggregate({
      where: { stage },
      _min: { sortOrder: true },
    });
    const sortOrder = (top._min.sortOrder ?? 1) - 1;
    const created = await tx.slateProject.create({
      data: { name, stage, sortOrder, ...data },
    });
    await tx.submission.delete({ where: { id } });
    return created;
  });

  return NextResponse.json(project, { status: 201 });
}
