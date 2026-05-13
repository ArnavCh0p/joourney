"use client";

import QuickStatusButton from "./QuickStatusButton";
import QuickActionsMenu from "./QuickActionsMenu";

type Size = "S" | "M" | "L";

type Game = {
  id: string;
  steamAppId: number | null;
  coverUrl: string | null;
  platform: string;
  name: string;
  status: string;
  rating: number | null;
  hours: number;
  tags: string[];
  isMultiplayer: boolean;
};

function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function GameCard({ game, size = "M" }: { game: Game; size?: Size }) {
  // Priority: stored coverUrl (IGDB) → Steam CDN → initials placeholder
  const portraitUrl = game.coverUrl
    ?? (game.steamAppId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/library_600x900.jpg` : null);
  const fallbackUrl = game.steamAppId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/header.jpg`
    : null;

  const stars     = game.rating ? "★".repeat(game.rating) : null;
  const showTags  = size !== "S" && game.tags.length > 0;
  const tagLimit  = size === "L" ? 3 : 2;
  const extraTags = Math.max(0, game.tags.length - tagLimit);

  return (
    // No overflow-hidden on the outer div so the QuickActionsMenu dropdown can escape.
    // The image div uses rounded-t-xl overflow-hidden to clip the artwork instead.
    <div className="group relative rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">

      {/* Portrait art */}
      <div className="aspect-[2/3] relative overflow-hidden bg-slate-100 rounded-t-xl">
        {portraitUrl ? (
          <img
            src={portraitUrl}
            alt={game.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            onError={(e) => { if (fallbackUrl) (e.currentTarget as HTMLImageElement).src = fallbackUrl; }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
            <span className={`font-bold text-zinc-500 select-none ${size === "S" ? "text-xl" : "text-3xl"}`}>
              {initials(game.name)}
            </span>
          </div>
        )}

        {/* Gradient so info at bottom is legible */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Hours — bottom left, over gradient. Hidden when 0 (manually added games). */}
        {game.hours > 0 && (
          <span className="absolute bottom-2.5 left-3 text-[11px] text-white/70 font-medium">
            {game.hours}h
          </span>
        )}

        {/* Rating — bottom right */}
        {stars && (
          <span className="absolute bottom-2.5 right-3 text-[11px] text-amber-400">
            {stars}
          </span>
        )}
      </div>

      {/* Quick actions — overlaid top-right */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <QuickActionsMenu entryId={game.id} currentTags={game.tags} />
      </div>

      {/* Info below art */}
      <div className="px-3 pt-2.5 pb-3 space-y-1.5">
        <div className="flex items-start justify-between gap-1">
          <p className={`font-semibold text-slate-900 leading-snug truncate ${size === "S" ? "text-xs" : "text-[13px]"}`}>
            {game.name}
          </p>
          {/* Platform badge — only for manually added games (no Steam ID) */}
          {!game.steamAppId && (
            <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/60 uppercase tracking-wide">
              {game.platform}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <QuickStatusButton entryId={game.id} currentStatus={game.status} isMultiplayer={game.isMultiplayer} variant="light" />
        </div>

        {showTags && (
          <div className="flex gap-1 flex-wrap">
            {game.tags.slice(0, tagLimit).map((tag) => (
              <span key={tag} className="rounded px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 capitalize">
                {tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="rounded px-1.5 py-0.5 text-[10px] text-slate-400">+{extraTags}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
