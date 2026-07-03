import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  const fields = [
    "name", "stage", "creator", "format", "episodeLength", "genre",
    "keyPeople", "broadcaster", "shootingDates", "locations", "budget",
    "status", "nextStep", "priority", "contact", "whereAired",
    "distributor", "airDate", "ip",
  ];
  for (const f of fields) {
    if (f in body) data[f] = body[f] || null;
  }
  // name should never be null
  if ("name" in body) data.name = body.name || "";

  const project = await prisma.slateProject.update({ where: { id }, data });
  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.slateProject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
