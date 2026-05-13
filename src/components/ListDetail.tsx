"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Game = {
  shelfEntryId: string;
  addedAt: string;
  rank: number | null;
  steamAppId: number;
  gameName: string;
  status: string;
  rating: number | null;
  playtimeMinutes: number;
  tags: string[];
};

type SortBy = "added" | "name" | "rating" | "playtime" | "rank";

const STATUS_DISPLAY: Record<string, string> = {
  PLAYING:              "Playing",
  COMPLETED:            "Completed",
  ABANDONED:            "Abandoned",
  BACKLOG:              "Untracked",
  REPLAYING:            "Replaying",
  UNTRACKED:            "Untracked",
  WANT_TO_PLAY:         "Want to Play",
  MULTIPLAYER:          "Active",
  MULTIPLAYER_ACTIVE:   "Active",
  MULTIPLAYER_ON_BREAK: "On Break",
  MULTIPLAYER_RETIRED:  "Retired",
};

const STATUS_DOT: Record<string, string> = {
  Playing:        "bg-emerald-500",
  Completed:      "bg-sky-500",
  Abandoned:      "bg-rose-500",
  Replaying:      "bg-violet-500",
  Untracked:      "bg-slate-500",
  "Want to Play": "bg-amber-500",
  Active:         "bg-blue-500",
  "On Break":     "bg-amber-500",
  Retired:        "bg-slate-600",
};

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "added",   label: "Date Added" },
  { value: "name",    label: "Name" },
  { value: "rating",  label: "Rating" },
  { value: "playtime", label: "Playtime" },
  { value: "rank",    label: "My Ranking" },
];

export default function ListDetail({
  listId,
  initialGames,
}: {
  listId: string;
  initialGames: Game[];
}) {
  const [games, setGames]       = useState<Game[]>(initialGames);
  const [sortBy, setSortBy]     = useState<SortBy>("added");
  const [saving, setSaving]     = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rankInput, setRankInput] = useState("");

  const sorted = useMemo<Game[]>(() => {
    const arr = [...games];
    switch (sortBy) {
      case "name":
        return arr.sort((a, b) => a.gameName.localeCompare(b.gameName));
      case "rating":
        return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case "playtime":
        return arr.sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);
      case "rank":
        return arr.sort((a, b) => {
          if (a.rank == null && b.rank == null) return 0;
          if (a.rank == null) return 1;
          if (b.rank == null) return -1;
          return a.rank - b.rank;
        });
      default: // "added"
        return arr.sort(
          (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
    }
  }, [games, sortBy]);

  async function persistOrder(orderedGames: Game[]) {
    setSaving(true);
    try {
      await fetch(`/api/lists/${listId}/entries`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderedGames.map((g) => g.shelfEntryId) }),
      });
    } finally {
      setSaving(false);
    }
  }

  function applyOrder(orderedGames: Game[]) {
    // Update local ranks immediately (optimistic), then persist
    const rankMap = new Map(orderedGames.map((g, i) => [g.shelfEntryId, i + 1]));
    setGames((prev) => prev.map((g) => ({ ...g, rank: rankMap.get(g.shelfEntryId) ?? g.rank })));
    persistOrder(orderedGames);
  }

  function moveUp(index: number) {
    if (index === 0 || saving) return;
    const next = [...sorted];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    applyOrder(next);
  }

  function moveDown(index: number) {
    if (index === sorted.length - 1 || saving) return;
    const next = [...sorted];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    applyOrder(next);
  }

  function startRankEdit(gameId: string, currentIndex: number) {
    setEditingId(gameId);
    setRankInput(String(currentIndex + 1));
  }

  function commitRankEdit(gameId: string) {
    const n = parseInt(rankInput, 10);
    setEditingId(null);
    if (isNaN(n)) return;
    const clamped = Math.min(Math.max(n, 1), sorted.length);
    const fromIndex = sorted.findIndex((g) => g.shelfEntryId === gameId);
    if (fromIndex === clamped - 1) return;
    const next = [...sorted];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(clamped - 1, 0, moved);
    applyOrder(next);
  }

  function handleSortChange(next: SortBy) {
    setSortBy(next);
    // First time switching to rank: auto-initialize ranks from current addedAt order
    if (next === "rank" && games.every((g) => g.rank == null) && games.length > 0) {
      const initial = [...games].sort(
        (a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
      );
      applyOrder(initial);
    }
  }

  if (games.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        No games in this list yet. Add games from their detail page or with the ··· button on any game card.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-500">Sort</span>
        <div className="flex gap-1.5 flex-wrap">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                sortBy === opt.value
                  ? "bg-white text-slate-900"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {saving && <span className="text-[11px] text-slate-500">saving…</span>}
      </div>

      {/* Game rows */}
      <div className="space-y-1.5">
        {sorted.map((game, i) => {
          const statusDisplay = STATUS_DISPLAY[game.status] ?? game.status;
          const dotClass      = STATUS_DOT[statusDisplay] ?? "bg-slate-500";
          const hours         = Math.floor(game.playtimeMinutes / 60);

          return (
            <div
              key={game.shelfEntryId}
              className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-900 px-3 py-2.5 group"
            >

              {/* Cover art */}
              <Link href={`/games/${game.shelfEntryId}`} className="flex-shrink-0">
                <img
                  src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/capsule_sm_120.jpg`}
                  alt={game.gameName}
                  className="h-9 w-16 rounded object-cover bg-slate-800"
                />
              </Link>

              {/* Name + meta */}
              <Link href={`/games/${game.shelfEntryId}`} className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{game.gameName}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
                  <span className="text-xs text-slate-500">{statusDisplay}</span>
                  {hours > 0 && (
                    <span className="text-xs text-slate-600">{hours.toLocaleString()}h</span>
                  )}
                  {game.tags.map((tag) => (
                    <span key={tag} className="rounded px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-500 capitalize">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>

              {/* Rating stars */}
              {game.rating != null && (
                <span className="flex-shrink-0 text-xs text-amber-400/70 tracking-tight">
                  {"★".repeat(game.rating)}
                </span>
              )}

              {/* Rank stepper — same style as duration control */}
              {sortBy === "rank" && (
                <div className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={i === 0 || saving}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-slate-600 text-sm font-medium transition-colors select-none disabled:opacity-20"
                    aria-label="Move up"
                  >
                    −
                  </button>

                  {editingId === game.shelfEntryId ? (
                    <input
                      type="number"
                      min={1}
                      max={sorted.length}
                      value={rankInput}
                      autoFocus
                      onChange={(e) => setRankInput(e.target.value)}
                      onBlur={() => commitRankEdit(game.shelfEntryId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRankEdit(game.shelfEntryId);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-8 bg-transparent text-center text-sm text-slate-100 tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startRankEdit(game.shelfEntryId, i)}
                      title="Click to jump to position"
                      className="w-8 text-center text-sm text-slate-100 tabular-nums hover:text-white transition-colors"
                    >
                      {i + 1}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    disabled={i === sorted.length - 1 || saving}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-slate-600 text-sm font-medium transition-colors select-none disabled:opacity-20"
                    aria-label="Move down"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
