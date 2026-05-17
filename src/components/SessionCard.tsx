"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { RunProp, AchievementProp, ScreenshotProp } from "./RunManager";
import MusicSearch from "./MusicSearch";
import type { MusicResult } from "@/app/api/music/search/route";

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function TrackThumb({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);
  const icon = (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
      <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
    </svg>
  );
  if (!url || failed) {
    return <div className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center flex-shrink-0">{icon}</div>;
  }
  return (
    <div className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
      {icon}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setFailed(true)} />
    </div>
  );
}

function MusicDisplay({ raw }: { raw: string }) {
  let tracks: MusicResult[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) tracks = parsed;
    else if (parsed?.id) tracks = [parsed]; // single object from previous format
  } catch { /* legacy plain text */ }

  if (tracks.length > 0) {
    return (
      <div className="space-y-1.5 mt-1">
        {tracks.map((t) => (
          <div key={t.id} className="flex items-center gap-2">
            <TrackThumb url={t.imageUrl} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{t.name}</p>
              <p className="text-[11px] text-slate-500 truncate">
                {t.artist}{t.album ? ` · ${t.album}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Legacy plain-text entry
  return (
    <p className="text-xs text-slate-400">
      <span className="text-slate-500">Listened to —</span> {raw}
    </p>
  );
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type Props = {
  sessionId: string;
  date: string;
  duration: number | null;
  notes: string | null;
  music: string | null;
  isAuto: boolean;
  rawDateTime?: string | null;
  runs?: RunProp[];
  currentRunId?: string | null;
  showRunBadge?: boolean;
  achievements?: AchievementProp[];
  initialScreenshots?: ScreenshotProp[];
};

type Mode = "view" | "edit" | "confirm-delete";

export default function SessionCard({
  sessionId, date, duration, notes, music, isAuto, rawDateTime,
  runs = [], currentRunId, showRunBadge = false,
  achievements = [], initialScreenshots = [],
}: Props) {
  const router = useRouter();
  const [mode, setMode]               = useState<Mode>("view");
  const [editNotes, setEditNotes]     = useState(notes ?? "");
  const [editMusic, setEditMusic]     = useState(music ?? "");
  const [editHours, setEditHours]     = useState(duration ? Math.floor(duration / 60) : 0);
  const [editMinutes, setEditMinutes] = useState(duration ? duration % 60 : 0);
  const [editRunId, setEditRunId]     = useState<string>(currentRunId ?? "");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [menuOpen, setMenuOpen]       = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Screenshots — managed in local state so uploads appear instantly
  const [screenshots, setScreenshots]     = useState<ScreenshotProp[]>(initialScreenshots);
  const [uploading, setUploading]         = useState(false);
  const [uploadError, setUploadError]     = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentRunName = runs.find((r) => r.id === currentRunId)?.name ?? null;

  const durationLabel = formatDuration(duration);

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  function startEdit() {
    setEditNotes(notes ?? "");
    setEditMusic(music ?? "");
    setEditHours(duration ? Math.floor(duration / 60) : 0);
    setEditMinutes(duration ? duration % 60 : 0);
    setEditRunId(currentRunId ?? "");
    setError("");
    setMode("edit");
    setMenuOpen(false);
  }

  function adjustHours(delta: number) {
    setEditHours((h) => Math.max(0, Math.min(99, h + delta)));
  }
  function adjustMinutes(delta: number) {
    setEditMinutes((m) => Math.max(0, Math.min(59, m + delta)));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const durationMinutes = editHours * 60 + editMinutes || null;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editNotes, music: editMusic || null, durationMinutes, runId: editRunId || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMode("view");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setError("Delete failed");
      setSaving(false);
      setMode("view");
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setUploadError("Only JPEG, PNG, GIF, and WebP are supported");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("Image must be under 10 MB");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`/api/sessions/${sessionId}/screenshots`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Upload failed");
      }
      const { id: sid, url } = await res.json();
      setScreenshots((prev) => [...prev, { id: sid, url }]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteScreenshot(sid: string) {
    await fetch(`/api/screenshots/${sid}`, { method: "DELETE" }).catch(() => {});
    setScreenshots((prev) => prev.filter((s) => s.id !== sid));
  }

  const stepBtn = "w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-slate-600 text-sm font-medium transition-colors select-none";

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-400">{date}</p>
        <div className="flex items-center gap-2.5">
          {mode === "view" && durationLabel && (
            <span className="rounded px-2 py-0.5 text-[10px] font-medium bg-slate-700 text-slate-400">
              {durationLabel}
            </span>
          )}
          {showRunBadge && currentRunName && (
            <span className="rounded px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
              {currentRunName}
            </span>
          )}
          {isAuto && (
            <span className="text-[10px] text-slate-500">
              auto-detected{rawDateTime ? ` · ${formatTime(rawDateTime)}` : ""}
            </span>
          )}

          {mode === "view" && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center justify-center w-6 h-5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors text-base leading-none tracking-widest"
                title="Options"
              >
                ···
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 w-28 rounded-lg border border-slate-700 bg-slate-800 shadow-xl py-1 text-xs">
                  <button
                    onClick={startEdit}
                    className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setMode("confirm-delete"); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-slate-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {mode === "view" && (
        <div className="space-y-3">
          {notes
            ? <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{notes}</p>
            : <p className="text-xs text-slate-500 italic">No notes.</p>
          }
          {music && <MusicDisplay raw={music} />}
          {achievements.length > 0 && (
            <div className="pt-1 space-y-1.5 border-t border-slate-700/60">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Achievements unlocked</p>
              {achievements.map((a) => (
                <div key={a.id} className="flex items-start gap-2">
                  <span className="mt-0.5 h-3 w-3 rounded-sm bg-amber-500/20 border border-amber-500/40 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-amber-400/90">{a.displayName}</span>
                    {a.description && (
                      <span className="text-xs text-slate-500"> — {a.description}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Screenshot gallery */}
          {(screenshots.length > 0 || true) && (
            <div className={screenshots.length > 0 ? "pt-1 border-t border-slate-700/60 space-y-2" : ""}>
              {screenshots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {screenshots.map((s) => (
                    <div key={s.id} className="relative group w-24 h-20 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={s.url}
                          alt="Session screenshot"
                          className="w-full h-full object-cover rounded-lg bg-slate-700"
                        />
                      </a>
                      <button
                        onClick={() => handleDeleteScreenshot(s.id)}
                        className="absolute top-1 right-1 h-5 w-5 rounded flex items-center justify-center bg-slate-900/80 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none"
                        title="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleUpload}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
                >
                  {uploading ? "Uploading…" : screenshots.length > 0 ? "+ Add photo" : "+ Add photo"}
                </button>
                {uploadError && <span className="text-xs text-rose-400">{uploadError}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "edit" && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Duration <span className="text-slate-500">(optional)</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1">
                <button type="button" onClick={() => adjustHours(-1)} className={stepBtn}>−</button>
                <span className="w-7 text-center text-sm text-slate-100 tabular-nums">{editHours}</span>
                <button type="button" onClick={() => adjustHours(1)} className={stepBtn}>+</button>
              </div>
              <span className="text-xs text-slate-400">h</span>
              <div className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1">
                <button type="button" onClick={() => adjustMinutes(-1)} className={stepBtn}>−</button>
                <span className="w-7 text-center text-sm text-slate-100 tabular-nums">{String(editMinutes).padStart(2, "0")}</span>
                <button type="button" onClick={() => adjustMinutes(1)} className={stepBtn}>+</button>
              </div>
              <span className="text-xs text-slate-400">m</span>
            </div>
          </div>

          {runs.length > 0 && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Playthrough</label>
              <select
                value={editRunId}
                onChange={(e) => setEditRunId(e.target.value)}
                className="h-8 rounded-lg border border-slate-600 bg-slate-700 px-2.5 text-sm text-slate-100 focus:border-slate-400 focus:outline-none"
              >
                <option value="">No playthrough</option>
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={5}
            autoFocus
            placeholder="Notes for this session…"
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none resize-y leading-relaxed"
          />
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Listened to <span className="text-slate-500">(optional)</span>
            </label>
            <MusicSearch
              value={editMusic}
              onChange={setEditMusic}
              placeholder="Search for a track"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-white text-slate-900 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setMode("view")}
              disabled={saving}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            {error && <span className="text-xs text-rose-400">{error}</span>}
          </div>
        </div>
      )}

      {mode === "confirm-delete" && (
        <div className="flex items-center gap-3 mt-1.5">
          <p className="text-xs text-slate-400">Delete this entry?</p>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-40 transition-colors"
          >
            {saving ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            onClick={() => setMode("view")}
            disabled={saving}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          {error && <span className="text-xs text-rose-400">{error}</span>}
        </div>
      )}
    </div>
  );
}
