"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RunProp } from "./RunManager";

type Props = {
  shelfEntryId: string;
  runs?: RunProp[];
  defaultRunId?: string;
};

export default function LogSessionForm({ shelfEntryId, runs = [], defaultRunId }: Props) {
  const router = useRouter();
  const todayLocal = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const [date, setDate]       = useState(todayLocal);
  const [hours, setHours]     = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [notes, setNotes]     = useState("");
  const [music, setMusic]     = useState("");
  const [runId, setRunId]     = useState<string>(defaultRunId ?? "");
  const [saving, setSaving]   = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function adjustHours(delta: number) {
    setHours((h) => Math.max(0, Math.min(99, h + delta)));
  }
  function adjustMinutes(delta: number) {
    setMinutes((m) => Math.max(0, Math.min(59, m + delta)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const durationMinutes = hours * 60 + minutes || undefined;

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shelfEntryId,
          date,
          notes,
          music: music || null,
          durationMinutes,
          runId: runId || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      setNotes("");
      setMusic("");
      setHours(0);
      setMinutes(0);
      setDate(todayLocal);
      setRunId(defaultRunId ?? "");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const stepBtn = "w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-slate-600 text-sm font-medium transition-colors select-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-5 items-end">
        {/* Date */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-400">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="h-8 rounded-lg border border-slate-600 bg-slate-700 px-2.5 py-1 text-sm text-slate-100 focus:border-slate-400 focus:outline-none [color-scheme:dark]"
          />
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-400">
            Duration <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1">
              <button type="button" onClick={() => adjustHours(-1)} className={stepBtn}>−</button>
              <span className="w-7 text-center text-sm text-slate-100 tabular-nums">{hours}</span>
              <button type="button" onClick={() => adjustHours(1)} className={stepBtn}>+</button>
            </div>
            <span className="text-xs text-slate-400">h</span>
            <div className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1">
              <button type="button" onClick={() => adjustMinutes(-1)} className={stepBtn}>−</button>
              <span className="w-7 text-center text-sm text-slate-100 tabular-nums">{String(minutes).padStart(2, "0")}</span>
              <button type="button" onClick={() => adjustMinutes(1)} className={stepBtn}>+</button>
            </div>
            <span className="text-xs text-slate-400">m</span>
          </div>
        </div>
      </div>

      {/* Playthrough selector — only shown when runs exist */}
      {runs.length > 0 && (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-400">
            Playthrough <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <select
            value={runId}
            onChange={(e) => setRunId(e.target.value)}
            className="h-8 rounded-lg border border-slate-600 bg-slate-700 px-2.5 py-1 text-sm text-slate-100 focus:border-slate-400 focus:outline-none"
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
        placeholder="What happened this session? How did it feel?"
        rows={4}
        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none resize-y leading-relaxed"
      />

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-400">
          Listened to <span className="text-slate-500 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={music}
          onChange={(e) => setMusic(e.target.value)}
          placeholder="Song, album, or playlist you had on"
          className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-white text-slate-900 px-4 py-1.5 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "Log entry"}
        </button>
        {errorMsg && <span className="text-xs text-rose-400">{errorMsg}</span>}
      </div>
    </form>
  );
}
