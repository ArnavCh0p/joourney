import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignInHero from "@/components/SignInHero";
import AutoSync from "@/components/AutoSync";
import Link from "next/link";
import GameCard from "@/components/GameCard";
import LibraryNews from "@/components/LibraryNews";
import TrendingGames from "@/components/TrendingGames";

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

function formatDuration(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function relativeTime(date: Date): string {
  const diffMs    = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays  = Math.floor(diffHours / 24);
  if (diffHours < 1)  return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

function StatCard({ value, label, accent, leftAccent }: { value: string | number; label: string; accent?: string; leftAccent?: string }) {
  return (
    <div className={`rounded-xl bg-slate-900 p-4 ${
      leftAccent
        ? `border-t border-r border-b border-slate-700 border-l-2 ${leftAccent}`
        : "border border-slate-700"
    }`}>
      <p className={`text-3xl font-bold ${accent ?? "text-slate-100"}`}>{value}</p>
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return <SignInHero />;

  const steamId = (session.user as { steamId?: string }).steamId;
  if (!steamId) return <SignInHero />;

  const user = await prisma.user.findUnique({ where: { steamId } });
  if (!user) return <SignInHero />;

  if (!(user as { onboardingComplete?: boolean }).onboardingComplete) redirect("/onboarding");

  const [entries, recentAutoSessions, recentJournaled, lastSessionPerGame] = await Promise.all([
    prisma.shelfEntry.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    // Auto-detected sessions with no notes from the last 3 days.
    // Wrapped in try-catch — autoDetected column needs `prisma db push` first.
    prisma.$queryRaw<Array<{
      id: string;
      shelfEntryId: string;
      durationMinutes: number | null;
      date: Date;
      gameName: string;
      steamAppId: number;
    }>>`
      SELECT s.id, s."shelfEntryId", s."durationMinutes", s.date, e."gameName", e."steamAppId"
      FROM "Session" s
      JOIN "ShelfEntry" e ON e.id = s."shelfEntryId"
      WHERE s."userId" = ${user.id}
        AND s."autoDetected" = true
        AND s.notes IS NULL
        AND s.date > NOW() - INTERVAL '3 days'
      ORDER BY s.date DESC
      LIMIT 8
    `.catch(() => [] as Array<{
      id: string; shelfEntryId: string; durationMinutes: number | null;
      date: Date; gameName: string; steamAppId: number;
    }>),
    prisma.session.findMany({
      where: { userId: user.id, notes: { not: null } },
      orderBy: { date: "desc" },
      take: 6,
      include: { shelfEntry: { select: { id: true, gameName: true, steamAppId: true } } },
    }).catch(() => [] as Array<{ id: string; date: Date; notes: string | null; shelfEntry: { id: string; gameName: string; steamAppId: number } }>),
    // Most recent session date per game — used to order currently playing
    prisma.$queryRaw<Array<{ shelfEntryId: string; lastDate: Date }>>`
      SELECT "shelfEntryId", MAX(date) AS "lastDate"
      FROM "Session"
      WHERE "userId" = ${user.id}
      GROUP BY "shelfEntryId"
    `.catch(() => [] as Array<{ shelfEntryId: string; lastDate: Date }>),
  ]);

  const games = entries.map((e) => ({
    id: e.id,
    steamAppId: e.steamAppId,
    name: e.gameName,
    status: STATUS_DISPLAY[e.status] ?? e.status,
    rating: e.rating,
    hours: Math.round(e.playtimeMinutes / 60),
    coverUrl: (e as { coverUrl?: string | null }).coverUrl ?? null,
    platform: (e as { platform?: string }).platform ?? "Steam",
    tags:     (e as { tags?: string[] }).tags       ?? [],
    genres:   (e as { genres?: string[] }).genres   ?? [],
    isHidden:      (e as { isHidden?: boolean }).isHidden      ?? false,
    isMultiplayer: ((e as { isMultiplayer?: boolean }).isMultiplayer ?? false)
      || ["MULTIPLAYER","MULTIPLAYER_ACTIVE","MULTIPLAYER_ON_BREAK","MULTIPLAYER_RETIRED"].includes(e.status),
  }));

  const visibleGames   = games.filter((g) => !g.isHidden);

  // Sort currently playing by most recent session, falling back to updatedAt order
  const lastSessionMap = new Map(lastSessionPerGame.map((r) => [r.shelfEntryId, new Date(r.lastDate).getTime()]));
  const playingGames   = visibleGames
    .filter((g) => g.status === "Playing" || g.status === "Replaying")
    .sort((a, b) => (lastSessionMap.get(b.id) ?? 0) - (lastSessionMap.get(a.id) ?? 0));
  const totalHours     = Math.round(entries.filter((e) => !(e as { isHidden?: boolean }).isHidden).reduce((sum, e) => sum + e.playtimeMinutes, 0) / 60);
  const completedCount = visibleGames.filter((g) => g.status === "Completed").length;

  return (
    <div className="space-y-10">
      <AutoSync />

      {/* ── Greeting ── */}
      <div className="flex items-center gap-4 pt-2">
        {user.avatarUrl && (
          <img
            src={user.avatarUrl}
            alt="Steam avatar"
            className="h-12 w-12 rounded-full ring-2 ring-slate-600 flex-shrink-0"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">
            Welcome back, {user.displayName}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Your gaming journal</p>
        </div>
      </div>

      {/* ── You just played ── */}
      {recentAutoSessions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <h2 className="text-sm font-semibold text-slate-200">
              {recentAutoSessions.length === 1
                ? "You played recently"
                : `You played ${recentAutoSessions.length} sessions recently`}
            </h2>
            <span className="text-xs text-slate-500">— anything worth writing down?</span>
          </div>
          <div className="space-y-1.5">
            {recentAutoSessions.map((s) => (
              <Link
                key={s.id}
                href={`/games/${s.shelfEntryId}`}
                className="flex items-center gap-3 border-l-2 border-emerald-400 pl-3 -ml-px py-2.5 hover:bg-slate-800/40 rounded-r-md transition-colors group"
              >
                <img
                  src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${s.steamAppId}/capsule_sm_120.jpg`}
                  alt={s.gameName}
                  className="h-8 w-14 rounded object-cover flex-shrink-0 bg-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-200 truncate">{s.gameName}</p>
                  <p className="text-xs text-slate-500">{relativeTime(s.date)}</p>
                </div>
                {s.durationMinutes && (
                  <span className="text-xs font-medium text-slate-400 flex-shrink-0 tabular-nums">
                    +{formatDuration(s.durationMinutes)}
                  </span>
                )}
                <span className="text-xs text-slate-500 group-hover:text-slate-200 transition-colors flex-shrink-0">
                  Write →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={totalHours.toLocaleString()} label="Total hours" />
        <StatCard value={visibleGames.length} label="Games in library" />
        <StatCard value={completedCount} label="Completed" accent="text-sky-400" leftAccent="border-l-sky-500" />
        <StatCard value={playingGames.length} label="Currently playing" accent="text-emerald-400" leftAccent="border-l-emerald-500" />
      </div>

      {/* ── Currently Playing ── */}
      {playingGames.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-200 mb-3">
            Currently Playing
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {playingGames.slice(0, 6).map((g) => (
              <Link key={g.id} href={`/games/${g.id}`} className="block">
                <GameCard game={g} size="S" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Recently Journaled ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-200">
            Recently Journaled
          </h2>
          <Link href="/library" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
            View library →
          </Link>
        </div>
        {recentJournaled.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900 py-12 text-center">
            <p className="text-sm text-slate-500">No journal entries yet.</p>
            <p className="text-xs text-slate-600 mt-1">Open a game and write your first entry.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {recentJournaled.map((s) => (
              <Link key={s.id} href={`/games/${s.shelfEntry.id}`} className="block group">
                <div className="border-l-2 border-transparent group-hover:border-slate-500 pl-2 -ml-2 transition-all">
                  <div className="flex gap-4 py-5">
                    <img
                      src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${s.shelfEntry.steamAppId}/capsule_sm_120.jpg`}
                      alt={s.shelfEntry.gameName}
                      className="h-10 w-[72px] rounded-md object-cover flex-shrink-0 bg-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[13px] font-medium text-slate-200">{s.shelfEntry.gameName}</span>
                        <span className="text-xs text-slate-500 flex-shrink-0">{relativeTime(s.date)}</span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{s.notes}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Library news — loads async, won't block page ── */}
      {playingGames.length > 0 && (
        <Suspense fallback={null}>
          <LibraryNews
            games={playingGames.slice(0, 5).map((g) => ({ id: g.id, steamAppId: g.steamAppId, name: g.name }))}
          />
        </Suspense>
      )}

      {/* ── Trending on Steam ── */}
      <Suspense fallback={null}>
        <TrendingGames libraryAppIds={entries.flatMap((e) => e.steamAppId != null ? [e.steamAppId] : [])} />
      </Suspense>

    </div>
  );
}
