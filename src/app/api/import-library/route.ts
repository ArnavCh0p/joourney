// POST /api/import-library
// 1. Snapshot playtimes before upsert so we can compute deltas.
// 2. Upserts all owned Steam games into ShelfEntry.
// 3. Auto-creates a Session for every game where playtime increased ≥ 5 min.
// 4. Fetches genres for any untagged entries.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedGames, getPlayerAchievements } from "@/lib/steam/api";

async function resolveUser() {
  const session = await getServerSession(authOptions);
  const steamId = (session?.user as { steamId?: string })?.steamId;
  if (!steamId) return null;
  return prisma.user.findUnique({ where: { steamId } });
}

async function fetchSteamGenres(steamAppId: number): Promise<string[]> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${steamAppId}&filters=genres`,
      { signal: AbortSignal.timeout(5000) }
    );
    const json = await res.json();
    const genres = json?.[steamAppId]?.data?.genres as { description: string }[] | undefined;
    return genres?.map((g) => g.description.toLowerCase()) ?? [];
  } catch {
    return [];
  }
}

export async function POST() {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let games: Array<{ appid: number; name: string; playtime_forever?: number }>;
  try {
    const result = await getOwnedGames(user.steamId);
    if (result.restricted) {
      return NextResponse.json({ imported: 0, restricted: true });
    }
    games = result.games;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Steam API unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Snapshot existing playtimes before any upserts so we can compute deltas.
  const existing = await prisma.shelfEntry.findMany({
    where: { userId: user.id },
    select: { id: true, steamAppId: true, playtimeMinutes: true },
  });
  const prevPlaytime = new Map(existing.map((e) => [e.steamAppId, { id: e.id, minutes: e.playtimeMinutes }]));

  // Upsert all games — existing entries keep status/rating/review/tags intact.
  for (const game of games) {
    await prisma.shelfEntry.upsert({
      where: { userId_steamAppId: { userId: user.id, steamAppId: game.appid } },
      update: { gameName: game.name, playtimeMinutes: game.playtime_forever ?? 0 },
      create: {
        userId: user.id,
        steamAppId: game.appid,
        gameName: game.name,
        playtimeMinutes: game.playtime_forever ?? 0,
      },
    });
  }

  // Auto-create sessions and fetch achievements for games where playtime grew by ≥ 5 minutes.
  // Only for games that already existed (not first-time imports).
  let sessionsCreated = 0;
  const now = new Date();

  // Collect the shelf entry IDs of active games so we can fetch achievements in parallel
  const activeSessions: { entryId: string; appId: number }[] = [];

  for (const game of games) {
    const prev = prevPlaytime.get(game.appid);
    if (!prev) continue; // new game, skip

    const delta = (game.playtime_forever ?? 0) - prev.minutes;
    if (delta < 5) continue;

    const sessionId = crypto.randomUUID();
    try {
      await prisma.$executeRaw`
        INSERT INTO "Session" (id, "userId", "shelfEntryId", date, "durationMinutes", "autoDetected", notes, "createdAt", "updatedAt")
        VALUES (${sessionId}, ${user.id}, ${prev.id}, ${now}, ${delta}, true, null, ${now}, ${now})
      `;
      sessionsCreated++;
      activeSessions.push({ entryId: prev.id, appId: game.appid });
    } catch {
      // autoDetected column may not exist yet if db push hasn't been run — skip silently.
    }
  }

  // Fetch and upsert achievements for games played this sync
  await Promise.allSettled(
    activeSessions.map(async ({ entryId, appId }) => {
      const achievements = await getPlayerAchievements(user.steamId, appId);
      const earned = achievements.filter((a) => a.achieved === 1 && a.unlocktime > 0);
      await Promise.allSettled(
        earned.map(async (a) => {
          const unlockedAt = new Date(a.unlocktime * 1000);
          const achId = crypto.randomUUID();
          await prisma.$executeRaw`
            INSERT INTO "Achievement" (id, "userId", "shelfEntryId", "apiName", "displayName", description, "unlockedAt", "createdAt")
            VALUES (${achId}, ${user.id}, ${entryId}, ${a.apiname}, ${a.name || a.apiname}, ${a.description || null}, ${unlockedAt}, ${now})
            ON CONFLICT ("userId", "shelfEntryId", "apiName") DO NOTHING
          `;
        })
      );
    })
  );

  // One-time migration: move old Steam genres from `tags` → `genres`, clear `tags`.
  // Existing tags were all Steam-fetched, so this is safe to do in bulk.
  try {
    await prisma.$executeRaw`
      UPDATE "ShelfEntry"
      SET genres = tags, tags = '{}'
      WHERE "userId" = ${user.id}
        AND (genres = '{}' OR genres IS NULL)
        AND tags != '{}'
        AND array_length(tags, 1) > 0
    `;
  } catch {
    // genres column may not exist yet until prisma db push — skip silently.
  }

  // Fetch genres for entries that still have no genres.
  const ungenred = await prisma.$queryRaw<{ id: string; steamAppId: number }[]>`
    SELECT id, "steamAppId"
    FROM "ShelfEntry"
    WHERE "userId" = ${user.id}
      AND (genres = '{}' OR genres IS NULL)
  `.catch(() => [] as { id: string; steamAppId: number }[]);

  // Keywords in Steam genres that indicate a multiplayer/live-service game
  const MULTIPLAYER_KEYWORDS = ["massively multiplayer", "battle royale", "mmo", "pvp"];

  let tagged = 0;
  if (ungenred.length > 0) {
    await Promise.allSettled(
      ungenred.map(async ({ id, steamAppId }) => {
        const genreList = await fetchSteamGenres(steamAppId);
        if (genreList.length === 0) return;
        await prisma.$executeRaw`
          UPDATE "ShelfEntry" SET genres = ${genreList}::text[] WHERE id = ${id}
        `;
        // Auto-flag as multiplayer if genres suggest it (only if user hasn't manually set it)
        const looksMultiplayer = genreList.some((g) =>
          MULTIPLAYER_KEYWORDS.some((k) => g.includes(k))
        );
        if (looksMultiplayer) {
          await prisma.$executeRaw`
            UPDATE "ShelfEntry"
            SET "isMultiplayer" = true
            WHERE id = ${id} AND "isMultiplayer" = false AND status = 'UNTRACKED'
          `.catch(() => {});
        }
        tagged++;
      })
    );
  }

  return NextResponse.json({ imported: games.length, tagged, sessionsCreated });
  } catch (err) {
    console.error("[POST /api/import-library]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
