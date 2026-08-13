import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/** Add someone to a project's pitch list who is not a CRM contact yet. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const pitch = await prisma.pitchTarget.create({
    data: {
      projectId: id,
      name: String(body.name || "").trim(),
      company: body.company?.trim() || null,
      note: body.note?.trim() || "",
    },
  });
  return NextResponse.json(pitch, { status: 201 });
}
