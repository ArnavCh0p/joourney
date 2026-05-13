"use client";

const STATUSES = ["All", "Currently Playing", "Multiplayer", "Want to Play", "Completed", "Abandoned", "Untracked"];

const ACTIVE_STYLES: Record<string, string> = {
  All:                 "bg-white text-slate-900",
  "Currently Playing": "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30",
  Multiplayer:         "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30",
  "Want to Play":      "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30",
  Completed:           "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30",
  Abandoned:           "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30",
  Untracked:           "bg-slate-600 text-slate-300 ring-1 ring-slate-500",
};

type Props = {
  active: string;
  onSelect: (status: string) => void;
};

export default function ShelfFilter({ active, onSelect }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-100 ${
            active === s
              ? (ACTIVE_STYLES[s] ?? "bg-white text-slate-900")
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
