"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SP_STATUSES = [
  { enum: "UNTRACKED",    label: "Untracked",    dot: "bg-slate-400"   },
  { enum: "WANT_TO_PLAY", label: "Want to Play", dot: "bg-amber-500"   },
  { enum: "PLAYING",      label: "Playing",      dot: "bg-emerald-500" },
  { enum: "REPLAYING",    label: "Replaying",    dot: "bg-violet-500"  },
  { enum: "COMPLETED",    label: "Completed",    dot: "bg-sky-500"     },
  { enum: "ABANDONED",    label: "Abandoned",    dot: "bg-rose-500"    },
];

const MP_STATUSES = [
  { enum: "MULTIPLAYER_ACTIVE",   label: "Active",    dot: "bg-blue-500"   },
  { enum: "MULTIPLAYER_ON_BREAK", label: "On Break",  dot: "bg-amber-500"  },
  { enum: "MULTIPLAYER_RETIRED",  label: "Retired",   dot: "bg-slate-600"  },
  { enum: "UNTRACKED",            label: "Untracked", dot: "bg-slate-400"  },
];

// Map old/new display labels to their dot color for the button face
const DOT_BY_LABEL: Record<string, string> = {
  Untracked:      "bg-slate-400",
  "Want to Play": "bg-amber-500",
  Playing:        "bg-emerald-500",
  Replaying:      "bg-violet-500",
  Completed:      "bg-sky-500",
  Abandoned:      "bg-rose-500",
  Active:         "bg-blue-500",
  "On Break":     "bg-amber-500",
  Retired:        "bg-slate-600",
  Multiplayer:    "bg-blue-500",
};

type Props = {
  entryId: string;
  currentStatus: string;
  isMultiplayer: boolean;
  variant?: "dark" | "light";
};

export default function QuickStatusButton({ entryId, currentStatus, isMultiplayer, variant = "dark" }: Props) {
  const router = useRouter();
  const [open, setOpen]     = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const containerRef        = useRef<HTMLDivElement>(null);

  const dot = DOT_BY_LABEL[status] ?? "bg-slate-400";
  const options = isMultiplayer ? MP_STATUSES : SP_STATUSES;

  // Close on outside mousedown so other dropdowns can open in the same click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
  }

  async function pick(e: React.MouseEvent, chosen: (typeof SP_STATUSES)[number]) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    if (chosen.label === status) return;
    setSaving(true);
    try {
      await fetch(`/api/games/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: chosen.enum, isMultiplayer }),
      });
      setStatus(chosen.label);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const isDark = variant === "dark";

  return (
    <div ref={containerRef} className="relative" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <button
        onClick={toggle}
        disabled={saving}
        title="Change status"
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 transition-colors disabled:opacity-40 ${
          isDark
            ? "border-slate-600 bg-slate-800 hover:bg-slate-700 hover:border-slate-500"
            : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dot}`} />
        <span className={`text-[11px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{status}</span>
        <span className={`text-[9px] ml-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>▾</span>
      </button>

      {open && (
        <div className={`absolute bottom-full left-0 mb-1.5 z-30 min-w-[140px] rounded-lg border py-1 shadow-xl ${
            isDark
              ? "border-slate-700 bg-slate-800"
              : "border-slate-200 bg-white"
          }`}>
            {options.map((s) => (
              <button
                key={s.enum}
                onClick={(e) => pick(e, s)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                  isDark ? "hover:bg-slate-700" : "hover:bg-slate-50"
                } ${s.label === status ? (isDark ? "bg-slate-700/60" : "bg-slate-50") : ""}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>{s.label}</span>
                {s.label === status && <span className={`ml-auto ${isDark ? "text-slate-500" : "text-slate-400"}`}>✓</span>}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
