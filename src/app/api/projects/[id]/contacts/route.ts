import { prisma } from "@/lib/prisma";
import { DEFAULT_STATUS } from "@/lib/project-status";
import { NextRequest, NextResponse } from "next/server";

/** Put an existing contact on this project, at whatever stage it is at. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const status: string = body.status || DEFAULT_STATUS;

  const link = await prisma.contactProject.upsert({
    where: {
      contactId_projectId: { contactId: body.contactId, projectId: id },
    },
    create: {
      contactId: body.contactId,
      projectId: id,
      status,
      statusAt: new Date(),
      sentDate: status === "topitch" ? null : new Date(),
    },
    // Already on the project: leave the history alone, just move the stage.
    update: { status, statusAt: new Date() },
    include: { contact: true },
  });

  return NextResponse.json(link, { status: 201 });
}
