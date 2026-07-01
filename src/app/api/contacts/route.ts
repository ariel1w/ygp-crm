import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const companyType = url.searchParams.get("companyType") || "";
  const project = url.searchParams.get("project") || "";
  const owner = url.searchParams.get("owner") || "";
  const dueSoon = url.searchParams.get("dueSoon") === "true";
  const overdue = url.searchParams.get("overdue") === "true";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { company: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (companyType) where.companyType = companyType;
  if (owner) where.owner = owner;
  if (project) {
    where.projects = { some: { project: { name: project } } };
  }

  if (overdue) {
    where.nextActionDate = { lt: new Date().toISOString() };
  } else if (dueSoon) {
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    where.nextActionDate = {
      gte: new Date().toISOString(),
      lte: in7Days.toISOString(),
    };
  }

  const contacts = await prisma.contact.findMany({
    where,
    include: { projects: { include: { project: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contact = await prisma.contact.create({
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      companyType: body.companyType || null,
      owner: body.owner || null,
      lastContactDate: body.lastContactDate ? new Date(body.lastContactDate) : null,
      lastInteraction: body.lastInteraction || null,
      nextAction: body.nextAction || null,
      nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : null,
    },
  });

  // Link projects if provided
  if (body.projectIds?.length) {
    await prisma.contactProject.createMany({
      data: body.projectIds.map((pid: string) => ({
        contactId: contact.id,
        projectId: pid,
      })),
    });
  }

  return NextResponse.json(contact, { status: 201 });
}
