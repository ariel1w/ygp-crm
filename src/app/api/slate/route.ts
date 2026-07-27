import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const projects = await prisma.slateProject.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const stage = body.stage || "development";

  // New projects appear at the top of their stage, matching the UI.
  const top = await prisma.slateProject.aggregate({
    where: { stage },
    _min: { sortOrder: true },
  });
  const sortOrder = (top._min.sortOrder ?? 1) - 1;

  const project = await prisma.slateProject.create({
    data: {
      name: body.name || "",
      stage,
      sortOrder,
      creator: body.creator || null,
      format: body.format || null,
      episodeLength: body.episodeLength || null,
      genre: body.genre || null,
      keyPeople: body.keyPeople || null,
      broadcaster: body.broadcaster || null,
      shootingDates: body.shootingDates || null,
      locations: body.locations || null,
      budget: body.budget || null,
      status: body.status || null,
      nextStep: body.nextStep || null,
      priority: body.priority || null,
      contact: body.contact || null,
      whereAired: body.whereAired || null,
      distributor: body.distributor || null,
      airDate: body.airDate || null,
      ip: body.ip || null,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
