// DELETE /api/screenshots/:id — remove a screenshot from R2 and the database.
// Called either by the user to delete a photo, or automatically if a presigned upload fails.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/r2";

async function resolveUser() {
  const session = await getServerSession(authOptions);
  const steamId = (session?.user as { steamId?: string })?.steamId;
  if (!steamId) return null;
  return prisma.user.findUnique({ where: { steamId } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Fetch the record to verify ownership via the parent session
  const rows = await prisma.$queryRaw<{ id: string; r2Key: string; sessionUserId: string | null }[]>`
    SELECT s.id, s."r2Key", sess."userId" AS "sessionUserId"
    FROM "Screenshot" s
    LEFT JOIN "Session" sess ON sess.id = s."sessionId"
    WHERE s.id = ${id}
  `;

  const screenshot = rows[0];
  if (!screenshot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (screenshot.sessionUserId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from R2 first — if the DB delete fails the file is orphaned but not leaked to other users.
  await deleteFromR2(screenshot.r2Key).catch(() => {});
  await prisma.$executeRaw`DELETE FROM "Screenshot" WHERE id = ${id}`;

  return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/screenshots/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
