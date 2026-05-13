"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SYNC_COOLDOWN_MS = 60 * 1000; // 1 minute between auto-syncs
const STORAGE_KEY = "joourney-last-sync";

type Result = { imported: number; sessionsCreated?: number; restricted?: boolean; error?: string };

export default function AutoSync() {
  const router  = useRouter();
  const fired   = useRef(false);
  const [phase,  setPhase]  = useState<"idle" | "syncing" | "done">("idle");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const last = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0");
    if (Date.now() - last < SYNC_COOLDOWN_MS) return;

    setPhase("syncing");
    localStorage.setItem(STORAGE_KEY, String(Date.now()));

    fetch("/api/import-library", { method: "POST" })
      .then((r) => r.json())
      .then((data: Result) => {
        setResult(data);
        setPhase("done");
        router.refresh();
        setTimeout(() => setPhase("idle"), 6000);
      })
      .catch(() => {
        setResult({ imported: 0, error: "Sync failed" });
        setPhase("done");
        setTimeout(() => setPhase("idle"), 4000);
      });
  }, [router]);

  if (phase === "idle") return null;

  if (phase === "syncing") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-700/60 px-3 py-2 text-xs text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-pulse flex-shrink-0" />
        Syncing with Steam…
      </div>
    );
  }

  if (result?.restricted) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-400/80">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60 flex-shrink-0" />
        Sync paused · library is private
      </div>
    );
  }

  if (result?.error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-400">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0" />
        {result.error}
      </div>
    );
  }

  const sessions = result?.sessionsCreated ?? 0;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-700/60 px-3 py-2 text-xs text-slate-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
      {sessions > 0
        ? `Synced — ${sessions} new session${sessions > 1 ? "s" : ""} detected`
        : `Library up to date · ${result?.imported ?? 0} games`}
    </div>
  );
}
