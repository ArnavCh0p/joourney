// GET  /api/games/:id/runs — list playthroughs for a shelf entry
// POST /api/games/:id/runs — create a new playthrough

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

async function verifyOwnership(entryId: string, userId: string) {
  const entry = await prisma.shelfEntry.findUnique({
    where: { id: entryId },
    select: { userId: true },
  });
  return entry?.userId === userId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await verifyOwnership(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const runs = await prisma.$queryRaw<
    { id: string; name: string; status: string; notes: string | null; createdAt: Date }[]
  >`
    SELECT id, name, status, notes, "createdAt"
    FROM "Run"
    WHERE "shelfEntryId" = ${id}
    ORDER BY "createdAt" ASC
  `;

  return NextResponse.json(runs);
  } catch (err) {
    console.error("[GET /api/games/:id/runs]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await verifyOwnership(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { name?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (name.length > 200) return NextResponse.json({ error: "Name too long" }, { status: 400 });

  const notes = body.notes?.trim() || null;
  const newId = crypto.randomUUID();
  const now = new Date();

  await prisma.$executeRaw`
    INSERT INTO "Run" (id, "userId", "shelfEntryId", name, notes, status, "createdAt", "updatedAt")
    VALUES (${newId}, ${user.id}, ${id}, ${name}, ${notes}, 'ACTIVE'::"RunStatus", ${now}, ${now})
  `;

  return NextResponse.json(
    { id: newId, name, notes, status: "ACTIVE", createdAt: now },
    { status: 201 }
  );
  } catch (err) {
    console.error("[POST /api/games/:id/runs]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
