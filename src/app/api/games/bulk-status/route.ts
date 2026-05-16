import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShelfStatus } from "@prisma/client";

const VALID_STATUSES = new Set<string>(Object.values(ShelfStatus));

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const steamId = (session?.user as { steamId?: string })?.steamId;
  if (!steamId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { steamId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const { ids, status, isMultiplayer } = body ?? {};

  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });

  // At least one field must be changing
  if (!status && typeof isMultiplayer !== "boolean")
    return NextResponse.json({ error: "Provide status, isMultiplayer, or both" }, { status: 400 });

  if (status && !VALID_STATUSES.has(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const data: Partial<{ status: ShelfStatus; isMultiplayer: boolean }> = {};
  if (status) data.status = status as ShelfStatus;
  if (typeof isMultiplayer === "boolean") data.isMultiplayer = isMultiplayer;

  const result = await prisma.shelfEntry.updateMany({
    where: { id: { in: ids }, userId: user.id },
    data,
  });

  return NextResponse.json({ updated: result.count });
}
