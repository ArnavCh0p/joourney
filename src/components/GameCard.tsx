const STATUS_COLORS: Record<string, string> = {
  Playing: "bg-green-800 text-green-200",
  Completed: "bg-blue-800 text-blue-200",
  Abandoned: "bg-red-900 text-red-300",
  Backlog: "bg-zinc-700 text-zinc-300",
  Replaying: "bg-purple-800 text-purple-200",
};

type Game = {
  id: string;
  name: string;
  status: string;
  rating: number | null;
  hours: number;
  cover: string | null;
};

export default function GameCard({ game }: { game: Game }) {
  const stars = game.rating ? "★".repeat(game.rating) + "☆".repeat(5 - game.rating) : null;

  return (
    <div className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600 transition-colors cursor-pointer">
      {/* Cover art placeholder */}
      <div className="h-20 w-14 flex-shrink-0 rounded bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs">
        {game.cover ? <img src={game.cover} alt={game.name} className="h-full w-full object-cover rounded" /> : "No art"}
      </div>

      <div className="flex flex-col justify-between min-w-0">
        <div>
          <p className="font-semibold text-white truncate">{game.name}</p>
          <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[game.status] ?? "bg-zinc-700 text-zinc-300"}`}>
            {game.status}
          </span>
        </div>
        <div className="mt-2 text-xs text-zinc-400 space-y-0.5">
          {stars && <p className="text-yellow-400 tracking-tight">{stars}</p>}
          <p>{game.hours}h played</p>
        </div>
      </div>
    </div>
  );
}
