// GET    /api/user/tags       — all unique tag names (applied + defined)
// POST   /api/user/tags       — create a tag: { name }
// PATCH  /api/user/tags       — rename a tag across games + definition: { oldTag, newTag }
// DELETE /api/user/tags?tag=x — remove a tag from all games + definition

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

// Read definedTags via raw SQL so it works even if the Prisma client hasn't been
// regenerated yet (the DB column is always there after prisma db push).
async function readDefinedTags(userId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ definedTags: string[] }[]>`
    SELECT "definedTags" FROM "User" WHERE id = ${userId}
  `.catch(() => []);
  return rows[0]?.definedTags ?? [];
}

async function writeDefinedTags(userId: string, tags: string[]): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "User" SET "definedTags" = ${tags}::text[] WHERE id = ${userId}
  `;
}

export async function GET() {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [entries, definedTags] = await Promise.all([
    prisma.shelfEntry.findMany({ where: { userId: user.id }, select: { tags: true } }),
    readDefinedTags(user.id),
  ]);

  const tagSet = new Set<string>(definedTags);
  for (const e of entries) {
    for (const tag of e.tags) tagSet.add(tag);
  }

  return NextResponse.json(Array.from(tagSet).sort());
  } catch (err) {
    console.error("[GET /api/user/tags]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = (body as { name?: string }).name?.trim().toLowerCase();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const current = await readDefinedTags(user.id);
  if (!current.includes(name)) {
    await writeDefinedTags(user.id, [...current, name].sort());
  }

  return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/user/tags]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { oldTag, newTag } = body as { oldTag?: string; newTag?: string };
  if (!oldTag || !newTag?.trim()) return NextResponse.json({ error: "oldTag and newTag required" }, { status: 400 });

  const trimmedNew = newTag.trim().toLowerCase();

  const [entries, definedTags] = await Promise.all([
    prisma.shelfEntry.findMany({
      where: { userId: user.id, tags: { has: oldTag } },
      select: { id: true, tags: true },
    }),
    readDefinedTags(user.id),
  ]);

  await Promise.all([
    // Update every game that has oldTag
    ...entries.map((e) =>
      prisma.shelfEntry.update({
        where: { id: e.id },
        data: { tags: { set: [...new Set(e.tags.map((t) => (t === oldTag ? trimmedNew : t)))] } },
      })
    ),
    // Update definedTags if it contains oldTag
    definedTags.includes(oldTag)
      ? writeDefinedTags(user.id, [...new Set(definedTags.map((t) => (t === oldTag ? trimmedNew : t)))].sort())
      : Promise.resolve(),
  ]);

  return NextResponse.json({ updated: entries.length });
  } catch (err) {
    console.error("[PATCH /api/user/tags]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tag = new URL(req.url).searchParams.get("tag");
  if (!tag) return NextResponse.json({ error: "tag query param required" }, { status: 400 });

  const [entries, definedTags] = await Promise.all([
    prisma.shelfEntry.findMany({
      where: { userId: user.id, tags: { has: tag } },
      select: { id: true, tags: true },
    }),
    readDefinedTags(user.id),
  ]);

  await Promise.all([
    ...entries.map((e) =>
      prisma.shelfEntry.update({
        where: { id: e.id },
        data: { tags: { set: e.tags.filter((t) => t !== tag) } },
      })
    ),
    definedTags.includes(tag)
      ? writeDefinedTags(user.id, definedTags.filter((t) => t !== tag))
      : Promise.resolve(),
  ]);

  return NextResponse.json({ removed: entries.length });
  } catch (err) {
    console.error("[DELETE /api/user/tags]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
