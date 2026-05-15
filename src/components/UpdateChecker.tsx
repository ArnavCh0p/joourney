"use client";
import { useEffect, useState } from "react";

type Status = "idle" | "available" | "downloading" | "ready" | "error";

export default function UpdateChecker() {
  const [status, setStatus]       = useState<Status>("idle");
  const [version, setVersion]     = useState<string | null>(null);
  const [progress, setProgress]   = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isTauri =
      typeof window !== "undefined" &&
      (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ !== undefined;
    if (!isTauri) return;

    // Delay check so it doesn't compete with initial page load
    const t = setTimeout(async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        if (update) {
          setVersion(update.version);
          setStatus("available");
        }
      } catch {
        // Fail silently — updater errors shouldn't surface to the user
      }
    }, 4000);

    return () => clearTimeout(t);
  }, []);

  async function installUpdate() {
    setStatus("downloading");
    setProgress(0);
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update) return;

      let downloaded = 0;
      let total = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (total > 0) setProgress(Math.round((downloaded / total) * 100));
            break;
          case "Finished":
            setStatus("ready");
            break;
        }
      });
    } catch {
      setStatus("error");
    }
  }

  async function restart() {
    try {
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch {
      setDismissed(true);
    }
  }

  if (dismissed || status === "idle") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9998] w-72 rounded-xl border border-slate-600 bg-slate-800 shadow-2xl p-4">
      {status === "available" && (
        <>
          <p className="text-sm font-semibold text-slate-100 mb-0.5">Update available</p>
          <p className="text-xs text-slate-400 mb-3">Version {version} is ready to install.</p>
          <div className="flex gap-2">
            <button
              onClick={installUpdate}
              className="flex-1 rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
            >
              Update now
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Later
            </button>
          </div>
        </>
      )}

      {status === "downloading" && (
        <>
          <p className="text-sm font-semibold text-slate-100 mb-2">Downloading update…</p>
          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">{progress}%</p>
        </>
      )}

      {status === "ready" && (
        <>
          <p className="text-sm font-semibold text-slate-100 mb-0.5">Ready to restart</p>
          <p className="text-xs text-slate-400 mb-3">Update installed. Restart to apply it.</p>
          <button
            onClick={restart}
            className="w-full rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
          >
            Restart now
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <p className="text-sm font-semibold text-slate-100 mb-0.5">Update failed</p>
          <p className="text-xs text-slate-400 mb-3">Couldn&apos;t install the update. Try again later.</p>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Dismiss
          </button>
        </>
      )}
    </div>
  );
}
