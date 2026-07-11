import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const ARIEL_EMAIL = "ariel1w@gmail.com";

async function guard() {
  const session = await auth();
  return session?.user?.email?.toLowerCase() === ARIEL_EMAIL;
}

// PATCH { action: "add" | "dismiss" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Not found" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const suggestion = await prisma.suggestion.findUnique({ where: { id } });
  if (!suggestion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.action === "add") {
    const task = await prisma.task.create({
      data: {
        content: suggestion.title,
        category: suggestion.category,
        source: "calendar",
      },
    });
    await prisma.suggestion.update({
      where: { id },
      data: { status: "added" },
    });
    return NextResponse.json({ ok: true, task });
  }

  if (body.action === "dismiss") {
    await prisma.suggestion.update({
      where: { id },
      data: { status: "dismissed" },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Bad action" }, { status: 400 });
}
