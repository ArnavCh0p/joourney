// PATCH  /api/sessions/:id — update notes, duration, and/or runId on an existing session
// DELETE /api/sessions/:id — delete a session entry

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function resolveUser() {
  const session = await getServerSession(authOptions);
  const steamId = (session?.user as { steamId?: string })?.steamId;
  if (!steamId) return null;
  return prisma.user.findUnique({ where: { steamId } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: { notes?: string; durationMinutes?: number | null; runId?: string | null; music?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({
    where: { id },
    select: { userId: true, shelfEntryId: true },
  });

  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Validate runId belongs to the same shelf entry and user
  if (body.runId !== undefined && body.runId !== null) {
    const runRows = await prisma.$queryRaw<{ userId: string; shelfEntryId: string }[]>`
      SELECT "userId", "shelfEntryId" FROM "Run" WHERE id = ${body.runId}
    `;
    const run = runRows[0];
    if (!run || run.userId !== user.id || run.shelfEntryId !== session.shelfEntryId) {
      return NextResponse.json({ error: "Invalid runId" }, { status: 400 });
    }
  }

  const trimmedNotes = body.notes?.trim() || null;
  const trimmedMusic = body.music !== undefined ? (body.music?.trim() || null) : undefined;
  const dur = (typeof body.durationMinutes === "number" && body.durationMinutes > 0)
    ? body.durationMinutes
    : null;
  const runId = body.runId !== undefined ? (body.runId ?? null) : undefined;
  const now = new Date();

  if (runId !== undefined && trimmedMusic !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Session"
      SET notes = ${trimmedNotes}, "durationMinutes" = ${dur},
          "runId" = ${runId}, music = ${trimmedMusic}, "updatedAt" = ${now}
      WHERE id = ${id}
    `;
  } else if (runId !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Session"
      SET notes = ${trimmedNotes}, "durationMinutes" = ${dur},
          "runId" = ${runId}, "updatedAt" = ${now}
      WHERE id = ${id}
    `;
  } else if (trimmedMusic !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Session"
      SET notes = ${trimmedNotes}, "durationMinutes" = ${dur},
          music = ${trimmedMusic}, "updatedAt" = ${now}
      WHERE id = ${id}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE "Session"
      SET notes = ${trimmedNotes}, "durationMinutes" = ${dur}, "updatedAt" = ${now}
      WHERE id = ${id}
    `;
  }

  return NextResponse.json({ id, notes: trimmedNotes, durationMinutes: dur, runId: runId ?? null, music: trimmedMusic ?? null });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.session.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
