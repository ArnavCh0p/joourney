// API route for Session records.
// POST /api/sessions  — log a new play session for a shelf entry
// GET  /api/sessions?shelfEntryId=<id>  — list sessions for a shelf entry

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Resolve the caller's internal User row from the NextAuth session.
// Returns null if the user is unauthenticated or not found in the DB.
async function resolveUser() {
  const session = await getServerSession(authOptions);
  const steamId = (session?.user as { steamId?: string })?.steamId;
  if (!steamId) return null;
  return prisma.user.findUnique({ where: { steamId } });
}

export async function POST(req: NextRequest) {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { shelfEntryId?: string; date?: string; notes?: string; durationMinutes?: number; runId?: string | null; music?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { shelfEntryId, date, notes, durationMinutes, runId, music } = body;

  if (!shelfEntryId || !date) {
    return NextResponse.json(
      { error: "shelfEntryId and date are required" },
      { status: 400 }
    );
  }

  // Confirm the shelf entry exists and belongs to this user.
  const entry = await prisma.shelfEntry.findUnique({
    where: { id: shelfEntryId },
    select: { userId: true },
  });

  if (!entry || entry.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Parse the date string as UTC midnight so time zones don't shift the day.
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  if (notes !== undefined && notes.length > 50_000)
    return NextResponse.json({ error: "Notes too long" }, { status: 400 });

  // Validate runId if provided
  if (runId) {
    const runRows = await prisma.$queryRaw<{ userId: string; shelfEntryId: string }[]>`
      SELECT "userId", "shelfEntryId" FROM "Run" WHERE id = ${runId}
    `;
    const run = runRows[0];
    if (!run || run.userId !== user.id || run.shelfEntryId !== shelfEntryId) {
      return NextResponse.json({ error: "Invalid runId" }, { status: 400 });
    }
  }

  const trimmedNotes = notes?.trim() || null;
  const trimmedMusic = music?.trim() || null;
  const dur = (typeof durationMinutes === "number" && durationMinutes > 0) ? durationMinutes : null;
  const resolvedRunId = runId ?? null;
  const newId = crypto.randomUUID();
  const now   = new Date();

  await prisma.$executeRaw`
    INSERT INTO "Session" (id, "userId", "shelfEntryId", "runId", date, "durationMinutes", notes, music, "createdAt", "updatedAt")
    VALUES (${newId}, ${user.id}, ${shelfEntryId}, ${resolvedRunId}, ${parsedDate}, ${dur}, ${trimmedNotes}, ${trimmedMusic}, ${now}, ${now})
  `;

  return NextResponse.json({ id: newId }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shelfEntryId = req.nextUrl.searchParams.get("shelfEntryId");
  if (!shelfEntryId) {
    return NextResponse.json(
      { error: "shelfEntryId query param is required" },
      { status: 400 }
    );
  }

  // Confirm the shelf entry belongs to this user before returning its sessions.
  const entry = await prisma.shelfEntry.findUnique({
    where: { id: shelfEntryId },
    select: { userId: true },
  });

  if (!entry || entry.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sessions = await prisma.session.findMany({
    where: { shelfEntryId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sessions);
}
