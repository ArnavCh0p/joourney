"use client";

const STATUSES = ["All", "Playing", "Completed", "Abandoned", "Backlog", "Replaying"];

type Props = {
  active: string;
  onSelect: (status: string) => void;
};

// Controlled filter bar — the parent owns the active state and passes it down.
export default function ShelfFilter({ active, onSelect }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            active === s
              ? "bg-zinc-100 text-zinc-900"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
