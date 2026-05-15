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
  const { ids, status } = body ?? {};

  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  if (!status || !VALID_STATUSES.has(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const result = await prisma.shelfEntry.updateMany({
    where: { id: { in: ids }, userId: user.id },
    data:  { status: status as ShelfStatus },
  });

  return NextResponse.json({ updated: result.count });
}
