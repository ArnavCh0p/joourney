// Server component — reads the ShelfEntry and its Sessions from Prisma,
// then renders them alongside the client-side LogSessionForm.

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogSessionForm from "@/components/LogSessionForm";

const STATUS_DISPLAY: Record<string, string> = {
  PLAYING: "Playing",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
  BACKLOG: "Backlog",
  REPLAYING: "Replaying",
};

const STATUS_COLORS: Record<string, string> = {
  Playing: "bg-green-800 text-green-200",
  Completed: "bg-blue-800 text-blue-200",
  Abandoned: "bg-red-900 text-red-300",
  Backlog: "bg-zinc-700 text-zinc-300",
  Replaying: "bg-purple-800 text-purple-200",
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Params = { id: string };

export default async function GameDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/");
  }

  const steamId = (session.user as { steamId?: string }).steamId;
  if (!steamId) redirect("/");

  // Fetch the shelf entry and verify it belongs to this user.
  // Include sessions ordered newest-first for the session log.
  const entry = await prisma.shelfEntry.findUnique({
    where: { id },
    include: {
      user: { select: { steamId: true } },
      sessions: { orderBy: { date: "desc" } },
    },
  });

  // 404 if the entry doesn't exist or belongs to a different user.
  if (!entry || entry.user.steamId !== steamId) {
    notFound();
  }

  const statusDisplay = STATUS_DISPLAY[entry.status] ?? entry.status;
  const statusColor = STATUS_COLORS[statusDisplay] ?? "bg-zinc-700 text-zinc-300";
  const stars = entry.rating
    ? "★".repeat(entry.rating) + "☆".repeat(5 - entry.rating)
    : null;
  const coverUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${entry.steamAppId}/header.jpg`;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        ← My Shelf
      </Link>

      {/* Game header */}
      <div className="flex gap-6 items-start">
        <img
          src={coverUrl}
          alt={entry.gameName}
          className="w-48 rounded-lg object-cover flex-shrink-0 bg-zinc-800"
          onError={undefined}
        />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">{entry.gameName}</h1>
          <span
            className={`inline-block rounded px-2 py-0.5 text-sm font-medium ${statusColor}`}
          >
            {statusDisplay}
          </span>
          {stars && (
            <p className="text-yellow-400 text-lg tracking-tight">{stars}</p>
          )}
          {entry.review && (
            <p className="text-zinc-300 text-sm max-w-prose">{entry.review}</p>
          )}
        </div>
      </div>

      {/* Session log */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Session Log</h2>

        {entry.sessions.length === 0 ? (
          <p className="text-sm text-zinc-500 mb-6">No sessions logged yet.</p>
        ) : (
          <ul className="space-y-3 mb-6">
            {entry.sessions.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
              >
                <p className="text-sm font-medium text-zinc-300">
                  {formatDate(s.date)}
                </p>
                {s.notes ? (
                  <p className="mt-1 text-sm text-zinc-400 whitespace-pre-wrap">
                    {s.notes}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-zinc-600 italic">No notes</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Log a new session */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-base font-semibold text-white mb-4">
            Log a session
          </h3>
          <LogSessionForm shelfEntryId={entry.id} />
        </div>
      </section>
    </div>
  );
}
