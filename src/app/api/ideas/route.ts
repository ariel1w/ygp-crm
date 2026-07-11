import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const ARIEL_EMAIL = "ariel1w@gmail.com";

async function guard() {
  const session = await auth();
  return session?.user?.email?.toLowerCase() === ARIEL_EMAIL;
}

export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "Not found" }, { status: 403 });
  }
  // Stalest first — the ones you haven't touched in a while float to the top.
  const ideas = await prisma.idea.findMany({
    orderBy: { lastWorkedAt: "asc" },
  });
  return NextResponse.json(ideas);
}

export async function POST(req: NextRequest) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Not found" }, { status: 403 });
  }
  const body = await req.json();
  const idea = await prisma.idea.create({
    data: {
      title: body.title ?? "",
      notes: body.notes ?? "",
    },
  });
  return NextResponse.json(idea, { status: 201 });
}
