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
  if ("title" in body) data.title = body.title || "";
  if ("notes" in body) data.notes = body.notes ?? "";
  if ("archived" in body) data.archived = Boolean(body.archived);
  // Any explicit "worked on it" — or saving notes — stamps the activity time.
  if (body.worked || "notes" in body) data.lastWorkedAt = new Date();

  const idea = await prisma.idea.update({ where: { id }, data });
  return NextResponse.json(idea);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Not found" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.idea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
