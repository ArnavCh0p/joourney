"use client";
import { useEffect, useState } from "react";

export default function TitleBar() {
  const [mounted, setMounted]   = useState(false);
  const [isTauri, setIsTauri]   = useState(false);
  const [isMaximized, setIsMax] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tauri =
      typeof window !== "undefined" &&
      (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ !== undefined;
    setIsTauri(tauri);
    if (!tauri) return;
    (async () => {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      setIsMax(await win.isMaximized());
      await win.onResized(async () => setIsMax(await win.isMaximized()));
    })();
  }, []);

  if (!mounted || !isTauri) return null;

  async function minimize() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().minimize();
  }
  async function toggleMaximize() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    if (await win.isFullscreen()) await win.setFullscreen(false);
    else await win.toggleMaximize();
  }
  async function closeWindow() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
  }

  return (
    <div
      data-tauri-drag-region
      className="h-8 w-full bg-slate-900 flex items-center justify-end flex-shrink-0 select-none"
    >
      <div className="flex items-center">
        <button
          onClick={minimize}
          aria-label="Minimize"
          className="h-8 w-11 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-colors text-base leading-none"
        >
          −
        </button>
        <button
          onClick={toggleMaximize}
          aria-label={isMaximized ? "Restore" : "Maximize"}
          className="h-8 w-11 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-colors"
        >
          {isMaximized ? (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="2" y="0.6" width="6.4" height="6.4" />
              <path d="M0.6 2.6 L0.6 8.4 L6.4 8.4" />
            </svg>
          ) : (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="0.6" y="0.6" width="7.8" height="7.8" />
            </svg>
          )}
        </button>
        <button
          onClick={closeWindow}
          aria-label="Close"
          className="h-8 w-11 flex items-center justify-center text-slate-500 hover:text-white hover:bg-rose-600 transition-colors text-base leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
