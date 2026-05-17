"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogSessionForm from "./LogSessionForm";
import SessionNoteEditor from "./SessionNoteEditor";
import SessionCard from "./SessionCard";

export type RunProp = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

export type SessionProp = {
  id: string;
  date: string;       // formatted for display, e.g. "November 1, 2024"
  rawDate: string;    // YYYY-MM-DD UTC, used for matching achievements
  durationMinutes: number | null;
  notes: string | null;
  music: string | null;
  autoDetected: boolean;
  runId: string | null;
  screenshots: ScreenshotProp[];
};

export type AchievementProp = {
  id: string;
  displayName: string;
  description: string | null;
  unlockedDate: string; // YYYY-MM-DD UTC
};

export type ScreenshotProp = {
  id: string;
  url: string;
};

type Props = {
  shelfEntryId: string;
  runs: RunProp[];
  sessions: SessionProp[];
  achievements: AchievementProp[];
};

const BULK_THRESHOLD = 3; // pending sessions before collapsing into bulk card

// ── BulkPendingCard ──────────────────────────────────────────────────────────

type BulkProps = {
  sessions: SessionProp[];
  runs: RunProp[];
  onDone: () => void;
  onExpand: () => void;
};

function BulkPendingCard({ sessions, runs, onDone, onExpand }: BulkProps) {
  const [writing, setWriting]   = useState(false);
  const [note, setNote]         = useState("");
  const [runId, setRunId]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  // Date range label
  const dates = sessions.map((s) => s.date);
  const earliest = dates[dates.length - 1]; // sessions are newest-first
  const latest   = dates[0];
  const rangeLabel = earliest === latest ? latest : `${earliest} – ${latest}`;

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  const durationLabel = totalMinutes > 0
    ? (() => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        if (h > 0 && m > 0) return `~${h}h ${m}m total`;
        if (h > 0) return `~${h}h total`;
        return `~${m}m total`;
      })()
    : null;

  async function handleBulkNote() {
    if (!note.trim()) return;
    setSaving(true);
    setError("");
    try {
      await Promise.all(
        sessions.map((s) =>
          fetch(`/api/sessions/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: note, runId: runId || null }),
          })
        )
      );
      onDone();
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  }

  async function handleDismiss() {
    setSaving(true);
    try {
      await Promise.all(
        sessions.map((s) =>
          fetch(`/api/sessions/${s.id}`, { method: "DELETE" })
        )
      );
      onDone();
    } catch {
      setError("Dismiss failed");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <p className="text-xs font-semibold text-slate-200">
              {sessions.length} sessions unlogged
            </p>
          </div>
          <p className="text-[11px] text-slate-500 pl-3.5">
            {rangeLabel}{durationLabel && <> · {durationLabel}</>}
          </p>
        </div>
        <button
          onClick={onExpand}
          className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
        >
          Show individually
        </button>
      </div>

      {/* Write a note toggle */}
      {!writing ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWriting(true)}
            className="rounded-lg bg-white text-slate-900 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            Write a note for this period
          </button>
          <button
            onClick={handleDismiss}
            disabled={saving}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-40"
          >
            {saving ? "Dismissing…" : "Dismiss all"}
          </button>
          {error && <span className="text-xs text-rose-400">{error}</span>}
        </div>
      ) : (
        <div className="space-y-3">
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
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`What happened across these ${sessions.length} sessions?`}
            rows={4}
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none resize-none leading-relaxed"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkNote}
              disabled={saving || !note.trim()}
              className="rounded-lg bg-white text-slate-900 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : "Save note"}
            </button>
            <button
              onClick={() => { setWriting(false); setNote(""); }}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            {error && <span className="text-xs text-rose-400">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

const RUN_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
};

const RUN_STATUS_COLOR: Record<string, string> = {
  ACTIVE: "text-emerald-400",
  COMPLETED: "text-sky-400",
  ABANDONED: "text-rose-400",
};

export default function RunManager({ shelfEntryId, runs: initialRuns, sessions, achievements }: Props) {
  const router = useRouter();
  const [runs, setRuns] = useState<RunProp[]>(initialRuns);
  const [selectedRunId, setSelectedRunId] = useState<string | "all">("all");
  const [creatingRun, setCreatingRun] = useState(false);
  const [newRunName, setNewRunName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [bulkExpanded, setBulkExpanded] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const hasRuns = runs.length > 0;

  // Max tabs before collapsing into overflow menu
  const MAX_TABS = 3;

  const filteredSessions =
    selectedRunId === "all"
      ? sessions
      : sessions.filter((s) => s.runId === selectedRunId);

  const pendingSessions = filteredSessions.filter(
    (s) => s.autoDetected && !s.notes
  );
  const completedSessions = filteredSessions.filter(
    (s) => s.notes || !s.autoDetected
  );

  const selectedRun = runs.find((r) => r.id === selectedRunId) ?? null;

  useEffect(() => {
    if (!moreMenuOpen) return;
    function handle(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [moreMenuOpen]);

  async function createRun() {
    const name = newRunName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/games/${shelfEntryId}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed");
      const created: RunProp = await res.json();
      setRuns((prev) => [...prev, created]);
      setSelectedRunId(created.id);
      setNewRunName("");
      setCreatingRun(false);
      router.refresh();
    } catch {
      // silently ignore — user can retry
    } finally {
      setSaving(false);
    }
  }

  async function deleteRun(runId: string) {
    setSaving(true);
    try {
      await fetch(`/api/games/${shelfEntryId}/runs/${runId}`, { method: "DELETE" });
      setRuns((prev) => prev.filter((r) => r.id !== runId));
      if (selectedRunId === runId) setSelectedRunId("all");
      setDeleteConfirmId(null);
      router.refresh();
    } catch {
      // silently ignore
    } finally {
      setSaving(false);
    }
  }

  async function updateRunStatus(runId: string, status: string) {
    setSaving(true);
    try {
      await fetch(`/api/games/${shelfEntryId}/runs/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRuns((prev) =>
        prev.map((r) => (r.id === runId ? { ...r, status } : r))
      );
    } catch {
      // silently ignore
    } finally {
      setSaving(false);
    }
  }

  async function commitRename(runId: string) {
    const name = renameValue.trim();
    if (!name) { setRenamingId(null); return; }
    setSaving(true);
    try {
      await fetch(`/api/games/${shelfEntryId}/runs/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, name } : r)));
      setRenamingId(null);
    } catch {
      // silently ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-300">Journal</h2>
          {sessions.length > 0 && (
            <span className="text-xs text-slate-500">
              {sessions.length} {sessions.length === 1 ? "entry" : "entries"}
            </span>
          )}
        </div>
        <button
          onClick={() => { setCreatingRun(true); setSelectedRunId("all"); }}
          className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:border-slate-500 hover:text-slate-100 transition-colors"
        >
          + New Playthrough
        </button>
      </div>

      {/* ── Run tabs (only when runs exist) ── */}
      {hasRuns && (() => {
        // If the selected run would be in the overflow group, pull it into visible slots
        const selectedIsOverflow =
          selectedRunId !== "all" && runs.findIndex((r) => r.id === selectedRunId) >= MAX_TABS;

        let visibleRuns: RunProp[];
        let overflowRuns: RunProp[];

        if (selectedIsOverflow) {
          const selectedRun = runs.find((r) => r.id === selectedRunId)!;
          const rest = runs.filter((r) => r.id !== selectedRunId);
          visibleRuns = [...rest.slice(0, MAX_TABS - 1), selectedRun];
          overflowRuns = rest.slice(MAX_TABS - 1);
        } else {
          visibleRuns = runs.slice(0, MAX_TABS);
          overflowRuns = runs.slice(MAX_TABS);
        }

        const tabClass = (active: boolean) =>
          `flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            active
              ? "bg-slate-700 text-slate-100"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`;

        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedRunId("all")}
              className={tabClass(selectedRunId === "all")}
            >
              All entries
            </button>

            {visibleRuns.map((run) => (
              <button
                key={run.id}
                onClick={() => setSelectedRunId(run.id)}
                className={tabClass(selectedRunId === run.id)}
              >
                {run.name}
                {run.status !== "ACTIVE" && (
                  <span className={`text-[10px] ${RUN_STATUS_COLOR[run.status] ?? "text-slate-500"}`}>
                    · {RUN_STATUS_LABEL[run.status] ?? run.status}
                  </span>
                )}
              </button>
            ))}

            {overflowRuns.length > 0 && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen((v) => !v)}
                  className={tabClass(overflowRuns.some((r) => r.id === selectedRunId))}
                >
                  {overflowRuns.some((r) => r.id === selectedRunId)
                    ? `${overflowRuns.find((r) => r.id === selectedRunId)!.name} ▾`
                    : `+${overflowRuns.length} more ▾`}
                </button>
                {moreMenuOpen && (
                  <div className="absolute left-0 top-full mt-1 z-30 min-w-[180px] rounded-lg border border-slate-700 bg-slate-800 shadow-xl py-1">
                    {overflowRuns.map((run) => (
                      <button
                        key={run.id}
                        onClick={() => { setSelectedRunId(run.id); setMoreMenuOpen(false); }}
                        className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 text-xs transition-colors ${
                          selectedRunId === run.id
                            ? "text-slate-100 bg-slate-700"
                            : "text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <span className="truncate">{run.name}</span>
                        {run.status !== "ACTIVE" && (
                          <span className={`flex-shrink-0 text-[10px] ${RUN_STATUS_COLOR[run.status] ?? "text-slate-500"}`}>
                            {RUN_STATUS_LABEL[run.status] ?? run.status}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Selected run controls ── */}
      {selectedRun && (
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-4 py-3 flex flex-wrap items-center gap-3">
          {renamingId === selectedRun.id ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => commitRename(selectedRun.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename(selectedRun.id);
                if (e.key === "Escape") setRenamingId(null);
              }}
              className="flex-1 min-w-0 text-sm text-slate-100 bg-transparent border-b border-slate-500 focus:outline-none pb-0.5"
            />
          ) : (
            <button
              onClick={() => { setRenamingId(selectedRun.id); setRenameValue(selectedRun.name); }}
              className="text-sm font-medium text-slate-200 hover:text-white transition-colors"
              title="Click to rename"
            >
              {selectedRun.name}
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {selectedRun.status === "ACTIVE" && (
              <>
                <button
                  disabled={saving}
                  onClick={() => updateRunStatus(selectedRun.id, "COMPLETED")}
                  className="text-xs text-slate-400 hover:text-sky-400 transition-colors disabled:opacity-40"
                >
                  Mark complete
                </button>
                <button
                  disabled={saving}
                  onClick={() => updateRunStatus(selectedRun.id, "ABANDONED")}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-40"
                >
                  Abandon
                </button>
              </>
            )}
            {selectedRun.status !== "ACTIVE" && (
              <button
                disabled={saving}
                onClick={() => updateRunStatus(selectedRun.id, "ACTIVE")}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-40"
              >
                Reactivate
              </button>
            )}

            {deleteConfirmId === selectedRun.id ? (
              <span className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Delete playthrough?</span>
                <button
                  disabled={saving}
                  onClick={() => deleteRun(selectedRun.id)}
                  className="text-rose-400 hover:text-rose-300 font-medium transition-colors disabled:opacity-40"
                >
                  {saving ? "Deleting…" : "Yes"}
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setDeleteConfirmId(selectedRun.id)}
                className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── New playthrough form ── */}
      {creatingRun && (
        <div className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-4 space-y-3">
          <p className="text-xs font-semibold text-slate-300">Name this playthrough</p>
          <input
            autoFocus
            type="text"
            value={newRunName}
            onChange={(e) => setNewRunName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createRun();
              if (e.key === "Escape") { setCreatingRun(false); setNewRunName(""); }
            }}
            placeholder="e.g. First playthrough, Modded run, Nightmare…"
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={createRun}
              disabled={saving || !newRunName.trim()}
              className="rounded-lg bg-white text-slate-900 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              {saving ? "Creating…" : "Create playthrough"}
            </button>
            <button
              onClick={() => { setCreatingRun(false); setNewRunName(""); }}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Pending auto-detected sessions ── */}
      {pendingSessions.length >= BULK_THRESHOLD && !bulkExpanded ? (
        <BulkPendingCard
          sessions={pendingSessions}
          runs={runs}
          onDone={() => router.refresh()}
          onExpand={() => setBulkExpanded(true)}
        />
      ) : (
        pendingSessions.map((s) => (
          <SessionNoteEditor
            key={s.id}
            sessionId={s.id}
            date={s.date}
            duration={s.durationMinutes}
            runs={runs}
            currentRunId={s.runId}
          />
        ))
      )}

      {/* ── New manual entry form ── */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-5">
        <p className="text-xs font-semibold text-slate-300 mb-3">New entry</p>
        <LogSessionForm
          shelfEntryId={shelfEntryId}
          runs={runs}
          defaultRunId={selectedRunId !== "all" ? selectedRunId : undefined}
        />
      </div>

      {/* ── Past entries ── */}
      {completedSessions.length > 0 && (
        <div className="space-y-4">
          {completedSessions.map((s) => (
            <SessionCard
              key={s.id}
              sessionId={s.id}
              date={s.date}
              duration={s.durationMinutes}
              notes={s.notes}
              music={s.music}
              isAuto={s.autoDetected}
              runs={runs}
              currentRunId={s.runId}
              showRunBadge={selectedRunId === "all" && hasRuns}
              achievements={achievements.filter((a) => a.unlockedDate === s.rawDate)}
              initialScreenshots={s.screenshots}
            />
          ))}
        </div>
      )}

      {filteredSessions.length === 0 && !creatingRun && (
        <p className="text-xs text-slate-500 text-center py-6">
          {selectedRunId === "all"
            ? "No entries yet — log your first session above."
            : "No entries in this playthrough yet."}
        </p>
      )}
    </div>
  );
}
