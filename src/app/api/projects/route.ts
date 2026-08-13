import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { contacts: true, pitches: true } },
      contacts: { select: { status: true, statusAt: true } },
    },
    orderBy: { name: "asc" },
  });

  // Summarise each project so the list can lead with what is actually moving.
  return NextResponse.json(
    projects.map((p) => {
      const counts: Record<string, number> = {};
      for (const c of p.contacts) counts[c.status] = (counts[c.status] ?? 0) + 1;
      const lastActivity = p.contacts.reduce<Date | null>(
        (max, c) => (!max || c.statusAt > max ? c.statusAt : max),
        null
      );
      return {
        id: p.id,
        name: p.name,
        counts,
        pitchCount: p._count.pitches,
        contactCount: p._count.contacts,
        lastActivity,
      };
    })
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = await prisma.project.create({
    data: { name: body.name },
  });
  return NextResponse.json(project, { status: 201 });
}
