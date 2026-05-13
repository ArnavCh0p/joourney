// POST /api/games/:id/steam-tags
// Fetches genres from the Steam store API and stores them in the `genres` field.

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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const entry = await prisma.shelfEntry.findUnique({
    where: { id },
    select: { userId: true, steamAppId: true },
  });

  if (!entry || entry.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check if genres already populated (raw query since client may be stale)
  const rows = await prisma.$queryRaw<{ genres: string[] }[]>`
    SELECT genres FROM "ShelfEntry" WHERE id = ${id}
  `.catch(() => [] as { genres: string[] }[]);

  const existingGenres = rows[0]?.genres ?? [];
  if (existingGenres.length > 0) return NextResponse.json({ genres: existingGenres });

  if (!entry.steamAppId) return NextResponse.json({ genres: [] });

  let steamGenres: string[] = [];
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${entry.steamAppId}&filters=genres`,
      { next: { revalidate: 0 } }
    );
    const json = await res.json();
    const data = json?.[entry.steamAppId]?.data;
    if (data?.genres) {
      steamGenres = (data.genres as { description: string }[]).map((g) =>
        g.description.toLowerCase()
      );
    }
  } catch {
    return NextResponse.json({ genres: [] });
  }

  if (steamGenres.length === 0) return NextResponse.json({ genres: [] });

  await prisma.$executeRaw`
    UPDATE "ShelfEntry" SET genres = ${steamGenres}::text[] WHERE id = ${id}
  `;

  return NextResponse.json({ genres: steamGenres });
}
