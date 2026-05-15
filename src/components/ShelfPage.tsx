"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GameCard from "./GameCard";
import GameListRow from "./GameListRow";
import ShelfFilter from "./ShelfFilter";
import ViewToggle from "./ViewToggle";
import AddGameModal from "./AddGameModal";

export type ShelfGame = {
  id: string;
  steamAppId: number | null;
  coverUrl: string | null;
  platform: string;
  name: string;
  status: string;
  rating: number | null;
  hours: number;
  tags: string[];
  genres: string[];
  isHidden: boolean;
  isMultiplayer: boolean;
};

type View    = "grid" | "list";
type Size    = "S" | "M" | "L";
type SortKey = "updated" | "name" | "playtime-desc" | "playtime-asc" | "status" | "rating-desc";
type GroupBy = "none" | "status" | "genre" | "tag";

const GRID_COLS: Record<Size, string> = {
  S: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6",
  M: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  L: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3",
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updated",       label: "Recently updated" },
  { value: "rating-desc",   label: "Highest rated"    },
  { value: "name",          label: "Name (A–Z)"        },
  { value: "playtime-desc", label: "Most played"       },
  { value: "playtime-asc",  label: "Least played"      },
  { value: "status",        label: "Status"            },
];

const STATUS_ORDER = [
  "Playing", "Replaying", "Want to Play", "Completed",
  "Abandoned", "Active", "On Break", "Retired", "Untracked",
];

const STATUS_DOT: Record<string, string> = {
  Playing:        "bg-emerald-500",
  Replaying:      "bg-violet-500",
  "Want to Play": "bg-amber-500",
  Completed:      "bg-sky-500",
  Abandoned:      "bg-rose-500",
  Active:         "bg-blue-500",
  "On Break":     "bg-amber-500",
  Retired:        "bg-slate-500",
  Untracked:      "bg-slate-400",
};

function sortGames(games: ShelfGame[], key: SortKey): ShelfGame[] {
  return [...games].sort((a, b) => {
    switch (key) {
      case "name":          return a.name.localeCompare(b.name);
      case "playtime-desc": return b.hours - a.hours;
      case "playtime-asc":  return a.hours - b.hours;
      case "status":        return a.status.localeCompare(b.status) || a.name.localeCompare(b.name);
      case "rating-desc":   return (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name);
      default:              return 0;
    }
  });
}

