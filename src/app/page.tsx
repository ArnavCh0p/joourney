// Server component — can query Prisma directly.
// ShelfPage (imported below) is the client component that owns filter state.

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ShelfPage from "@/components/ShelfPage";
import type { ShelfGame } from "@/components/ShelfPage";

// Map Prisma's ShelfStatus enum values to human-readable display strings.
const STATUS_DISPLAY: Record<string, string> = {
  PLAYING: "Playing",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
  BACKLOG: "Backlog",
  REPLAYING: "Replaying",
};

// Steam CDN header image — reliable for any appId that has store art.
function steamCover(appId: number) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-3xl font-bold text-white">Joourney</h1>
      <p className="mt-3 max-w-sm text-zinc-400">{message}</p>
    </div>
  );
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <EmptyState message="Sign in with Steam to import your library and start journaling your sessions." />
    );
  }

  const steamId = (session.user as { steamId?: string }).steamId;

  if (!steamId) {
    return (
      <EmptyState message="Could not read your Steam ID from the session. Try signing out and back in." />
    );
  }

  // Look up the internal User row created during sign-in.
  // If it doesn't exist yet (first sign-in race), show a helpful message.
  const user = await prisma.user.findUnique({ where: { steamId } });

  if (!user) {
    return (
      <EmptyState message="Your account is being set up — please refresh the page or sign out and back in." />
    );
  }

  // Fetch the user's shelf entries, newest-updated first.
  const entries = await prisma.shelfEntry.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const games: ShelfGame[] = entries.map((e) => ({
    id: e.id,
    name: e.gameName,
    status: STATUS_DISPLAY[e.status] ?? e.status,
    rating: e.rating,
    hours: 0, // playtime sync not implemented yet
    cover: steamCover(e.steamAppId),
  }));

  return <ShelfPage games={games} />;
}
