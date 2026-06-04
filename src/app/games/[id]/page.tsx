import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RunManager from "@/components/RunManager";
import type { RunProp, SessionProp, AchievementProp, ScreenshotProp } from "@/components/RunManager";
import EditGamePanel from "@/components/EditGamePanel";
import TagManager from "@/components/TagManager";
import AddToListPanel from "@/components/AddToListPanel";
import HideGameButton from "@/components/HideGameButton";
import DeleteGameButton from "@/components/DeleteGameButton";
import BackButton from "@/components/BackButton";

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

const STATUS_DOT: Record<string, string> = {
  Playing:        "bg-emerald-500",
  Completed:      "bg-sky-500",
  Abandoned:      "bg-rose-500",
  Replaying:      "bg-violet-500",
  Untracked:      "bg-slate-400",
  "Want to Play": "bg-amber-500",
  Active:         "bg-blue-500",
  "On Break":     "bg-amber-500",
  Retired:        "bg-slate-600",
};

const STATUS_TEXT: Record<string, string> = {
  Playing:        "text-emerald-400",
  Completed:      "text-sky-400",
  Abandoned:      "text-rose-400",
  Replaying:      "text-violet-400",
  Untracked:      "text-slate-400",
  "Want to Play": "text-amber-400",
  Active:         "text-blue-400",
  "On Break":     "text-amber-400",
  Retired:        "text-slate-500",
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

type Params = { id: string };

export default async function GameDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from ? `/library?filter=${encodeURIComponent(from)}` : "/library";

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const steamId = (session.user as { steamId?: string }).steamId;
  if (!steamId) redirect("/");

  const entry = await prisma.shelfEntry.findUnique({
    where: { id },
    include: {
      user: { select: { steamId: true } },
      sessions: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
    },
  });

  if (!entry || entry.user.steamId !== steamId) notFound();

  const dbUser = await prisma.user.findUnique({ where: { steamId } });

  // Fetch playthroughs (raw SQL — Run model may not be in generated client yet)
  const runsRaw = await prisma.$queryRaw<
    { id: string; name: string; status: string; createdAt: Date }[]
  >`
    SELECT id, name, status, "createdAt" FROM "Run"
    WHERE "shelfEntryId" = ${entry.id}
    ORDER BY "createdAt" ASC
  `;

  // Fetch sessions with runId and music (raw SQL — new columns may not be in generated client yet)
  const sessionsRaw = await prisma.$queryRaw<{
    id: string; date: Date; durationMinutes: number | null;
    autoDetected: boolean; notes: string | null; runId: string | null; music: string | null;
  }[]>`
    SELECT id, date, "durationMinutes", "autoDetected", notes, "runId", music
    FROM "Session"
    WHERE "shelfEntryId" = ${entry.id}
    ORDER BY date DESC, "createdAt" DESC
  `;

  // Fetch screenshots for all sessions of this game, grouped by sessionId
  const screenshotsRaw = await prisma.$queryRaw<{ id: string; url: string; sessionId: string }[]>`
    SELECT s.id, s.url, s."sessionId"
    FROM "Screenshot" s
    INNER JOIN "Session" sess ON sess.id = s."sessionId"
    WHERE sess."shelfEntryId" = ${entry.id}
    ORDER BY s."uploadedAt" ASC
  `;
  const screenshotsBySession = new Map<string, ScreenshotProp[]>();
  for (const s of screenshotsRaw) {
    if (!screenshotsBySession.has(s.sessionId)) screenshotsBySession.set(s.sessionId, []);
    screenshotsBySession.get(s.sessionId)!.push({ id: s.id, url: s.url });
  }

  // Fetch achievements for this game, ordered by unlock time
  const achievementsRaw = await prisma.$queryRaw<{
    id: string; displayName: string; description: string | null; unlockedAt: Date;
  }[]>`
    SELECT id, "displayName", description, "unlockedAt"
    FROM "Achievement"
    WHERE "shelfEntryId" = ${entry.id}
    ORDER BY "unlockedAt" ASC
  `;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listModel = (prisma as any).list as typeof prisma.list | undefined;
  const userLists = await (
    (dbUser && listModel)
      ? listModel.findMany({
          where: { userId: dbUser.id },
          orderBy: { createdAt: "asc" },
          include: {
            _count: { select: { entries: true } },
            entries: { where: { shelfEntryId: entry.id }, select: { shelfEntryId: true } },
          },
        }).catch(() => [])
      : Promise.resolve([])
  );

  const listSummaries = userLists.map((l: { id: string; name: string; _count: { entries: number } }) => ({
    id: l.id,
    name: l.name,
    entryCount: l._count.entries,
  }));
  const memberIds = userLists
    .filter((l: { entries: { shelfEntryId: string }[] }) => l.entries.length > 0)
    .map((l: { id: string }) => l.id);

  const runs: RunProp[] = runsRaw.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  const sessions: SessionProp[] = sessionsRaw.map((s) => ({
    id: s.id,
    date: formatDate(s.date),
    rawDate: s.date.toISOString().slice(0, 10),
    durationMinutes: s.durationMinutes ?? null,
    notes: s.notes ?? null,
    music: s.music ?? null,
    autoDetected: s.autoDetected,
    runId: s.runId ?? null,
    screenshots: screenshotsBySession.get(s.id) ?? [],
  }));

  const achievements: AchievementProp[] = achievementsRaw.map((a) => ({
    id: a.id,
    displayName: a.displayName,
    description: a.description ?? null,
    unlockedDate: a.unlockedAt.toISOString().slice(0, 10),
  }));

  const entryTags    = (entry as { tags?: string[] }).tags      ?? [];
  const entryGenres  = (entry as { genres?: string[] }).genres  ?? [];
  const entryHidden  = (entry as { isHidden?: boolean }).isHidden ?? false;

  const statusDisplay = STATUS_DISPLAY[entry.status] ?? entry.status;
  const dotClass  = STATUS_DOT[statusDisplay]  ?? "bg-slate-400";
  const textClass = STATUS_TEXT[statusDisplay] ?? "text-slate-500";
  // Priority: stored coverUrl (IGDB) → Steam CDN → null (shows placeholder)
  const storedCover = (entry as { coverUrl?: string | null }).coverUrl ?? null;
  const coverUrl = storedCover
    ?? (entry.steamAppId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${entry.steamAppId}/header.jpg` : null);

  return (
    <div>
      {/* ── Hero banner — blurred cover bleeds to plane edges ── */}
      <div className="relative -mx-6 -mt-8 overflow-hidden mb-8">
        {/* Blurred background art — only rendered when a cover is available */}
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-25 select-none"
          />
        )}
        {/* Gradient fade to plane color at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/70 to-[#0f172a]" />

        {/* Content on top of hero */}
        <div className="relative z-10 px-6 pt-6 pb-10">
          <BackButton fallback={backHref} />

          <div className="flex gap-5 items-end mt-6">
            {/* Cover thumbnail — IGDB cover, Steam header, or initials placeholder */}
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={entry.gameName}
                className="w-36 rounded-lg object-cover flex-shrink-0 shadow-2xl ring-1 ring-white/10 bg-slate-700"
              />
            ) : (
              <div className="w-36 aspect-[2/3] rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center shadow-2xl ring-1 ring-white/10">
                <span className="text-4xl font-bold text-zinc-600 select-none">
                  {entry.gameName.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            {/* Title + meta */}
            <div className="flex-1 min-w-0 pb-1">
              {entryGenres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {entryGenres.map((g) => (
                    <span key={g} className="rounded px-2 py-0.5 text-xs bg-black/30 text-slate-300 capitalize backdrop-blur-sm">
                      {g}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="text-3xl font-bold text-white leading-tight drop-shadow-lg">
                {entry.gameName}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dotClass}`} />
                <span className={`text-sm font-medium ${textClass}`}>{statusDisplay}</span>
              </div>
            </div>

            <div className="flex-shrink-0 pb-1">
              <HideGameButton entryId={entry.id} isHidden={entryHidden} />
            </div>
          </div>
        </div>
      </div>

      {/* Main two-column: journal (left) + details sidebar (right) */}
      <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Journal (2/3) ── */}
        <div className="lg:col-span-2">
          <RunManager
            shelfEntryId={entry.id}
            runs={runs}
            sessions={sessions}
            achievements={achievements}
          />
        </div>

        {/* ── Details sidebar (1/3) ── */}
        <div className="space-y-5">
          {/* Status / rating / notes */}
          <section className="rounded-lg border border-slate-700 bg-slate-900 p-5">
            <EditGamePanel
              entryId={entry.id}
              initialStatus={entry.status}
              initialReview={entry.review ?? null}
              initialRating={entry.rating}
              initialIsMultiplayer={
                ((entry as { isMultiplayer?: boolean }).isMultiplayer ?? false) ||
                ["MULTIPLAYER","MULTIPLAYER_ACTIVE","MULTIPLAYER_ON_BREAK","MULTIPLAYER_RETIRED"].includes(entry.status)
              }
            />
          </section>

          {/* Tags */}
          <section className="rounded-lg border border-slate-700 bg-slate-900 p-5">
            <TagManager entryId={entry.id} initialTags={entryTags} />
          </section>

          {/* Genres (read-only, from Steam) */}
          {entryGenres.length > 0 && (
            <section className="rounded-lg border border-slate-700 bg-slate-900 p-5">
              <p className="text-xs font-semibold text-slate-300 mb-3">Steam Genres</p>
              <div className="flex flex-wrap gap-1.5">
                {entryGenres.map((g) => (
                  <span key={g} className="rounded px-2 py-0.5 text-xs bg-slate-700 text-slate-400 capitalize">
                    {g}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Lists */}
          <section className="rounded-lg border border-slate-700 bg-slate-900 p-5">
            <AddToListPanel
              shelfEntryId={entry.id}
              initialLists={listSummaries}
              initialMemberIds={memberIds}
            />
          </section>

          {/* Remove game */}
          <DeleteGameButton
            entryId={entry.id}
            gameName={entry.gameName}
            hasSteamId={entry.steamAppId !== null}
          />
        </div>

      </div>
    </div>
    </div>
  );
}
