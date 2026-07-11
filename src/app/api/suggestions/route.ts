import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ARIEL_EMAIL = "ariel1w@gmail.com";

async function guard() {
  const session = await auth();
  return session?.user?.email?.toLowerCase() === ARIEL_EMAIL;
}

export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "Not found" }, { status: 403 });
  }
  const suggestions = await prisma.suggestion.findMany({
    where: { status: "pending" },
    orderBy: { startAt: "asc" },
  });
  return NextResponse.json(suggestions);
}
