// POST   /api/lists/:id/entries               — add a game to a list
// DELETE /api/lists/:id/entries               — remove a game from a list (body: { shelfEntryId })
// PATCH  /api/lists/:id/entries               — reorder: { order: shelfEntryId[] } → assigns rank 1,2,3…

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

async function resolveList(listId: string, userId: string) {
  const list = await prisma.list.findUnique({ where: { id: listId }, select: { userId: true } });
  return list?.userId === userId ? list : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listId } = await params;
  if (!await resolveList(listId, user.id))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { shelfEntryId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.shelfEntryId)
    return NextResponse.json({ error: "shelfEntryId required" }, { status: 400 });

  // Confirm the shelf entry belongs to this user
  const entry = await prisma.shelfEntry.findUnique({
    where: { id: body.shelfEntryId },
    select: { userId: true },
  });
  if (!entry || entry.userId !== user.id)
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  const listEntry = await prisma.listEntry.upsert({
    where: { listId_shelfEntryId: { listId, shelfEntryId: body.shelfEntryId } },
    update: {},
    create: { listId, shelfEntryId: body.shelfEntryId },
  });

  return NextResponse.json(listEntry, { status: 201 });
  } catch (err) {
    console.error("[POST /api/lists/:id/entries]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listId } = await params;
  if (!await resolveList(listId, user.id))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { order?: string[] };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const order = body.order;
  if (!Array.isArray(order)) return NextResponse.json({ error: "order required" }, { status: 400 });

  // Assign rank 1, 2, 3… to each entry in the given order
  await Promise.all(
    order.map((shelfEntryId, i) =>
      prisma.$executeRaw`
        UPDATE "ListEntry"
        SET "rank" = ${i + 1}
        WHERE "listId" = ${listId} AND "shelfEntryId" = ${shelfEntryId}
      `
    )
  );

  return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/lists/:id/entries]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listId } = await params;
  if (!await resolveList(listId, user.id))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { shelfEntryId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.shelfEntryId)
    return NextResponse.json({ error: "shelfEntryId required" }, { status: 400 });

  await prisma.listEntry.deleteMany({
    where: { listId, shelfEntryId: body.shelfEntryId },
  });

  return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/lists/:id/entries]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
