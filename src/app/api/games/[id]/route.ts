// PATCH /api/games/:id — update status, review, tags, and/or isHidden.
// DELETE /api/games/:id — permanently remove a game and all its data.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/r2";
import { ShelfStatus } from "@prisma/client";

async function resolveUser() {
  const session = await getServerSession(authOptions);
  const steamId = (session?.user as { steamId?: string })?.steamId;
  if (!steamId) return null;
  return prisma.user.findUnique({ where: { steamId } });
}

const VALID_STATUSES = new Set<string>(Object.values(ShelfStatus));

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: { status?: string; review?: string; rating?: number | null; tags?: string[]; isHidden?: boolean; isMultiplayer?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const entry = await prisma.shelfEntry.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!entry || entry.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: {
    status?: ShelfStatus;
    review?: string | null;
    rating?: number | null;
    tags?: string[];
    isHidden?: boolean;
    isMultiplayer?: boolean;
  } = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    data.status = body.status as ShelfStatus;
  }

  if (body.review !== undefined) {
    if (typeof body.review !== "string" || body.review.length > 50_000)
      return NextResponse.json({ error: "Review too long" }, { status: 400 });
    data.review = body.review.trim() || null;
  }
  if (body.rating !== undefined) data.rating = body.rating === null ? null : Math.min(5, Math.max(1, Math.round(body.rating)));
  if (body.isHidden !== undefined) data.isHidden = body.isHidden;
  if (body.isMultiplayer !== undefined) (data as Record<string, unknown>).isMultiplayer = body.isMultiplayer;
  if (body.tags !== undefined) {
    // Normalise: lowercase, trim, dedupe
    data.tags = [...new Set(body.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  }

  const updated = await prisma.shelfEntry.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const entry = await prisma.shelfEntry.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!entry || entry.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Collect screenshot R2 keys before deleting so we can clean up storage
  const screenshots = await prisma.$queryRaw<{ r2Key: string }[]>`
    SELECT s."r2Key" FROM "Screenshot" s
    INNER JOIN "Session" sess ON sess.id = s."sessionId"
    WHERE sess."shelfEntryId" = ${id}
  `;

  // Delete in dependency order to satisfy FK constraints:
  // Screenshots → Sessions → Runs (clear runId FK first) → Achievements → BuildLogs → ListEntries → ShelfEntry
  await prisma.$executeRaw`
    DELETE FROM "Screenshot" WHERE "sessionId" IN (
      SELECT id FROM "Session" WHERE "shelfEntryId" = ${id}
    )
  `;
  await prisma.$executeRaw`UPDATE "Session" SET "runId" = null WHERE "shelfEntryId" = ${id}`;
  await prisma.$executeRaw`DELETE FROM "Session"     WHERE "shelfEntryId" = ${id}`;
  await prisma.$executeRaw`DELETE FROM "Achievement" WHERE "shelfEntryId" = ${id}`;
  await prisma.$executeRaw`DELETE FROM "Run"         WHERE "shelfEntryId" = ${id}`;
  await prisma.$executeRaw`DELETE FROM "BuildLog"    WHERE "shelfEntryId" = ${id}`;
  await prisma.$executeRaw`DELETE FROM "ListEntry"   WHERE "shelfEntryId" = ${id}`;
  await prisma.shelfEntry.delete({ where: { id } });

  // Best-effort R2 cleanup — don't fail the request if storage deletion errors
  await Promise.allSettled(screenshots.map((s) => deleteFromR2(s.r2Key)));

  return new NextResponse(null, { status: 204 });
}
