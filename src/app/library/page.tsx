// /library — the full game shelf, moved from /
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ShelfPage from "@/components/ShelfPage";
import type { ShelfGame } from "@/components/ShelfPage";

const STATUS_DISPLAY: Record<string, string> = {
  PLAYING:               "Playing",
  COMPLETED:             "Completed",
  ABANDONED:             "Abandoned",
  BACKLOG:               "Untracked",
  REPLAYING:             "Replaying",
  UNTRACKED:             "Untracked",
  WANT_TO_PLAY:          "Want to Play",
  MULTIPLAYER:           "Active",
  MULTIPLAYER_ACTIVE:    "Active",
  MULTIPLAYER_ON_BREAK:  "On Break",
  MULTIPLAYER_RETIRED:   "Retired",
};

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ filter?: string; tag?: string }> }) {
  const { filter, tag } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const steamId = (session.user as { steamId?: string }).steamId;
  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({ where: { steamId } });
  if (!user) redirect("/");

  if (!(user as { onboardingComplete?: boolean }).onboardingComplete) redirect("/onboarding");

  const userLists = await prisma.$queryRaw<{ id: string; name: string }[]>`
    SELECT id, name FROM "List" WHERE "userId" = ${user.id} ORDER BY "createdAt" ASC
  `.catch(() => [] as { id: string; name: string }[]);

  const entries = await prisma.shelfEntry.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const totalHours = Math.round(
    entries.filter((e) => !(e as { isHidden?: boolean }).isHidden)
           .reduce((sum, e) => sum + e.playtimeMinutes, 0) / 60
  );

  const games: ShelfGame[] = entries.map((e) => ({
    id: e.id,
    steamAppId: e.steamAppId,
    coverUrl:   (e as { coverUrl?: string | null }).coverUrl   ?? null,
    platform:   (e as { platform?: string }).platform          ?? "Steam",
    name: e.gameName,
    status: STATUS_DISPLAY[e.status] ?? e.status,
    rating: e.rating,
    hours: Math.round(e.playtimeMinutes / 60),
    tags:          (e as { tags?: string[] }).tags             ?? [],
    genres:        (e as { genres?: string[] }).genres         ?? [],
    isHidden:      (e as { isHidden?: boolean }).isHidden      ?? false,
    isMultiplayer: ((e as { isMultiplayer?: boolean }).isMultiplayer ?? false)
      || ["MULTIPLAYER","MULTIPLAYER_ACTIVE","MULTIPLAYER_ON_BREAK","MULTIPLAYER_RETIRED"].includes(e.status),
  }));

  return <ShelfPage games={games} initialFilter={filter} initialTag={tag} totalHours={totalHours} lists={userLists} />;
}
