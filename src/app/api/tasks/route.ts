import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const ARIEL_EMAIL = "ariel1w@gmail.com";

// Defense-in-depth: the proxy already blocks non-Ariel, but the API re-checks too.
async function guard() {
  const session = await auth();
  return session?.user?.email?.toLowerCase() === ARIEL_EMAIL;
}

export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "Not found" }, { status: 403 });
  }
  const tasks = await prisma.task.findMany({
    orderBy: [{ important: "desc" }, { addedAt: "asc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Not found" }, { status: 403 });
  }
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      content: body.content ?? "",
      list: body.list === "yoav" ? "yoav" : "tasks",
      category: body.category ?? "admin",
      tags: typeof body.tags === "string" ? body.tags : "",
      important: Boolean(body.important),
      source: body.source ?? "manual",
    },
  });
  return NextResponse.json(task, { status: 201 });
}
