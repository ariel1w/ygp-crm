import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // "It went out": the target becomes a real contact on the project, at the
  // stage given, and stops being a pitch-list line.
  if (body.action === "send") {
    const target = await prisma.pitchTarget.findUnique({ where: { id } });
    if (!target)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const contact = await prisma.contact.create({
      data: { name: target.name, company: target.company },
    });
    const link = await prisma.contactProject.create({
      data: {
        contactId: contact.id,
        projectId: target.projectId,
        status: body.status || "sent",
        statusAt: new Date(),
        sentDate: new Date(),
        note: target.note,
      },
      include: { contact: true },
    });
    await prisma.pitchTarget.delete({ where: { id } });
    return NextResponse.json({ link, contact });
  }

  const data: Record<string, unknown> = {};
  if ("name" in body) data.name = String(body.name || "").trim();
  if ("company" in body) data.company = body.company?.trim() || null;
  if ("note" in body) data.note = body.note?.trim() || "";

  const pitch = await prisma.pitchTarget.update({ where: { id }, data });
  return NextResponse.json(pitch);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.pitchTarget.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
