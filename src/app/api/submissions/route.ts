import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const submissions = await prisma.submission.findMany({
    orderBy: { dateReceived: "desc" },
  });
  return NextResponse.json(submissions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const submission = await prisma.submission.create({
    data: {
      projectName: body.projectName,
      senderName: body.senderName || null,
      dateReceived: body.dateReceived ? new Date(body.dateReceived) : new Date(),
      ygpContact: body.ygpContact || null,
      senderEmail: body.senderEmail || null,
      status: body.status || null,
      updatedBy: body.updatedBy || null,
      wasUpdated: body.wasUpdated || null,
      week: body.week || null,
      inProgress: body.inProgress || false,
    },
  });
  return NextResponse.json(submission, { status: 201 });
}
