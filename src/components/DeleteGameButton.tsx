"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  entryId: string;
  gameName: string;
  hasSteamId: boolean;
};

export default function DeleteGameButton({ entryId, gameName, hasSteamId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [error, setError]           = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/games/${entryId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");
      router.push("/library");
    } catch {
      setError("Something went wrong. Try again.");
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-slate-600 hover:text-rose-400 transition-colors"
      >
        Remove game…
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-4 space-y-3">
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-slate-200">Remove &ldquo;{gameName}&rdquo;?</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          This permanently deletes all journal entries, sessions, and screenshots for this game.
          {hasSteamId && (
            <span className="block mt-1 text-amber-400/80">
              Since this is a Steam game, it will reappear the next time your library syncs. Consider hiding it instead.
            </span>
          )}
        </p>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-40 transition-colors"
        >
          {deleting ? "Deleting…" : "Yes, delete everything"}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(""); }}
          disabled={deleting}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
