import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShelfStatus } from "@prisma/client";

const VALID_STATUSES = new Set<string>(Object.values(ShelfStatus));
const SP_ONLY = new Set(["PLAYING", "REPLAYING", "COMPLETED", "ABANDONED", "WANT_TO_PLAY"]);
const MP_ONLY = new Set(["MULTIPLAYER_ACTIVE", "MULTIPLAYER_ON_BREAK", "MULTIPLAYER_RETIRED"]);

export async function PATCH(req: NextRequest) {
  try {
  const session = await getServerSession(authOptions);
  const steamId = (session?.user as { steamId?: string })?.steamId;
  if (!steamId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { steamId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const { ids, status, isMultiplayer } = body ?? {};

  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });

  if (!status && typeof isMultiplayer !== "boolean")
    return NextResponse.json({ error: "Provide status, isMultiplayer, or both" }, { status: 400 });

  if (status && !VALID_STATUSES.has(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  // Fetch current isMultiplayer for all selected entries
  const entries = await prisma.shelfEntry.findMany({
    where: { id: { in: ids }, userId: user.id },
    select: { id: true, isMultiplayer: true },
  });

  // isMultiplayer change applies to all entries regardless of status
  if (typeof isMultiplayer === "boolean") {
    await prisma.shelfEntry.updateMany({
      where: { id: { in: ids }, userId: user.id },
      data: { isMultiplayer },
    });
  }

  // Status change only applies to compatible entries
  let applied = 0, skipped = 0;
  if (status) {
    const validIds: string[] = [];
    for (const entry of entries) {
      const effectiveIsMP = typeof isMultiplayer === "boolean" ? isMultiplayer : entry.isMultiplayer;
      if (SP_ONLY.has(status) && effectiveIsMP) { skipped++; continue; }
      if (MP_ONLY.has(status) && !effectiveIsMP) { skipped++; continue; }
      validIds.push(entry.id);
    }
    if (validIds.length > 0) {
      const result = await prisma.shelfEntry.updateMany({
        where: { id: { in: validIds }, userId: user.id },
        data: { status: status as ShelfStatus },
      });
      applied = result.count;
    }
  } else {
    applied = entries.length;
  }

  return NextResponse.json({ applied, skipped });
  } catch (err) {
    console.error("[PATCH /api/games/bulk-status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
