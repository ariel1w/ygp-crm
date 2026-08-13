import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/** Move one person's stage on one project, or leave a note against it. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if ("note" in body) data.note = body.note ?? "";
  if ("status" in body) {
    data.status = body.status;
    data.statusAt = new Date();
    // First time it actually goes out, record the send date.
    const existing = await prisma.contactProject.findUnique({
      where: { id },
      select: { sentDate: true },
    });
    if (body.status !== "topitch" && !existing?.sentDate) {
      data.sentDate = new Date();
    }
  }

  const link = await prisma.contactProject.update({
    where: { id },
    data,
    include: { contact: true },
  });
  return NextResponse.json(link);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.contactProject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
