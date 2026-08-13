import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Bring a contact's project links in line with `projectIds` by adding and
 * removing only what changed. Untouched links keep their createdAt, which is
 * the date the project was sent, so the projects pages can order by it.
 */
async function syncProjects(contactId: string, projectIds: string[]) {
  const current = await prisma.contactProject.findMany({
    where: { contactId },
    select: { projectId: true },
  });
  const have = current.map((c) => c.projectId);
  const want = projectIds ?? [];

  const removed = have.filter((p) => !want.includes(p));
  const added = want.filter((p) => !have.includes(p));

  if (removed.length) {
    await prisma.contactProject.deleteMany({
      where: { contactId, projectId: { in: removed } },
    });
  }
  if (added.length) {
    await prisma.contactProject.createMany({
      data: added.map((projectId) => ({ contactId, projectId })),
      skipDuplicates: true,
    });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      projects: { include: { project: true } },
      notes: { orderBy: { date: "desc" } },
    },
  });
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const contact = await prisma.contact.update({
    where: { id },
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

  if (body.projectIds !== undefined) {
    await syncProjects(id, body.projectIds);
  }

  return NextResponse.json(contact);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if ("lastAction" in body) data.lastAction = body.lastAction || null;
  if ("nextAction" in body) data.nextAction = body.nextAction || null;
  if ("nextActionDate" in body)
    data.nextActionDate = body.nextActionDate ? new Date(body.nextActionDate) : null;
  if ("owner" in body) data.owner = body.owner || null;
  if ("lastContactBy" in body) data.lastContactBy = body.lastContactBy || null;
  if ("company" in body) data.company = body.company || null;
  if ("companyType" in body) data.companyType = body.companyType || null;
  if ("lastContactDate" in body)
    data.lastContactDate = body.lastContactDate ? new Date(body.lastContactDate) : null;
  if ("lastInteraction" in body) data.lastInteraction = body.lastInteraction || null;

  const contact = await prisma.contact.update({ where: { id }, data });

  if ("projectIds" in body) {
    await syncProjects(id, body.projectIds ?? []);
  }

  // Return full contact with projects
  const full = await prisma.contact.findUnique({
    where: { id },
    include: { projects: { include: { project: true } } },
  });
  return NextResponse.json(full);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
