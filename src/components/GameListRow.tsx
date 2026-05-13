"use client";

import QuickStatusButton from "./QuickStatusButton";
import type { ShelfGame } from "./ShelfPage";

function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function GameListRow({ game }: { game: ShelfGame }) {
  // Priority: stored coverUrl (IGDB) → Steam CDN → initials placeholder
  const thumbUrl = game.coverUrl
    ?? (game.steamAppId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/capsule_sm_120.jpg` : null);
  const visibleTags = game.tags.slice(0, 3);
  const extra       = Math.max(0, game.tags.length - 3);

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 hover:border-slate-600 hover:bg-slate-800 transition-all duration-100 cursor-pointer">
      <div className="h-8 w-14 flex-shrink-0 rounded overflow-hidden bg-slate-800 flex items-center justify-center">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={game.name}
            className="h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <span className="text-[10px] font-bold text-zinc-500 select-none">{initials(game.name)}</span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <p className="text-[13px] font-medium text-slate-200 truncate">{game.name}</p>
        {!game.steamAppId && (
          <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/60 uppercase tracking-wide">
            {game.platform}
          </span>
        )}
      </div>

      <div className="hidden sm:flex gap-1 flex-shrink-0">
        {visibleTags.map((tag) => (
          <span key={tag} className="rounded px-1.5 py-0.5 text-[10px] bg-slate-700 text-slate-400 capitalize">
            {tag}
          </span>
        ))}
        {extra > 0 && (
          <span className="rounded px-1.5 py-0.5 text-[10px] text-slate-500">+{extra}</span>
        )}
      </div>

      <div className="flex-shrink-0">
        <QuickStatusButton
          entryId={game.id}
          currentStatus={game.status}
          isMultiplayer={game.isMultiplayer}
        />
      </div>

      <span className="text-[11px] text-slate-500 flex-shrink-0 w-10 text-right">{game.hours}h</span>
    </div>
  );
}