export default function ShelfPage({ games, initialFilter, totalHours: totalHoursProp }: { games: ShelfGame[]; initialFilter?: string; totalHours?: number }) {
  const router = useRouter();

  const [activeFilter, setActiveFilter]     = useState(initialFilter ?? "All");
  const [activeGenres, setActiveGenres]     = useState<string[]>([]);
  const [activeUserTag, setActiveUserTag]   = useState<string | null>(null);
  const [groupBy, setGroupBy]               = useState<GroupBy>("none");
  const [splitPlaying, setSplitPlaying]     = useState(false);
  const [splitMp, setSplitMp]               = useState(true);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [view, setView]                     = useState<View>("grid");
  const [size, setSize]                     = useState<Size>("M");
  const [sortBy, setSortBy]                 = useState<SortKey>("updated");
  const [search, setSearch]                 = useState("");
  const [importing, setImporting]           = useState(false);
  const [importMessage, setImportMessage]   = useState<string | null>(null);
  const [importError, setImportError]       = useState(false);
  const [showAddModal, setShowAddModal]     = useState(false);
  const [editMode, setEditMode]             = useState(false);
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus]         = useState("UNTRACKED");
  const [bulkSaving, setBulkSaving]         = useState(false);

  useEffect(() => {
    const v  = localStorage.getItem("shelf-view")         as View    | null;
    const s  = localStorage.getItem("shelf-size")         as Size    | null;
    const k  = localStorage.getItem("shelf-sort")         as SortKey | null;
    const gb = localStorage.getItem("shelf-group-by")     as GroupBy | null;
    const sp = localStorage.getItem("shelf-split-playing");
    const sm = localStorage.getItem("shelf-split-mp");
    if (v === "list" || v === "grid") setView(v);
    if (s === "S" || s === "M" || s === "L") setSize(s);
    if (k) setSortBy(k as SortKey);
    if (gb) setGroupBy(gb as GroupBy);
    if (sp !== null) setSplitPlaying(sp === "true");
    if (sm !== null) setSplitMp(sm === "true");
  }, []);

  function handleViewChange(v: View)    { setView(v);   localStorage.setItem("shelf-view", v); }
  function handleSizeChange(s: Size)    { setSize(s);   localStorage.setItem("shelf-size", s); }
  function handleSortChange(k: SortKey) { setSortBy(k); localStorage.setItem("shelf-sort", k); }
  function handleGroupChange(g: GroupBy){ setGroupBy(g); localStorage.setItem("shelf-group-by", g); }

  function toggleSplitPlaying() {
    setSplitPlaying((v) => { localStorage.setItem("shelf-split-playing", String(!v)); return !v; });
  }
  function toggleSplitMp() {
    setSplitMp((v) => { localStorage.setItem("shelf-split-mp", String(!v)); return !v; });
  }

  function enterEditMode() { setEditMode(true);  setSelectedIds(new Set()); }
  function exitEditMode()  { setEditMode(false); setSelectedIds(new Set()); setBulkStatus("UNTRACKED"); }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function applyBulkStatus() {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    await fetch("/api/games/bulk-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selectedIds], status: bulkStatus }),
    });
    setBulkSaving(false);
    exitEditMode();
    router.refresh();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && editMode) exitEditMode(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editMode]);

  async function handleImport() {
    setImporting(true);
    setImportMessage(null);
    setImportError(false);
    try {
      const res  = await fetch("/api/import-library", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      const tagMsg = data.tagged > 0 ? `, genres fetched for ${data.tagged}` : "";
      setImportMessage(`${data.imported} games synced${tagMsg}`);
      router.refresh();
    } catch (err) {
      setImportError(true);
      setImportMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const allGenres = useMemo(() => {
    const counts: Record<string, number> = {};
    games.filter((g) => !g.isHidden).forEach((g) => g.genres.forEach((t) => { counts[t] = (counts[t] ?? 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [games]);

  const allUserTags = useMemo(() => {
    const counts: Record<string, number> = {};
    games.filter((g) => !g.isHidden).forEach((g) => g.tags.forEach((t) => { counts[t] = (counts[t] ?? 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [games]);

  const visibleGames = useMemo(() => {
    const filtered = games.filter((g) => {
      if (g.isHidden) return false;
      const statusOk = activeFilter === "All"
        || (activeFilter === "Currently Playing" ? (g.status === "Playing" || g.status === "Replaying")
        : activeFilter === "Multiplayer" ? g.isMultiplayer
        : g.status === activeFilter);
      const genreOk   = activeGenres.length === 0 || activeGenres.some((genre) => g.genres.includes(genre));
      const userTagOk = activeUserTag === null || g.tags.includes(activeUserTag);
      const searchOk  = !search || g.name.toLowerCase().includes(search.toLowerCase());
      return statusOk && genreOk && userTagOk && searchOk;
    });
    return sortGames(filtered, sortBy);
  }, [games, activeFilter, activeGenres, activeUserTag, sortBy, search]);

  const grouped = useMemo(() => {
    if (groupBy === "none") return null;
    const map: Record<string, ShelfGame[]> = {};
    for (const g of visibleGames) {
      let key: string;
      if (groupBy === "status")     key = g.status;
      else if (groupBy === "genre") key = g.genres[0] ?? "Untagged";
      else                          key = g.tags[0]   ?? "Untagged";
      (map[key] ??= []).push(g);
    }
    const entries = Object.entries(map);
    if (groupBy === "status") {
      return entries.sort(([a], [b]) => {
        const ai = STATUS_ORDER.indexOf(a), bi = STATUS_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    }
    return entries.sort(([a], [b]) => a.localeCompare(b));
  }, [visibleGames, groupBy]);

  function toggleGenre(genre: string) {
    setActiveGenres((prev) => prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]);
  }

  const activeFilterCount = activeGenres.length + (activeUserTag ? 1 : 0);
  const showCarousels = activeFilter === "All" && !search && groupBy === "none";

  const playingCount   = games.filter((g) => !g.isHidden && (g.status === "Playing" || g.status === "Replaying")).length;
  const completedCount = games.filter((g) => !g.isHidden && g.status === "Completed").length;
  const totalHours     = totalHoursProp ?? Math.round(games.filter((g) => !g.isHidden).reduce((sum, g) => sum + g.hours, 0));

  // ── Inner components ──────────────────────────────────────────────────────

  function SplitToggle({ isSplit, onToggle }: { isSplit: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        className="text-[10px] text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded px-1.5 py-0.5 transition-colors"
      >
        {isSplit ? "Combine" : "Split"}
      </button>
    );
  }

  function GameItem({ game }: { game: ShelfGame }) {
    const isSelected = selectedIds.has(game.id);

    if (editMode) {
      return (
        <div
          className={`relative cursor-pointer ${isSelected ? "ring-2 ring-emerald-500 rounded-xl" : ""}`}
          onClick={() => toggleSelect(game.id)}
        >
          <div className={`absolute top-2 left-2 z-20 h-5 w-5 rounded border-2 flex items-center justify-center
            ${isSelected ? "bg-emerald-500 border-emerald-500" : "border-slate-400 bg-slate-900/60"}`}
          >
            {isSelected && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          {view === "grid" ? <GameCard game={game} size={size} /> : <GameListRow game={game} />}
        </div>
      );
    }

    return (
      <Link href={`/games/${game.id}?from=${encodeURIComponent(activeFilter)}`} className="block">
        {view === "grid" ? <GameCard game={game} size={size} /> : <GameListRow game={game} />}
      </Link>
    );
  }

  function GameGrid({ items }: { items: ShelfGame[] }) {
    return view === "grid" ? (
      <div className={`grid gap-2 ${GRID_COLS[size]}`}>
        {items.map((g) => <GameItem key={g.id} game={g} />)}
      </div>
    ) : (
      <div className="flex flex-col gap-1.5">
        {items.map((g) => <GameItem key={g.id} game={g} />)}
      </div>
    );
  }

  function StatusCarousel({ label, statuses, dotClass, filterKey, splitControl }: {
    label: string;
    statuses: string[];
    dotClass: string;
    filterKey?: string;
    splitControl?: { isSplit: boolean; onToggle: () => void };
  }) {
    const items = visibleGames.filter((g) => statuses.includes(g.status));
    if (items.length === 0) return null;
    return (
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dotClass}`} />
            <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
            <span className="text-xs text-slate-500">({items.length})</span>
            {splitControl && <SplitToggle isSplit={splitControl.isSplit} onToggle={splitControl.onToggle} />}
          </div>
          {filterKey && (
            <button onClick={() => setActiveFilter(filterKey)} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
              See all →
            </button>
          )}
        </div>
        <div
          className="flex gap-3 overflow-x-auto scroll-smooth pt-2 pb-2
            [&::-webkit-scrollbar]:h-[3px]
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-slate-600
            [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {items.map((g) => (
            <Link key={g.id} href={`/games/${g.id}?from=${encodeURIComponent(activeFilter)}`} className="flex-shrink-0 w-36 block">
              <GameCard game={g} size="S" />
            </Link>
          ))}
        </div>
      </section>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {showAddModal && <AddGameModal onClose={() => setShowAddModal(false)} />}

      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">My Library</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={editMode ? exitEditMode : enterEditMode}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                editMode
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                  : "border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-slate-100"
              }`}
            >
              {editMode ? "✓ Editing" : "Edit"}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600 hover:text-slate-100 transition-colors"
            >
              + Add game
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600 hover:text-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {importing ? "Syncing…" : "↻ Sync Steam"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-700/60 px-2.5 py-1 text-xs text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            {games.filter((g) => !g.isHidden).length} games
          </span>
          {playingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400 ring-1 ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {playingCount} playing
            </span>
          )}
          {completedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-700/60 px-2.5 py-1 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {completedCount} completed
            </span>
          )}
          {totalHours > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-700/60 px-2.5 py-1 text-xs text-slate-400">
              {totalHours.toLocaleString()}h tracked
            </span>
          )}
        </div>

        {importMessage && (
          <p className={`mt-2 text-xs ${importError ? "text-rose-400" : "text-slate-500"}`}>{importMessage}</p>
        )}
      </div>

      {/* ── Search ── */}
      <div className="mb-3 relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search games…"
          className="w-full rounded-md border border-slate-600 bg-slate-700 py-1.5 pl-8 pr-8 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-400 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs">✕</button>
        )}
      </div>

      {/* ── Controls row ── */}
      <div className="flex flex-wrap items-center gap-2">
        <ShelfFilter active={activeFilter} onSelect={(s) => setActiveFilter(s)} />

        <div className="ml-auto flex items-center gap-2">
          {/* Filters */}
          <button
            onClick={() => setShowFilterPanel((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
              activeFilterCount > 0 || showFilterPanel
                ? "border-white bg-white text-slate-900"
                : "border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500"
            }`}
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
            <span className={`text-[9px] transition-transform ${showFilterPanel ? "rotate-180" : ""}`}>▾</span>
          </button>

          {/* Group by */}
          <select
            value={groupBy}
            onChange={(e) => handleGroupChange(e.target.value as GroupBy)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium focus:outline-none cursor-pointer transition-colors ${
              groupBy !== "none"
                ? "border-white bg-white text-slate-900"
                : "border-slate-600 bg-slate-700 text-slate-400 hover:text-slate-200 focus:border-slate-400"
            }`}
          >
            <option value="none">Group: None</option>
            <option value="status">Group: Status</option>
            <option value="genre">Group: Genre</option>
            <option value="tag">Group: My Tags</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortKey)}
            className="rounded-md border border-slate-600 bg-slate-700 px-2.5 py-1 text-xs text-slate-400 focus:outline-none focus:border-slate-400 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Size (grid only, non-carousel) */}
          {view === "grid" && !showCarousels && (
            <div className="flex rounded-md border border-slate-600 overflow-hidden">
              {(["S", "M", "L"] as Size[]).map((s) => (
                <button key={s} onClick={() => handleSizeChange(s)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors border-l border-slate-600 first:border-l-0 ${
                    size === s ? "bg-white text-slate-900" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {!showCarousels && <ViewToggle view={view} onChange={handleViewChange} />}
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilterPanel && (
        <div className="mt-2 rounded-lg border border-slate-600 bg-slate-700/60 p-4 space-y-4">

          {/* Genre */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400">Genre</p>
              {activeGenres.length > 0 && (
                <button onClick={() => setActiveGenres([])} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">Clear</button>
              )}
            </div>
            {allGenres.length === 0 ? (
              <p className="text-xs text-slate-600">Sync your library to populate genres.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allGenres.map((genre) => {
                  const active = activeGenres.includes(genre);
                  return (
                    <button key={genre} onClick={() => toggleGenre(genre)}
                      className={`rounded px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                        active ? "bg-white text-slate-900" : "bg-slate-700 border border-slate-600 text-slate-400 hover:text-slate-200 hover:bg-slate-600"
                      }`}
                    >
                      {active && <span className="mr-1">✓</span>}{genre}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Tags — always shown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400">My Tags</p>
              {activeUserTag && (
                <button onClick={() => setActiveUserTag(null)} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">Clear</button>
              )}
            </div>
            {allUserTags.length === 0 ? (
              <p className="text-xs text-slate-600">No tags yet — open a game to add tags.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allUserTags.map((tag) => (
                  <button key={tag} onClick={() => setActiveUserTag(activeUserTag === tag ? null : tag)}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                      activeUserTag === tag ? "bg-white text-slate-900" : "bg-slate-700 border border-slate-600 text-slate-400 hover:text-slate-200 hover:bg-slate-600"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {(activeGenres.length > 0 || activeUserTag) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {activeGenres.map((g) => (
            <span key={g} className="flex items-center gap-1 rounded-full border border-slate-600 bg-slate-700 px-2.5 py-0.5 text-[11px] text-slate-300 capitalize">
              {g}<button onClick={() => toggleGenre(g)} className="text-slate-500 hover:text-slate-200 leading-none ml-0.5">×</button>
            </span>
          ))}
          {activeUserTag && (
            <span className="flex items-center gap-1 rounded-full border border-slate-600 bg-slate-700 px-2.5 py-0.5 text-[11px] text-slate-300 capitalize">
              Tag: {activeUserTag}
              <button onClick={() => setActiveUserTag(null)} className="text-slate-500 hover:text-slate-200 leading-none ml-0.5">×</button>
            </span>
          )}
          <button onClick={() => { setActiveGenres([]); setActiveUserTag(null); }} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors ml-1">
            Clear all
          </button>
        </div>
      )}

      <div className="mt-4 border-t border-slate-700" />

      {/* ── Bulk edit banner ── */}
      {editMode && (
        <div className="sticky top-14 z-10 flex items-center gap-3 rounded-lg border border-slate-600
          bg-slate-800/95 backdrop-blur px-4 py-2.5 mt-4 mb-0 shadow-lg">
          <span className="text-sm text-slate-300 min-w-[6rem]">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => setSelectedIds(new Set(visibleGames.map((g) => g.id)))}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Select all
          </button>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="rounded-md border border-slate-600 bg-slate-700 px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="PLAYING">Playing</option>
              <option value="REPLAYING">Replaying</option>
              <option value="WANT_TO_PLAY">Want to Play</option>
              <option value="COMPLETED">Completed</option>
              <option value="ABANDONED">Abandoned</option>
              <option value="UNTRACKED">Untracked</option>
            </select>
            <button
              onClick={applyBulkStatus}
              disabled={selectedIds.size === 0 || bulkSaving}
              className="rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-3 py-1.5 text-sm font-medium text-white transition-colors"
            >
              {bulkSaving ? "Saving…" : "Apply"}
            </button>
            <button
              onClick={exitEditMode}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Games ── */}
      <div className="mt-4">
        {visibleGames.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">
              {search
                ? `No games matching "${search}".`
                : activeGenres.length > 0
                  ? `No ${activeFilter === "All" ? "" : activeFilter + " "}games in ${activeGenres.join(", ")}.`
                  : activeFilter === "Currently Playing"
                    ? "No games currently playing or replaying."
                    : `No games with status "${activeFilter}".`}
            </p>
          </div>

        ) : showCarousels ? (
          /* ── All view: status carousels ── */
          <div className="space-y-8">
            {splitPlaying ? (
              <>
                <StatusCarousel label="Playing"   statuses={["Playing"]}   dotClass="bg-emerald-500" filterKey="Currently Playing" splitControl={{ isSplit: true, onToggle: toggleSplitPlaying }} />
                <StatusCarousel label="Replaying" statuses={["Replaying"]} dotClass="bg-violet-500"  filterKey="Currently Playing" />
              </>
            ) : (
              <StatusCarousel label="Currently Playing" statuses={["Playing", "Replaying"]} dotClass="bg-emerald-500" filterKey="Currently Playing" splitControl={{ isSplit: false, onToggle: toggleSplitPlaying }} />
            )}

            <StatusCarousel label="Want to Play" statuses={["Want to Play"]} dotClass="bg-amber-500" filterKey="Want to Play" />
            <StatusCarousel label="Completed"    statuses={["Completed"]}    dotClass="bg-sky-500"   filterKey="Completed"    />
            <StatusCarousel label="Abandoned"    statuses={["Abandoned"]}    dotClass="bg-rose-500"  filterKey="Abandoned"    />

            {splitMp ? (
              <>
                <StatusCarousel label="Active"   statuses={["Active"]}   dotClass="bg-blue-500"  filterKey="Multiplayer" splitControl={{ isSplit: true, onToggle: toggleSplitMp }} />
                <StatusCarousel label="On Break" statuses={["On Break"]} dotClass="bg-amber-500" filterKey="Multiplayer" />
                <StatusCarousel label="Retired"  statuses={["Retired"]}  dotClass="bg-slate-500" filterKey="Multiplayer" />
              </>
            ) : (
              <StatusCarousel label="Multiplayer" statuses={["Active", "On Break", "Retired"]} dotClass="bg-blue-500" filterKey="Multiplayer" splitControl={{ isSplit: false, onToggle: toggleSplitMp }} />
            )}

            <StatusCarousel label="Untracked" statuses={["Untracked"]} dotClass="bg-slate-400" filterKey="Untracked" />
          </div>

        ) : grouped ? (
          /* ── Group-by view ── */
          <div className="space-y-6">
            {grouped.map(([groupLabel, items]) => (
              <section key={groupLabel}>
                <div className="flex items-center gap-2 mb-2">
                  {groupBy === "status" && (
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${STATUS_DOT[groupLabel] ?? "bg-slate-400"}`} />
                  )}
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 capitalize">{groupLabel}</h3>
                  <span className="text-slate-600 font-normal normal-case text-xs">({items.length})</span>
                </div>
                <GameGrid items={items} />
              </section>
            ))}
          </div>

        ) : (
          /* ── Default flat view ── */
          <GameGrid items={visibleGames} />
        )}
      </div>
    </div>
  );
}
