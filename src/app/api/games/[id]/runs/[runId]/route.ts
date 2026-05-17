// PATCH  /api/games/:id/runs/:runId — update a playthrough (name, notes, status)
// DELETE /api/games/:id/runs/:runId — delete a playthrough (unassigns its sessions)

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

type RunRow = { id: string; userId: string };

async function resolveRun(runId: string, userId: string): Promise<RunRow | null> {
  const rows = await prisma.$queryRaw<RunRow[]>`
    SELECT id, "userId" FROM "Run" WHERE id = ${runId}
  `;
  const run = rows[0];
  if (!run || run.userId !== userId) return null;
  return run;
}

const VALID_RUN_STATUSES = new Set(["ACTIVE", "COMPLETED", "ABANDONED"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { runId } = await params;
  const run = await resolveRun(runId, user.id);
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { name?: string; notes?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.status !== undefined && !VALID_RUN_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (name !== undefined && (!name || name.length > 200)) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const now = new Date();
  const parts: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (name !== undefined) {
    parts.push(`name = $${idx++}`);
    values.push(name);
    parts.push(`notes = $${idx++}`);
    values.push(body.notes?.trim() || null);
  }
  // Status uses enum cast — safe because validated against VALID_RUN_STATUSES above
  if (body.status !== undefined) {
    parts.push(`status = '${body.status}'::"RunStatus"`);
  }
  parts.push(`"updatedAt" = $${idx++}`);
  values.push(now);
  values.push(runId);

  await prisma.$executeRawUnsafe(
    `UPDATE "Run" SET ${parts.join(", ")} WHERE id = $${idx}`,
    ...values
  );

  return NextResponse.json({ id: runId });
  } catch (err) {
    console.error("[PATCH /api/games/:id/runs/:runId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { runId } = await params;
  const run = await resolveRun(runId, user.id);
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Unassign sessions before deleting so foreign key isn't violated
  await prisma.$executeRaw`UPDATE "Session" SET "runId" = NULL WHERE "runId" = ${runId}`;
  await prisma.$executeRaw`DELETE FROM "Run" WHERE id = ${runId}`;

  return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/games/:id/runs/:runId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
