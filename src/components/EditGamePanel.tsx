"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SINGLEPLAYER_STATUSES = [
  { value: "UNTRACKED",    label: "Untracked"    },
  { value: "WANT_TO_PLAY", label: "Want to Play" },
  { value: "PLAYING",      label: "Playing"      },
  { value: "REPLAYING",    label: "Replaying"    },
  { value: "COMPLETED",    label: "Completed"    },
  { value: "ABANDONED",    label: "Abandoned"    },
];

const MULTIPLAYER_STATUSES = [
  { value: "MULTIPLAYER_ACTIVE",   label: "Active"    },
  { value: "MULTIPLAYER_ON_BREAK", label: "On Break"  },
  { value: "MULTIPLAYER_RETIRED",  label: "Retired"   },
  { value: "UNTRACKED",            label: "Untracked" },
];

const MULTIPLAYER_STATUS_VALUES = new Set([
  "MULTIPLAYER", "MULTIPLAYER_ACTIVE", "MULTIPLAYER_ON_BREAK", "MULTIPLAYER_RETIRED",
]);

type Props = {
  entryId: string;
  initialStatus: string;
  initialReview: string | null;
  initialRating: number | null;
  initialIsMultiplayer: boolean;
};

export default function EditGamePanel({
  entryId, initialStatus, initialReview, initialRating, initialIsMultiplayer,
}: Props) {
  const router = useRouter();
  const normalizedStatus = initialStatus === "BACKLOG"     ? "UNTRACKED"
    : initialStatus === "MULTIPLAYER" ? "MULTIPLAYER_ACTIVE"
    : initialStatus;

  const [isMultiplayer, setIsMultiplayer] = useState(initialIsMultiplayer);
  const [status, setStatus] = useState(normalizedStatus);
  const [review, setReview] = useState(initialReview ?? "");
  const [rating, setRating] = useState<number | null>(initialRating);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(patch: Record<string, unknown>, withRefresh = false) {
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSaveState("saving");
    try {
      const res = await fetch(`/api/games/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      setSaveState("saved");
      if (withRefresh) router.refresh();
      savedTimer.current = setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("error");
    }
  }

  function handleToggleMultiplayer(newValue: boolean) {
    setIsMultiplayer(newValue);
    let newStatus = status;
    if (newValue && !MULTIPLAYER_STATUS_VALUES.has(status)) {
      newStatus = "MULTIPLAYER_ACTIVE";
      setStatus(newStatus);
    } else if (!newValue && MULTIPLAYER_STATUS_VALUES.has(status)) {
      newStatus = "UNTRACKED";
      setStatus(newStatus);
    }
    save({ isMultiplayer: newValue, status: newStatus }, true);
  }

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    save({ status: newStatus }, true);
  }

  function handleRatingClick(n: number) {
    const newRating = rating === n ? null : n;
    setRating(newRating);
    save({ rating: newRating });
  }

  function handleReviewChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setReview(val);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => save({ review: val }), 600);
  }

  const statusOptions = isMultiplayer ? MULTIPLAYER_STATUSES : SINGLEPLAYER_STATUSES;

  return (
    <div className="space-y-4">
      {/* Multiplayer toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-400">Game type</label>
        <div className="flex rounded-md border border-slate-600 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => handleToggleMultiplayer(false)}
            className={`px-3 py-1.5 font-medium transition-colors ${
              !isMultiplayer ? "bg-white text-slate-900" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            }`}
          >
            Single-player
          </button>
          <button
            type="button"
            onClick={() => handleToggleMultiplayer(true)}
            className={`px-3 py-1.5 font-medium transition-colors border-l border-slate-600 ${
              isMultiplayer ? "bg-white text-slate-900" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            }`}
          >
            Multiplayer
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-400">Status</label>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-full appearance-none rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-slate-400 focus:outline-none"
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Rating */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-400">Rating</label>
        <div className="flex gap-1 items-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleRatingClick(n)}
              className={`text-xl leading-none transition-colors ${
                n <= (rating ?? 0) ? "text-amber-400" : "text-slate-600 hover:text-slate-400"
              }`}
            >
              ★
            </button>
          ))}
          {rating !== null && (
            <button
              type="button"
              onClick={() => { setRating(null); save({ rating: null }); }}
              className="ml-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              clear
            </button>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-400">Overall notes</label>
        <textarea
          value={review}
          onChange={handleReviewChange}
          placeholder="Verdict, overall impression…"
          className="w-full min-h-[80px] resize-none rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-400 focus:outline-none"
        />
      </div>

      {/* Auto-save indicator */}
      <div className="h-4">
        {saveState === "saving" && <span className="text-xs text-slate-600">Saving…</span>}
        {saveState === "saved"  && <span className="text-xs text-slate-500">Saved</span>}
        {saveState === "error"  && <span className="text-xs text-rose-400">Failed to save</span>}
      </div>
    </div>
  );
}
