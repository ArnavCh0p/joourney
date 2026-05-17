"use client";

import { useState } from "react";
import Link from "next/link";
import GameCard from "./GameCard";

type PlayingGame = {
  id: string;
  steamAppId: number | null;
  name: string;
  status: string;
  rating: number | null;
  hours: number;
  coverUrl: string | null;
  platform: string;
  tags: string[];
  isMultiplayer: boolean;
};

const PAGE_SIZE = 6;

export default function PlayingCarousel({ games }: { games: PlayingGame[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(games.length / PAGE_SIZE);
  const slice = games.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {slice.map((g) => (
          <Link key={g.id} href={`/games/${g.id}`} className="block">
            <GameCard game={g} size="S" />
          </Link>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-500 tabular-nums">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
            className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
