"use client";
import { useState, useEffect, useRef } from "react";
import type { MusicResult } from "@/app/api/music/search/route";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function parseValue(raw: string): MusicResult[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && parsed.id) return [parsed];
  } catch { /* plain text — can't represent as chips */ }
  return [];
}

function TrackImage({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);
  const icon = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
      <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
    </svg>
  );
  if (!url || failed) {
    return (
      <div className="h-9 w-9 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
    );
  }
  return (
    <div className="h-9 w-9 rounded bg-slate-700 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
      {icon}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function MusicSearch({ value, onChange, placeholder }: Props) {
  const [selected, setSelected] = useState<MusicResult[]>(() => parseValue(value));
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<MusicResult[]>([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const debounce                = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sync when parent resets the value (e.g. after form submit clears music to "")
  useEffect(() => {
    const tracks = parseValue(value);
    setSelected(tracks);
    if (!value) setQuery("");
  }, [value]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setOpen(false);
      return;
    }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
        const data: MusicResult[] = await res.json();
        // Replace results only when the new batch arrives — no intermediate flash
        setResults(data);
        setOpen(data.length > 0);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [query]);

  function addTrack(r: MusicResult) {
    if (selected.some((t) => t.id === r.id)) { setOpen(false); return; }
    const next = [...selected, r];
    setSelected(next);
    onChange(JSON.stringify(next));
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function removeTrack(id: string) {
    const next = selected.filter((t) => t.id !== id);
    setSelected(next);
    onChange(next.length > 0 ? JSON.stringify(next) : "");
  }

  return (
    <div className="space-y-2">
      {/* Selected tracks as chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-800 pl-1.5 pr-1 py-1 max-w-full"
            >
              <TrackImage url={t.imageUrl} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 truncate leading-tight">{t.name}</p>
                <p className="text-[11px] text-slate-500 truncate leading-tight">{t.artist}</p>
              </div>
              <button
                type="button"
                onClick={() => removeTrack(t.id)}
                className="ml-1 flex-shrink-0 text-slate-500 hover:text-slate-200 transition-colors text-base leading-none px-0.5"
                aria-label={`Remove ${t.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder ?? "Search for a track…"}
          className="w-full rounded-lg border border-slate-600 bg-slate-700 pl-8 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
        />
        {loading && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
            searching…
          </span>
        )}

        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-slate-700 bg-slate-800 shadow-xl overflow-hidden">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onMouseDown={() => addTrack(r)}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-slate-700 transition-colors text-left"
              >
                <TrackImage url={r.imageUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{r.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {r.artist}{r.album ? ` · ${r.album}` : ""}
                  </p>
                </div>
                {selected.some((t) => t.id === r.id) && (
                  <span className="text-[10px] text-emerald-500 flex-shrink-0">added</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
