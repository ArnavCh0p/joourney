"use client";

import { useState } from "react";
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
  const normalizedStatus = initialStatus === "BACKLOG" ? "UNTRACKED"
    : initialStatus === "MULTIPLAYER" ? "MULTIPLAYER_ACTIVE"
    : initialStatus;

  const [isMultiplayer, setIsMultiplayer] = useState(initialIsMultiplayer);
  const [status, setStatus]   = useState(normalizedStatus);
  const [review, setReview]   = useState(initialReview ?? "");
  const [rating, setRating]   = useState<number | null>(initialRating);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function handleToggleMultiplayer(newValue: boolean) {
    setIsMultiplayer(newValue);
    setSaved(false);
    if (newValue && !MULTIPLAYER_STATUS_VALUES.has(status)) {
      setStatus("MULTIPLAYER_ACTIVE");
    } else if (!newValue && MULTIPLAYER_STATUS_VALUES.has(status)) {
      setStatus("UNTRACKED");
    }
  }

  async function handleSave() {
    setSaving(true);
    setErrorMsg("");
    setSaved(false);
    try {
      const res = await fetch(`/api/games/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, review, rating, isMultiplayer }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
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
          onChange={(e) => { setStatus(e.target.value); setSaved(false); }}
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
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { setRating(rating === n ? null : n); setSaved(false); }}
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
              onClick={() => { setRating(null); setSaved(false); }}
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
          onChange={(e) => { setReview(e.target.value); setSaved(false); }}
          placeholder="Verdict, overall impression…"
          className="w-full min-h-[80px] resize-none rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved    && <span className="text-xs text-slate-500">Saved</span>}
        {errorMsg && <span className="text-xs text-rose-400">{errorMsg}</span>}
      </div>
    </div>
  );
}
