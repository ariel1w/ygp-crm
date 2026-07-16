import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if ("projectName" in body) data.projectName = body.projectName || "";
  if ("senderName" in body) data.senderName = body.senderName || null;
  if ("dateReceived" in body)
    data.dateReceived = body.dateReceived ? new Date(body.dateReceived) : null;
  if ("ygpContact" in body) data.ygpContact = body.ygpContact || null;
  if ("senderEmail" in body) data.senderEmail = body.senderEmail || null;
  if ("status" in body) data.status = body.status || null;
  if ("updatedBy" in body) data.updatedBy = body.updatedBy || null;
  if ("wasUpdated" in body) data.wasUpdated = body.wasUpdated || null;
  if ("inProgress" in body) data.inProgress = body.inProgress;
  if ("notes" in body) data.notes = body.notes || "";

  const submission = await prisma.submission.update({ where: { id }, data });
  return NextResponse.json(submission);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.submission.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
