"use client";

import { useState } from "react";
import Link from "next/link";
import GameCard from "./GameCard";
import ShelfFilter from "./ShelfFilter";

export type ShelfGame = {
  id: string;
  name: string;
  status: string;
  rating: number | null;
  hours: number;
  cover: string | null;
};

export default function ShelfPage({ games }: { games: ShelfGame[] }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const visibleGames =
    activeFilter === "All"
      ? games
      : games.filter((g) => g.status === activeFilter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Shelf</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {games.length} {games.length === 1 ? "game" : "games"} tracked
          </p>
        </div>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
          + Add Game
        </button>
      </div>

      <ShelfFilter active={activeFilter} onSelect={setActiveFilter} />

      {visibleGames.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-500">
          No games with status &ldquo;{activeFilter}&rdquo; yet.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleGames.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`} className="block">
              <GameCard game={game} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
