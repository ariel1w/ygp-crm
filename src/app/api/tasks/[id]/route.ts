import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const ARIEL_EMAIL = "ariel1w@gmail.com";

async function guard() {
  const session = await auth();
  return session?.user?.email?.toLowerCase() === ARIEL_EMAIL;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Not found" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if ("content" in body) data.content = body.content || "";
  if ("category" in body) data.category = body.category || "admin";
  if ("tags" in body) data.tags = typeof body.tags === "string" ? body.tags : "";
  if ("important" in body) data.important = Boolean(body.important);
  // Postpone: an ISO date to hide it until, or null to bring it back now.
  if ("snoozedUntil" in body) {
    data.snoozedUntil = body.snoozedUntil
      ? new Date(body.snoozedUntil)
      : null;
  }
  if ("done" in body) {
    data.done = Boolean(body.done);
    // Stamp/clear the completion time when the done flag flips.
    data.completedAt = body.done ? new Date() : null;
  }

  const task = await prisma.task.update({ where: { id }, data });
  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Not found" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
