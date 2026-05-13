import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedGames } from "@/lib/steam/api";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const steamId = (session.user as { steamId?: string }).steamId;
  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({ where: { steamId } });
  if (!user) redirect("/");

  if ((user as { onboardingComplete?: boolean }).onboardingComplete) redirect("/library");

  // On first visit the library will be empty — AutoSync hasn't run yet because the
  // user hasn't reached the library page. Do a lightweight sync here so the
  // categorization step has real games to show.
  const hasEntries = await prisma.shelfEntry.count({ where: { userId: user.id } });

  let restricted = false;

  if (hasEntries === 0) {
    try {
      const result = await getOwnedGames(user.steamId);
      if (result.restricted) {
        restricted = true;
      } else {
        // Upsert just the core fields — AutoSync will fill playtime deltas,
        // sessions, achievements, and genres later when the user reaches the library.
        for (const game of result.games) {
          await prisma.shelfEntry.upsert({
            where: { userId_steamAppId: { userId: user.id, steamAppId: game.appid } },
            update: { gameName: game.name, playtimeMinutes: game.playtime_forever ?? 0 },
            create: {
              userId:          user.id,
              steamAppId:      game.appid,
              gameName:        game.name,
              playtimeMinutes: game.playtime_forever ?? 0,
            },
          });
        }
      }
    } catch {
      // Steam unavailable — proceed with empty library, user can add manually
    }
  }

  const entries = restricted
    ? []
    : await prisma.shelfEntry.findMany({
        where: { userId: user.id, isHidden: false },
        orderBy: { playtimeMinutes: "desc" },
        take: 10,
      });

  const games = entries.map((e) => ({
    id:           e.id,
    steamAppId:   e.steamAppId,
    name:         e.gameName,
    hours:        Math.round(e.playtimeMinutes / 60),
    isMultiplayer:(e as { isMultiplayer?: boolean }).isMultiplayer ?? false,
    genres:       (e as { genres?: string[] }).genres ?? [],
  }));

  return <OnboardingClient games={games} restricted={restricted} />;
}
