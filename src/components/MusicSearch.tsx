"use client";
import { useState, useEffect, useRef } from "react";
import type { MusicResult } from "@/app/api/music/search/route";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function parseMusicValue(raw: string): MusicResult | null {
  try { return JSON.parse(raw); } catch { return null; }
}

export default function MusicSearch({ value, onChange, placeholder, className }: Props) {
  const parsed = parseMusicValue(value);
  const [query, setQuery]     = useState(parsed?.name ?? value);
  const [results, setResults] = useState<MusicResult[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce              = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // When a structured value comes in from the parent (e.g. edit mode reset), sync display name
  useEffect(() => {
    const p = parseMusicValue(value);
    setQuery(p ? p.name : value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); setOpen(false); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
        const data: MusicResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [query]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    // While typing, pass the raw string so the parent doesn't hold stale JSON
    onChange(v);
  }

  function select(r: MusicResult) {
    setQuery(r.name);
    setOpen(false);
    onChange(JSON.stringify(r));
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? "Search for a song or album…"}
        className={className ?? "w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"}
      />
      {loading && (
        <span className="absolute right-3 top-2 text-[11px] text-slate-500 pointer-events-none">
          searching…
        </span>
      )}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-slate-700 bg-slate-800 shadow-xl overflow-hidden">
          {results.map((r) => (
            <button
              key={r.id}
              onMouseDown={() => select(r)}
              className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-slate-700 transition-colors text-left"
            >
              {r.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.imageUrl} alt="" className="h-9 w-9 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="h-9 w-9 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
                    <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{r.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {r.artist}{r.album ? ` · ${r.album}` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
