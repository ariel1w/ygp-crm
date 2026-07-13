import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { parseIcs } from "@/lib/calendar-scan";
import { NextRequest, NextResponse } from "next/server";

const ARIEL_EMAIL = "ariel1w@gmail.com";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Runs from Vercel Cron (Authorization: Bearer $CRON_SECRET) each morning,
// or on demand when Ariel clicks "Scan now".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isCron = !!secret && authHeader === `Bearer ${secret}`;

  if (!isCron) {
    const session = await auth();
    if (session?.user?.email?.toLowerCase() !== ARIEL_EMAIL) {
      return NextResponse.json({ error: "Not found" }, { status: 403 });
    }
  }

  const icsUrl = process.env.CALENDAR_ICS_URL;
  if (!icsUrl) {
    return NextResponse.json(
      { error: "CALENDAR_ICS_URL is not set" },
      { status: 500 }
    );
  }

  const res = await fetch(icsUrl, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Calendar feed failed: ${res.status}` },
      { status: 502 }
    );
  }
  const ics = await res.text();
  const { candidates, yoavTopics } = parseIcs(ics);

  // --- Task suggestions: only event IDs we've never recorded before ---
  let addedSuggestions = 0;
  for (const c of candidates) {
    const seen = await prisma.suggestion.findUnique({
      where: { eventId: c.eventId },
    });
    if (seen) continue; // pending, added or dismissed — never re-suggest

    // Don't suggest something already in the task list — open OR already done.
    const dupe = await prisma.task.findFirst({
      where: { list: "tasks", content: c.title },
    });
    if (dupe) continue;

    await prisma.suggestion.create({
      data: {
        eventId: c.eventId,
        title: c.title,
        startAt: c.startAt,
        category: c.category,
      },
    });
    addedSuggestions++;
  }

  // --- Yoav tab: topics from the מחסנית, added only if not already there ---
  let addedYoav = 0;
  for (const topic of yoavTopics) {
    const exists = await prisma.task.findFirst({
      where: { list: "yoav", content: topic },
    });
    if (exists) continue; // already listed (or already covered) — leave alone
    await prisma.task.create({
      data: { content: topic, list: "yoav", source: "calendar" },
    });
    addedYoav++;
  }

  return NextResponse.json({
    ok: true,
    scanned: candidates.length,
    addedSuggestions,
    yoavTopics: yoavTopics.length,
    addedYoav,
  });
}
