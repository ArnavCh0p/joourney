"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RunProp } from "./RunManager";
import MusicSearch from "./MusicSearch";

function formatDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

type Props = {
  sessionId: string;
  date: string;
  duration: number | null;
  runs?: RunProp[];
  currentRunId?: string | null;
};

export default function SessionNoteEditor({ sessionId, date, duration, runs = [], currentRunId }: Props) {
  const router  = useRouter();
  const [notes, setNotes]   = useState("");
  const [music, setMusic]   = useState("");
  const [runId, setRunId]   = useState<string>(currentRunId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const durationLabel = formatDuration(duration);

  async function handleSave() {
    if (!notes.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, music: music || null, runId: runId || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <p className="text-xs font-semibold text-slate-200">{date}</p>
        </div>
        <div className="flex items-center gap-2">
          {durationLabel ? (
            <span className="rounded px-2 py-0.5 text-[10px] font-medium bg-slate-700 text-slate-300">
              {durationLabel}
            </span>
          ) : (
            <span className="text-[10px] text-slate-500">duration unknown</span>
          )}
          <span className="text-[10px] text-slate-500">auto-detected · no notes yet</span>
        </div>
      </div>

      {/* Run selector — appears when playthroughs exist so user can route this session correctly */}
      {runs.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 flex-shrink-0">Assign to:</span>
          <select
            value={runId}
            onChange={(e) => setRunId(e.target.value)}
            className="h-7 rounded-md border border-slate-600 bg-slate-700 px-2 text-xs text-slate-200 focus:border-slate-400 focus:outline-none"
          >
            <option value="">No playthrough</option>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What happened this session? Anything worth remembering?"
        rows={4}
        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none resize-none leading-relaxed"
        autoFocus
      />

      <MusicSearch
        value={music}
        onChange={setMusic}
        placeholder="Search for a track"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !notes.trim()}
          className="rounded-lg bg-white text-slate-900 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving…" : "Save notes"}
        </button>
        {error && <span className="text-xs text-rose-400">{error}</span>}
      </div>
    </div>
  );
}
