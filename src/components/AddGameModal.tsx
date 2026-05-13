"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { IGDBResult } from "@/lib/igdb";

const PLATFORMS = ["Steam", "PC", "PlayStation", "Xbox", "Nintendo", "Other"] as const;

const SP_STATUSES: { value: string; label: string }[] = [
  { value: "UNTRACKED",    label: "Untracked"    },
  { value: "WANT_TO_PLAY", label: "Want to Play" },
  { value: "PLAYING",      label: "Playing"      },
  { value: "COMPLETED",    label: "Completed"    },
  { value: "ABANDONED",    label: "Abandoned"    },
];

const MP_STATUSES: { value: string; label: string }[] = [
  { value: "MULTIPLAYER_ACTIVE",   label: "Active"   },
  { value: "MULTIPLAYER_ON_BREAK", label: "On Break" },
  { value: "MULTIPLAYER_RETIRED",  label: "Retired"  },
  { value: "UNTRACKED",            label: "Untracked" },
];

function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function AddGameModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const [title, setTitle]             = useState("");
  const [platform, setPlatform]       = useState("PC");
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [status, setStatus]           = useState("UNTRACKED");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  // IGDB selection
  const [igdbId, setIgdbId]     = useState<number | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Search — driven by searchQuery, separate from title so selection
  // doesn't re-trigger the debounce
  const [searchQuery, setSearchQuery]   = useState("");
  const [results, setResults]           = useState<IGDBResult[]>([]);
  const [searching, setSearching]       = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // When multiplayer toggle changes, reset status to the first option
  useEffect(() => {
    setStatus(isMultiplayer ? "MULTIPLAYER_ACTIVE" : "UNTRACKED");
  }, [isMultiplayer]);

  // Debounced IGDB search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowDropdown(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/igdb/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json() as IGDBResult[];
        setResults(data);
        setShowDropdown(data.length > 0);
      } catch {
        setResults([]);
        setShowDropdown(false);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { clearTimeout(t); };
  }, [searchQuery]);

  function handleTitleChange(v: string) {
    setTitle(v);
    setSearchQuery(v);
    // typing after a selection clears the IGDB data
    setIgdbId(null);
    setCoverUrl(null);
  }

  function selectResult(r: IGDBResult) {
    setTitle(r.name);
    setPlatform(r.platform);
    setCoverUrl(r.coverUrl);
    setIgdbId(r.igdbId);
    setShowDropdown(false);
    setResults([]);
    inputRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:         title.trim(),
          platform,
          status,
          isMultiplayer,
          coverUrl:      coverUrl  ?? undefined,
          igdbId:        igdbId    ?? undefined,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed to add game");
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const statuses = isMultiplayer ? MP_STATUSES : SP_STATUSES;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm mx-4 rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-100">Add a game</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title + IGDB search dropdown */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Title</label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Search or enter a title…"
                autoFocus
                autoComplete="off"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none pr-8"
              />
              {searching && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-slate-500 border-t-transparent animate-spin" />
              )}

              {showDropdown && results.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-slate-600 bg-slate-800 shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                  {results.map((r) => (
                    <button
                      key={r.igdbId}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); selectResult(r); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-slate-700 transition-colors text-left"
                    >
                      <div className="w-7 h-10 flex-shrink-0 rounded overflow-hidden bg-zinc-800 flex items-center justify-center">
                        {r.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[8px] font-bold text-zinc-500 select-none">{initials(r.name)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-100 truncate">{r.name}</p>
                        <p className="text-xs text-slate-500">{r.platform}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cover preview after IGDB selection */}
            {coverUrl && (
              <div className="flex items-center gap-2 mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt="" className="h-9 w-6 rounded object-cover flex-shrink-0" />
                <span className="text-xs text-slate-400 flex-1">Cover from IGDB</span>
                <button type="button" onClick={() => { setCoverUrl(null); setIgdbId(null); }}
                  className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-400 focus:outline-none cursor-pointer">
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Multiplayer toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Multiplayer / live service game</span>
            <button
              type="button"
              onClick={() => setIsMultiplayer((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${isMultiplayer ? "bg-blue-600" : "bg-slate-600"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isMultiplayer ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-400 focus:outline-none cursor-pointer">
              {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-white text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-40 transition-colors">
              {saving ? "Adding…" : "Add game"}
            </button>
            <button type="button" onClick={onClose}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
