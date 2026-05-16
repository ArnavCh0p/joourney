"use client";

import { useRef } from "react";
import { openExternal } from "@/lib/openExternal";

export type TrendingGame = {
  id: number;
  name: string;
  imageUrl: string;
  inLibrary: boolean;
};

export default function TrendingCarousel({ games }: { games: TrendingGame[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? el.clientWidth * 0.8 : -el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Trending on Steam
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-700 text-slate-400 text-base hover:text-slate-100 hover:border-slate-500 transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-700 text-slate-400 text-base hover:text-slate-100 hover:border-slate-500 transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* Track — overflow hidden on wrapper, scrollable inside */}
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {games.map((game) => (
          <button
            key={game.id}
            type="button"
            onClick={() => openExternal(`https://store.steampowered.com/app/${game.id}`)}
            className="flex-shrink-0 w-44 group text-left"
          >
            <div className="relative rounded-lg overflow-hidden bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={game.imageUrl}
                alt={game.name}
                className="w-full object-cover"
              />
              {game.inLibrary && (
                <span className="absolute top-1.5 left-1.5 rounded bg-slate-900/85 px-1.5 py-0.5 text-[9px] font-semibold text-slate-200">
                  In library
                </span>
              )}
            </div>
            <p className="mt-2 text-xs font-medium text-slate-300 truncate group-hover:text-white transition-colors">
              {game.name}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
