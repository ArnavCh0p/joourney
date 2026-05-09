"use client";

import { useState } from "react";
import GameCard from "@/components/GameCard";
import ShelfFilter from "@/components/ShelfFilter";

const PLACEHOLDER_GAMES = [
  { id: 1, name: "Elden Ring", status: "Completed", rating: 5, hours: 87, cover: null },
  { id: 2, name: "Hollow Knight", status: "Playing", rating: 4, hours: 32, cover: null },
  { id: 3, name: "Cyberpunk 2077", status: "Abandoned", rating: 3, hours: 14, cover: null },
  { id: 4, name: "Hades", status: "Completed", rating: 5, hours: 120, cover: null },
  { id: 5, name: "Dark Souls III", status: "Backlog", rating: null, hours: 0, cover: null },
];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("All");

  // "All" shows every game; any other status shows only matching games.
  const visibleGames =
    activeFilter === "All"
      ? PLACEHOLDER_GAMES
      : PLACEHOLDER_GAMES.filter((g) => g.status === activeFilter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Shelf</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Sign in with Steam to import your library and start journaling.
          </p>
        </div>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
          + Add Game
        </button>
      </div>

      <ShelfFilter active={activeFilter} onSelect={setActiveFilter} />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
