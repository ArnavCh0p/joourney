// GET  /api/lists            — return all lists for the current user
// GET  /api/lists?entryId=x  — same, plus isMember flag for that shelf entry
// POST /api/lists             — create a new list

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

export async function GET(req: NextRequest) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entryId = new URL(req.url).searchParams.get("entryId");

  const lists = await prisma.list.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { entries: true } },
      ...(entryId ? { entries: { where: { shelfEntryId: entryId }, select: { shelfEntryId: true } } } : {}),
    },
  });

  if (entryId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json(lists.map((l: any) => ({
      id: l.id,
      name: l.name,
      entryCount: l._count.entries,
      isMember: (l.entries?.length ?? 0) > 0,
    })));
  }

  return NextResponse.json(lists);
  } catch (err) {
    console.error("[GET /api/lists]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const list = await prisma.list.create({ data: { userId: user.id, name } });
  return NextResponse.json(list, { status: 201 });
  } catch (err) {
    console.error("[POST /api/lists]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
