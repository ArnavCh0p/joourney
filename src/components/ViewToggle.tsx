"use client";

type View = "grid" | "list";

type Props = {
  view: View;
  onChange: (v: View) => void;
};

export default function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="flex rounded-md border border-slate-600 overflow-hidden">
      <button
        onClick={() => onChange("grid")}
        title="Grid view"
        className={`px-2.5 py-1.5 transition-colors ${
          view === "grid" ? "bg-white text-slate-900" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
        }`}
      >
        {/* 2×2 grid icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="0" width="6" height="6" rx="1" />
          <rect x="8" y="0" width="6" height="6" rx="1" />
          <rect x="0" y="8" width="6" height="6" rx="1" />
          <rect x="8" y="8" width="6" height="6" rx="1" />
        </svg>
      </button>
      <button
        onClick={() => onChange("list")}
        title="List view"
        className={`px-2.5 py-1.5 border-l border-slate-600 transition-colors ${
          view === "list" ? "bg-white text-slate-900" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
        }`}
      >
        {/* 3-line list icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="1" width="14" height="2" rx="1" />
          <rect x="0" y="6" width="14" height="2" rx="1" />
          <rect x="0" y="11" width="14" height="2" rx="1" />
        </svg>
      </button>
    </div>
  );
}
