// POST /api/games — create a manually-added game (no Steam data required)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShelfStatus } from "@prisma/client";

async function resolveUser() {
  const session = await getServerSession(authOptions);
  const steamId = (session?.user as { steamId?: string })?.steamId;
  if (!steamId) return null;
  return prisma.user.findUnique({ where: { steamId } });
}

const VALID_STATUSES = new Set<string>(Object.values(ShelfStatus));
const VALID_PLATFORMS = new Set(["Steam", "PC", "PlayStation", "Xbox", "Nintendo", "Other"]);

export async function POST(req: NextRequest) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const MULTIPLAYER_STATUSES = new Set(["MULTIPLAYER", "MULTIPLAYER_ACTIVE", "MULTIPLAYER_ON_BREAK", "MULTIPLAYER_RETIRED"]);

  let body: { title?: string; platform?: string; status?: string; coverUrl?: string; igdbId?: number; isMultiplayer?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title || title.length > 200) {
    return NextResponse.json({ error: "Title is required (max 200 characters)" }, { status: 400 });
  }

  const platform = body.platform ?? "PC";
  if (!VALID_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const status = (body.status ?? "UNTRACKED") as ShelfStatus;
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Auto-set isMultiplayer if the chosen status is a multiplayer status
  const isMultiplayer = body.isMultiplayer === true || MULTIPLAYER_STATUSES.has(status);

  const entry = await prisma.shelfEntry.create({
    data: {
      userId:        user.id,
      gameName:      title,
      platform,
      status,
      isMultiplayer,
      coverUrl:      body.coverUrl ?? null,
      igdbId:        body.igdbId   ?? null,
    } as Parameters<typeof prisma.shelfEntry.create>[0]["data"],
  });

  return NextResponse.json({ id: entry.id }, { status: 201 });
}
