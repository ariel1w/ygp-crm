import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const note = await prisma.note.create({
    data: {
      contactId: id,
      author: body.author,
      content: body.content,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });

  // Update contact's last interaction info
  await prisma.contact.update({
    where: { id },
    data: {
      lastContactDate: note.date,
      lastInteraction: body.content,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
