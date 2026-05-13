import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UnhideButton from "@/components/UnhideButton";
import UserTagsManager from "@/components/UserTagsManager";

const STATUS_DISPLAY: Record<string, string> = {
  PLAYING:      "Playing",
  COMPLETED:    "Completed",
  ABANDONED:    "Abandoned",
  BACKLOG:      "Untracked",
  REPLAYING:    "Replaying",
  UNTRACKED:    "Untracked",
  WANT_TO_PLAY: "Want to Play",
  MULTIPLAYER:  "Multiplayer",
};

const STATUS_COLOR: Record<string, string> = {
  Playing:        "bg-emerald-500",
  Multiplayer:    "bg-blue-500",
  "Want to Play": "bg-amber-500",
  Completed:      "bg-sky-500",
  Replaying:      "bg-violet-500",
  Abandoned:      "bg-rose-500",
  Untracked:      "bg-slate-700",
};

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const steamId = (session.user as { steamId?: string }).steamId;
  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({ where: { steamId } });
  if (!user) redirect("/");

  // Fetch all shelf entries and sessions in parallel
  const [allEntries, sessionCount, allTagEntries] = await Promise.all([
    prisma.shelfEntry.findMany({ where: { userId: user.id } }),
    prisma.session.count({ where: { userId: user.id } }),
    prisma.shelfEntry.findMany({ where: { userId: user.id }, select: { tags: true } }),
  ]);

  // Split here so totalHours and top5 include hidden, but counts/breakdown don't
  const entries        = allEntries.filter((e) => !e.isHidden);
  const hiddenEntries  = allEntries
    .filter((e) => e.isHidden)
    .sort((a, b) => a.gameName.localeCompare(b.gameName))
    .map((e) => ({ id: e.id, gameName: e.gameName }));

  const tagCounts: Record<string, number> = {};
  for (const e of allTagEntries) {
    for (const tag of e.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  // Include tags that have been defined but not yet applied to any game (count = 0)
  const definedTags = (user as unknown as { definedTags?: string[] }).definedTags ?? [];
  for (const tag of definedTags) {
    if (!(tag in tagCounts)) tagCounts[tag] = 0;
  }
  const userTags = Object.entries(tagCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, count]) => ({ tag, count }));

  const totalHours = Math.round(entries.reduce((sum, e) => sum + e.playtimeMinutes, 0) / 60);
  const totalGames = entries.length;

  // Status counts (map BACKLOG → Untracked)
  const statusCounts: Record<string, number> = {};
  for (const e of entries) {
    const label = STATUS_DISPLAY[e.status] ?? e.status;
    statusCounts[label] = (statusCounts[label] ?? 0) + 1;
  }
  // Collapse both Untracked labels into one
  const displayOrder = ["Playing", "Multiplayer", "Want to Play", "Completed", "Replaying", "Abandoned", "Untracked"];

  const top5 = [...entries]
    .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes)
    .slice(0, 5);

  const mostPlayed = top5[0];

  return (
    <div className="space-y-10">

      {/* ── Profile header ── */}
      <div className="flex items-center gap-5 pt-2">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="Steam avatar"
            className="h-20 w-20 rounded-full ring-2 ring-slate-600 flex-shrink-0"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-slate-700 flex-shrink-0" />
        )}
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">{user.displayName}</h1>
          {user.profileUrl && (
            <a
              href={user.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Steam profile
              <span className="text-[9px]">↗</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 divide-x divide-slate-700">
          <StatBlock value={totalHours.toLocaleString()} label="Total hours" />
          <StatBlock value={totalGames} label="In library" />
          <StatBlock value={statusCounts["Completed"] ?? 0} label="Completed" />
          <StatBlock value={statusCounts["Abandoned"] ?? 0} label="Abandoned" />
          <StatBlock value={(statusCounts["Playing"] ?? 0) + (statusCounts["Replaying"] ?? 0)} label="Currently playing" />
          <StatBlock value={sessionCount} label="Sessions" />
        </div>
      </div>

      {/* ── Most played call-out ── */}
      {mostPlayed && (
        <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-900 p-5">
          <img
            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${mostPlayed.steamAppId}/capsule_sm_120.jpg`}
            alt={mostPlayed.gameName}
            className="h-14 w-24 rounded object-cover flex-shrink-0 bg-slate-700"
          />
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Most played</p>
            <p className="text-base font-semibold text-slate-100">{mostPlayed.gameName}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {Math.round(mostPlayed.playtimeMinutes / 60).toLocaleString()} hours
            </p>
          </div>
        </div>
      )}

      {/* ── Library breakdown + Top Played ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* Library breakdown */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Library Breakdown
          </h2>
          <div className="space-y-4">
            {displayOrder.map((label) => {
              const count = statusCounts[label] ?? 0;
              if (count === 0) return null;
              const pct = Math.round((count / totalGames) * 100);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className="text-xs text-slate-500">{count} <span className="text-slate-600">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-700">
                    <div
                      className={`h-full rounded-full ${STATUS_COLOR[label] ?? "bg-slate-600"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Top 5 most played */}
        {top5.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Top Played
            </h2>
            <ol className="space-y-2">
              {top5.map((e, i) => (
                <li key={e.id}>
                  <Link href={`/games/${e.id}`} className="flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-900 px-4 py-3 hover:border-slate-600 hover:bg-slate-800/60 transition-all">
                    <span className="text-xs font-semibold text-slate-600 w-4 flex-shrink-0">{i + 1}</span>
                    <img
                      src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${e.steamAppId}/capsule_sm_120.jpg`}
                      alt={e.gameName}
                      className="h-8 w-14 rounded object-cover flex-shrink-0 bg-slate-700"
                    />
                    <span className="flex-1 min-w-0 text-sm font-medium text-slate-200 truncate">{e.gameName}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {Math.round(e.playtimeMinutes / 60).toLocaleString()}h
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

      </div>

      {/* ── My Tags ── */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          My Tags
        </h2>
        <UserTagsManager initialTags={userTags} />
      </section>

      {/* ── Hidden games — discreet disclosure ── */}
      {hiddenEntries.length > 0 && (
        <details>
          <summary className="cursor-pointer list-none text-xs text-slate-500 hover:text-slate-300 transition-colors select-none w-fit">
            Hidden games
          </summary>
          <div className="mt-3 space-y-1">
            {hiddenEntries.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-slate-900/60">
                <span className="text-xs text-slate-400">{e.gameName}</span>
                <UnhideButton entryId={e.id} />
              </div>
            ))}
          </div>
        </details>
      )}

    </div>
  );
}
